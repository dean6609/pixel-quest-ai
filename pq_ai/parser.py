"""Parse MediaWiki wikitext into structured data models."""

import re
import logging
from typing import Optional

from . import config
from .models import Item, WeaponStats, Enemy, Location

logger = logging.getLogger(__name__)


def parse_item_wikitext(title: str, wikitext: str) -> Optional[Item]:
    """Parse a PQ_Item template from wikitext into an Item dataclass."""
    if not wikitext:
        return None
    
    item = Item(name=title)
    
    # Extract template parameters from {{PQ Item ...}}
    params = _extract_template_params(wikitext, "PQ Item")
    
    if not params:
        # Try alternate template name
        params = _extract_template_params(wikitext, "PQ_Item")
    
    if not params:
        logger.debug(f"No PQ_Item template found in {title}")
        return None
    
    # Normalize template parameters: replace {{!}} with | and {{=}} with =
    for key in params:
        params[key] = params[key].replace("{{!}}", "|").replace("{{=}}", "=")
    
    # Parse head section for tier and weapon type
    head = params.get("head", "")
    item.tier = _extract_tier(head)
    item.weapon_type = _extract_weapon_type(head)
    
    # Parse description
    desc = params.get("desc", "")
    item.description = _strip_wiki_markup(desc)
    
    # Parse information table
    info = params.get("information", "")
    _parse_information_table(info, item)
    
    # Parse weapon stats
    weapon_text = params.get("weapon", "")
    if weapon_text:
        item.weapon_stats = _parse_weapon_stats(weapon_text)
    
    # Parse armor stats
    armor_text = params.get("armor", "")
    if armor_text:
        item.armor_stats = _parse_armor_stats(armor_text)
    
    # Parse dropped_by
    dropped_text = params.get("dropped_by", "")
    if dropped_text:
        item.dropped_by = _extract_dropped_by(dropped_text)
    
    # Parse categories
    cats_text = params.get("categories", "")
    if cats_text:
        item.categories = _extract_categories(cats_text)
    
    # Determine item type from categories
    item.item_type = _determine_item_type(item.categories, item.weapon_type)
    
    # Parse on_equip stats
    on_equip_text = params.get("on_equip", "")
    if on_equip_text:
        item.on_equip = _parse_on_equip(on_equip_text)
    
    return item


def parse_enemy_wikitext(title: str, wikitext: str) -> Optional[Enemy]:
    """Parse an enemy page using the PQ Entity template."""
    if not wikitext:
        return None
    
    enemy = Enemy(name=title)
    
    # The wiki uses {{PQ Entity}}, NOT {{PQ Enemy}}
    params = _extract_template_params(wikitext, "PQ Entity")
    
    # Normalize template parameters: replace {{!}} with |
    for key in params:
        params[key] = params[key].replace("{{!}}", "|")
    
    if params:
        # Parse statistics HTML table
        stats_html = params.get("statistics", "")
        _parse_entity_statistics(stats_html, enemy)
        
        # Parse found_in locations
        found_in = params.get("found_in", "")
        _parse_entity_locations(found_in, enemy)
        
        # Parse loot/drops
        loot = params.get("loot", "")
        _parse_entity_loot(loot, enemy)
        
        # Entity type from found_in or name
        if "(Dungeon Boss)" in wikitext or "(Boss)" in wikitext:
            enemy.entity_type = "boss"
        else:
            enemy.entity_type = "regular"
    else:
        # Fallback: try old template name
        params = _extract_template_params(wikitext, "PQ Enemy")
        if params:
            info = params.get("information", "")
            if "HP" in info:
                m = re.search(r'\*\*HP\*\*\s*(?:\|=)?\s*([^\n|]+)', info)
                if m:
                    enemy.hp = m.group(1).strip()
            if "Damage" in info:
                m = re.search(r'\*\*Damage\*\*\s*(?:\|=)?\s*([^\n|]+)', info)
                if m:
                    enemy.damage = m.group(1).strip()
            enemy.description = _strip_wiki_markup(params.get("desc", ""))
    
    # Extract categories
    cats = _extract_categories(wikitext)
    if "Bosses" in cats:
        enemy.entity_type = "boss"
        enemy.category = "Bosses"
    elif "Enemies" in cats:
        enemy.category = "Enemies"
    elif "Friendlies" in cats:
        enemy.category = "Friendlies"
    elif "NPCs" in cats:
        enemy.entity_type = "npc"
        enemy.category = "NPCs"
    
    return enemy


def parse_location_wikitext(title: str, wikitext: str) -> Optional[Location]:
    """Parse a location/dungeon page."""
    if not wikitext:
        return None
    
    loc = Location(name=title)
    
    params = _extract_template_params(wikitext, "PQ Location")
    if not params:
        params = _extract_template_params(wikitext, "PQ_Location")
    
    # Normalize template parameters: replace {{!}} with |
    for key in params:
        params[key] = params[key].replace("{{!}}", "|")
    
    if params:
        # Parse difficulty from skull images
        diff_text = params.get("difficulty", "")
        loc.difficulty = diff_text.count("skull_difficulty")
        
        # Parse portal table
        portal = params.get("portal_table", "")
        _parse_portal_table(portal, loc)
        
        # Parse found entities
        found_entities = params.get("found_entities", "")
        _parse_found_entities(found_entities, loc)
    
    # Determine type
    cats = _extract_categories(wikitext)
    if "Dungeon" in cats:
        loc.location_type = "dungeon"
    elif "Locations" in cats:
        loc.location_type = "location"
    
    return loc


def _extract_template_params(wikitext: str, template_name: str) -> dict:
    """Extract parameters from a MediaWiki template."""
    # Pattern to match {{TemplateName
    # ... |param=value ... }}
    pattern = r'\{\{\s*' + re.escape(template_name) + r'\s*((?:\|[^}]*)+)\}\}'
    
    # First try to find the template with proper nesting
    # MediaWiki templates can have nested {{}} so we need to handle that
    start_markers = []
    start = -1
    depth = 0
    
    lines = wikitext.split('\n')
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('{{' + template_name) or stripped.startswith('{{' + template_name.replace(' ', '_')):
            start = i
            depth = 1
            start_markers = [(i, stripped)]
        elif start >= 0:
            depth += stripped.count('{{') - stripped.count('}}')
            if depth <= 0:
                # Found end
                template_text = '\n'.join(lines[start:i+1])
                return _parse_template_params(template_text)
    
    # Fallback: try regex
    match = re.search(pattern, wikitext, re.DOTALL)
    if match:
        return _parse_template_params('{{' + template_name + match.group(1) + '}}')
    
    return {}


def _parse_template_params(template_text: str) -> dict:
    """Parse key=value pairs from a template string."""
    params = {}
    
    # Remove the template wrapper
    # Handle nested {{...}}
    text = template_text.strip()
    if text.startswith('{{'):
        text = text[2:]
    if text.endswith('}}'):
        text = text[:-2]
    
    # Remove template name (first pipe or first word)
    first_pipe = text.find('|')
    if first_pipe >= 0:
        text = text[first_pipe + 1:]
    else:
        return params
    
    # Parse parameters handling nested brackets
    current_key = ""
    current_value = ""
    depth = 0
    in_key = True
    
    i = 0
    while i < len(text):
        ch = text[i]
        
        if ch == '|' and depth == 0:
            # Save previous param
            if current_key:
                params[current_key.strip()] = current_value.strip()
            current_key = ""
            current_value = ""
            in_key = True
            i += 1
            continue
        
        if ch == '=' and in_key and depth == 0:
            in_key = False
            i += 1
            continue
        
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth = max(0, depth - 1)
        
        if in_key:
            current_key += ch
        else:
            current_value += ch
        
        i += 1
    
    # Save last parameter
    if current_key:
        params[current_key.strip()] = current_value.strip()
    
    return params


def _extract_tier(head_text: str) -> str:
    """Extract tier from the head section."""
    tier_map = {
        "tier_star": "LG",
        "tier_corrupted": "CORRUPTED",
        "tier_0": "T0", "tier_1": "T1", "tier_2": "T2",
        "tier_3": "T3", "tier_4": "T4", "tier_5": "T5",
        "tier_6": "T6", "tier_7": "T7", "tier_8": "T8",
    }
    text_lower = head_text.lower()
    for key, value in tier_map.items():
        if key in text_lower:
            return value
    
    # Also look for bold text patterns like "Tier LG", "Tier T3"
    m = re.search(r"'''Tier\s+(LG|CORRUPTED|T[0-8])'''", head_text)
    if m:
        return m.group(1)
    
    m = re.search(r"Tier\s+(LG|CORRUPTED|T[0-8])", head_text)
    if m:
        return m.group(1)
    
    # Check in item categories
    return ""


def _extract_weapon_type(head_text: str) -> str:
    """Extract weapon type from head section."""
    weapon_types = ["Sword", "Bow", "Staff", "Dagger", "Axe", "Fan",
                    "Incantation", "Spell", "Bomb", "Wand"]
    for wt in weapon_types:
        if wt in head_text:
            return wt
    return ""


def _strip_wiki_markup(text: str) -> str:
    """Remove MediaWiki markup from text."""
    if not text:
        return ""
    # Remove bold/italic
    text = re.sub(r"'''(.*?)'''", r"\1", text)
    text = re.sub(r"''(.*?)''", r"\1", text)
    # Remove wiki links but keep text: [[Page|text]] -> text, [[Page]] -> Page
    text = re.sub(r"\[\[([^|\]]+)\|([^\]]+)\]\]", r"\2", text)
    text = re.sub(r"\[\[([^\]]+)\]\]", r"\1", text)
    # Remove HTML tags (replace with space to avoid concatenation)
    text = re.sub(r"<[^>]+>", " ", text)
    # Remove file references
    text = re.sub(r"\[\[File:[^\]]+\]\]", "", text)
    # Clean up
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _parse_information_table(info_text: str, item: Item):
    """Parse the information table from PQ_Item template."""
    if not info_text:
        return
    
    # Extract rows from the wiki table
    rows = re.findall(r'!\s*(.*?)\s*\n\|\s*(.*?)(?=\n[!|]|\Z)', info_text, re.DOTALL)
    
    for header, value in rows:
        header_clean = _strip_wiki_markup(header).strip().lower()
        value_clean = value.strip()
        
        if "type" in header_clean:
            # Extract weapon type from hierarchy
            if "dagger" in value_clean.lower():
                item.weapon_type = "Dagger"
            elif "sword" in value_clean.lower():
                item.weapon_type = "Sword"
            elif "bow" in value_clean.lower():
                item.weapon_type = "Bow"
            elif "staff" in value_clean.lower():
                item.weapon_type = "Staff"
            elif "axe" in value_clean.lower():
                item.weapon_type = "Axe"
            elif "fan" in value_clean.lower():
                item.weapon_type = "Fan"
            elif "incantation" in value_clean.lower():
                item.weapon_type = "Incantation"
            elif "spell" in value_clean.lower():
                item.weapon_type = "Spell"
            
            # Determine broader type
            if "armor" in value_clean.lower() or "helmet" in value_clean.lower() or "boot" in value_clean.lower():
                item.item_type = "Armor"
            elif "accessory" in value_clean.lower() or "ring" in value_clean.lower() or "pendant" in value_clean.lower():
                item.item_type = "Accessory"
            elif "primary weapon" in value_clean.lower() or "weapon" in value_clean.lower():
                item.item_type = "Primary Weapon"
            elif "secondary ability" in value_clean.lower():
                item.item_type = "Secondary Ability"
            elif "consumable" in value_clean.lower():
                item.item_type = "Consumable"
        
        elif "tradable" in header_clean:
            item.tradable = "yes" in value_clean.lower()
        
        elif "drop type" in header_clean:
            m = re.search(r'drop_chest_(\d+)', value_clean)
            if m:
                item.drop_type = f"Chest T{m.group(1)}"
            m = re.search(r'drop_bag_(\d+)', value_clean)
            if m and not item.drop_type:
                item.drop_type = f"Bag T{m.group(1)}"
        
        elif "valor bonus" in header_clean:
            m = re.search(r'\+?(\d+)%', value_clean)
            if m:
                item.valor_bonus = float(m.group(1))
        
        elif "forge valor" in header_clean:
            m = re.search(r'([\d,]+)', value_clean.replace(',', ''))
            if m:
                item.forge_valor = int(m.group(1))
        
        elif "passives" in header_clean or "item passives" in header_clean:
            # Split by <br> or newlines
            passives = re.split(r'<br\s*/?>|\n', value_clean)
            item.passives = [_strip_wiki_markup(p).strip() for p in passives if _strip_wiki_markup(p).strip()]
        
        elif "properties" in header_clean:
            props = {}
            # Split by <br> first, then parse key: value pairs
            lines = re.split(r'<br\s*/?>|\n', value_clean)
            for line in lines:
                line = _strip_wiki_markup(line).strip()
                prop_matches = re.findall(r'([A-Z_]+)\s*:\s*(.+)', line)
                for k, v in prop_matches:
                    props[k] = v.strip()
            item.properties = props
        
        elif "requirements" in header_clean:
            reqs = {}
            req_matches = re.findall(r'(\d+)\s*([A-Za-z]+)', value_clean)
            for val, stat in req_matches:
                reqs[stat] = int(val)
            item.requirements = reqs
        
        elif "on equip" in header_clean:
            item.on_equip = _parse_on_equip(value_clean)


def _parse_weapon_stats(weapon_text: str) -> Optional[WeaponStats]:
    """Parse weapon stats section."""
    stats = WeaponStats()
    
    # Extract damage
    m = re.search(r'!\s*Damage\s*\n\|\s*[ \'"]*(\d+)\s*[-–]\s*(\d+)', weapon_text)
    if m:
        stats.damage = f"{m.group(1)}-{m.group(2)}"
        stats.damage_min = float(m.group(1))
        stats.damage_max = float(m.group(2))
    else:
        m = re.search(r'!\s*Damage\s*\n\|\s*[ \'"]*(\d[\d,.]*)', weapon_text)
        if m:
            stats.damage = m.group(1)
            v = float(m.group(1).replace(',', ''))
            stats.damage_min = v
            stats.damage_max = v
    
    # Extract range
    m = re.search(r'!\s*Range\s*\n\|\s*([\d.]+)', weapon_text)
    if m:
        stats.range = float(m.group(1))
    
    # Extract speed
    m = re.search(r'!\s*Speed\s*\n\|\s*([\d.]+)', weapon_text)
    if m:
        stats.speed = float(m.group(1))
    
    # Extract rate of fire
    m = re.search(r'!\s*Rate of fire\s*\n\|\s*([\d.]+)', weapon_text)
    if m:
        stats.rate_of_fire = float(m.group(1))
    
    # Extract total projectiles
    m = re.search(r'!\s*Total projectiles\s*\n\|\s*(\d+)', weapon_text)
    if m:
        stats.total_projectiles = int(m.group(1))
    
    # Extract projectile lifetime
    m = re.search(r'!\s*Projectile lifetime\s*\n\|\s*([\d.]+)', weapon_text)
    if m:
        stats.projectile_lifetime = float(m.group(1))
    
    # Extract pierces
    m = re.search(r'!\s*Pierces\s*\n\|\s*(\w+)', weapon_text)
    if m:
        stats.pierces = m.group(1).lower() == 'yes'
    
    # Extract pattern
    m = re.search(r'!\s*Pattern\s*\n\|\s*(\w+)', weapon_text)
    if m:
        stats.pattern = m.group(1)
    
    return stats


def _parse_armor_stats(armor_text: str) -> dict:
    """Parse armor stats section."""
    stats = {}
    rows = re.findall(r'!\s*(.*?)\s*\n\|\s*(.*?)(?=\n[!|]|\Z)', armor_text, re.DOTALL)
    for header, value in rows:
        key = _strip_wiki_markup(header).strip().lower()
        val = _strip_wiki_markup(value).strip()
        stats[key] = val
    
    return stats


def _extract_dropped_by(text: str) -> list:
    """Extract enemy names from the dropped_by section."""
    enemies = []
    # Replace {{!}} with | so wiki links parse correctly
    text = text.replace("{{!}}", "|")
    # Find all wiki links that are enemy pages (in the dropped_by section)
    links = re.findall(r'\[\[([^|\]]+)(?:\|[^\]]+)?\]\]', text)
    for link in links:
        # Skip file links and category links
        if link.startswith("File:") or link.startswith("Category:"):
            continue
        # Skip non-enemy pages
        if link in {"Forge NPC"}:
            continue
        enemies.append(link)
    
    return enemies


def _extract_categories(text: str) -> list:
    """Extract category names from wikitext."""
    return re.findall(r'\[\[Category:\s*([^\]]+)\]\]', text)


def _parse_entity_statistics(html: str, enemy: Enemy):
    """Parse the statistics HTML table from PQ Entity template."""
    if not html:
        return
    
    # Strip wiki markup for cleaner parsing
    clean = _strip_wiki_markup(html)
    
    # Extract Health: "Health 350,000 HP"
    m = re.search(r'Health\s+([\d,]+\s*HP)', clean)
    if m:
        enemy.hp = m.group(1).strip()
    
    # Extract Defense: "Defense 60"
    m = re.search(r'Defense\s+(\d[\d,]*)', clean)
    if m:
        enemy.defense = m.group(1).strip()
    
    # Extract Experience: "Experience 12,000"
    m = re.search(r'Experience\s+([\d,]+)', clean)
    if m:
        enemy.experience = m.group(1).strip()
    
    # Extract Immunity list
    m = re.search(r'Immunity.*?(?:</th>|<td>)\s*(.*?)(?=</tr>|$)', html, re.DOTALL)
    if m:
        immunity_html = m.group(1)
        # Extract immunity names from wiki links [[Status effects#Paralyze|Paralyze]]
        immunities = re.findall(r'Status effects#([^|]+)\|([^<\]]+)', immunity_html)
        if immunities:
            enemy.immunities = [name for _, name in immunities]
        else:
            # Fallback: strip tags and split by common separators
            clean_imm = _strip_wiki_markup(immunity_html)
            parts = re.split(r',\s*|\s*<br>\s*', clean_imm)
            enemy.immunities = [p.strip() for p in parts if p.strip() and p.strip() != 'Immunity']


def _parse_entity_locations(found_in: str, enemy: Enemy):
    """Parse the found_in section to extract locations."""
    if not found_in:
        return
    
    # Extract wiki links: [[Location Name|display text]] or [[Location Name]]
    links = re.findall(r'\[\[([^|\]]+)(?:\|[^\]]+)?\]\]', found_in)
    for link in links:
        if link.startswith("File:") or link.startswith("Category:") or link.startswith("Status effects"):
            continue
        enemy.location = link  # Take the first valid location
        break


def _parse_entity_loot(loot: str, enemy: Enemy):
    """Parse the loot section to extract dropped items."""
    if not loot:
        return
    
    # Extract item wiki links from loot table
    # Pattern: [[Item Name|Item Name]]
    links = re.findall(r'\[\[([^|\]]+)(?:\|[^\]]+)?\]\]', loot)
    drops = []
    for link in links:
        if link.startswith("File:") or link.startswith("Category:") or link.startswith(":Category:") or link.startswith("Status effects"):
            continue
        # Skip tier icon links (e.g., "Tier LG", "Tier CORRUPTED")
        if link.startswith("Tier "):
            continue
        if link not in drops:
            drops.append(link)
    enemy.drops = drops


def _parse_portal_table(portal: str, loc: Location):
    """Parse the portal_table from PQ Location template."""
    if not portal:
        return
    
    clean = _strip_wiki_markup(portal)
    
    # Teleportation (account for | separator from wiki table syntax)
    m = re.search(r'Teleportation\s*\|?\s*(Yes|No)', clean, re.IGNORECASE)
    if m:
        loc.teleportation = m.group(1).lower() == 'yes'
    
    # Perma death
    m = re.search(r'Perma\s*death\s*\|?\s*(Yes|No)', clean, re.IGNORECASE)
    if m:
        loc.perma_death = m.group(1).lower() == 'yes'
    
    # Max players
    m = re.search(r'Max\s*players\s*\|?\s*(\d+)', clean)
    if m:
        loc.max_players = int(m.group(1))
    
    # Max pity
    m = re.search(r'Max\s*pity\s*\|?\s*([\d,]+)', clean)
    if m:
        loc.max_pity = int(m.group(1).replace(',', ''))
    
    # Chest health
    m = re.search(r'Chest\s*health\s*\|?\s*([\d,]+)', clean)
    if m:
        loc.chest_health = m.group(1)
    
    # Legendaries — extract wiki links from the raw portal text (before markup stripping)
    legendary_section = re.search(r'Legendaries\s*(.*?)$', portal, re.DOTALL)
    if legendary_section:
        links = re.findall(r'\[\[([^|\]]+)(?:\|[^\]]+)?\]\]', legendary_section.group(1))
        loc.legendaries = [l for l in links if not l.startswith("File:") and not l.startswith("Category:") and not l.startswith("Tier")]


def _parse_found_entities(found_text: str, loc: Location):
    """Parse found entities from PQ Location template."""
    if not found_text:
        return
    
    # Extract entity wiki links and check for boss designation
    # Pattern: [[Entity Name|Entity Name]] optionally followed by (Dungeon Boss)
    entity_pattern = r'\[\[([^|\]]+)(?:\|([^\]]+))?\]\](?:\s*<small>\(([^)]+)\)</small>)?'
    matches = re.findall(entity_pattern, found_text)
    
    for name, display, designation in matches:
        if name.startswith("File:") or name.startswith("Category:"):
            continue
        entity_info = {"name": name, "is_boss": bool(designation and "Boss" in designation)}
        loc.found_entities.append(entity_info)
        if entity_info["is_boss"]:
            if name not in loc.bosses:
                loc.bosses.append(name)
        else:
            if name not in loc.enemies:
                loc.enemies.append(name)


def _parse_on_equip(text: str) -> dict:
    """Parse on_equip stats from PQ Item template."""
    stats = {}
    # Normalize wiki template syntax
    clean = text.replace("{{!}}", "|").replace("{{=}}", "=")
    
    # Extract stat rows: each row is "! <markup> StatName\n| <markup> +Value"
    # Match pairs of header/value lines in the wiki table
    stat_pattern = r'!\s+.*?(Attack|Defense|Health|Vitality)\s*\n\|\s*(.*?)(?=\n[!|]|\n\}|$)'
    matches = re.findall(stat_pattern, clean, re.DOTALL | re.IGNORECASE)
    
    for stat_name, value_html in matches:
        # Extract numeric value from the value cell (may contain HTML/wiki markup)
        value_clean = _strip_wiki_markup(value_html)
        m = re.search(r'\+?([\d,]+)', value_clean)
        if m:
            stats[stat_name.lower()] = int(m.group(1).replace(',', ''))
    
    return stats


def _determine_item_type(categories: list, weapon_type: str) -> str:
    """Determine the broad item type from categories."""
    cats_lower = {c.lower() for c in categories}
    
    if weapon_type:
        if weapon_type.lower() in {"incantation", "spell", "bomb"}:
            return "Secondary Ability"
        return "Primary Weapon"
    
    for item_cat in config.WEAPON_CATEGORIES:
        if item_cat.lower() in cats_lower:
            return "Primary Weapon"
    
    for item_cat in config.ARMOR_CATEGORIES:
        if item_cat.lower() in cats_lower:
            return "Armor"
    
    for item_cat in config.ACCESSORY_CATEGORIES:
        if item_cat.lower() in cats_lower:
            return "Accessory"
    
    for item_cat in config.CONSUMABLE_CATEGORIES:
        if item_cat.lower() in cats_lower:
            return "Consumable"
    
    # If it has Equipment category, try to guess from name patterns
    if "equipment" in cats_lower:
        return "Equipment"
    
    return "Unknown"
