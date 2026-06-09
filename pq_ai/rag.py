"""RAG (Retrieval-Augmented Generation) query engine for Pixel Quest."""

import json
import logging
import re
from typing import Optional, List, Dict

from . import config
from .database import Database
from .search import SearchEngine

logger = logging.getLogger(__name__)


class RAGEngine:
    """RAG query engine that retrieves relevant context for AI prompting."""
    
    def __init__(self, db: Database, search_engine: SearchEngine):
        self.db = db
        self.search = search_engine
        
        # Default system prompt describing the game
        self.system_prompt = self._build_system_prompt()
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt with game context."""
        # Count items by type
        weapon_count = len([i for i in self.db.items.values() 
                           if "Primary" in i.get("item_type", "")])
        armor_count = len([i for i in self.db.items.values() 
                          if "Armor" in i.get("item_type", "") 
                          or "armor" in str(i.get("categories", [])).lower()])
        accessory_count = len([i for i in self.db.items.values() 
                              if "Accessory" in i.get("item_type", "") 
                              or any(c in str(i.get("categories", [])) 
                                     for c in ["Ring", "Pendant", "Belt", "Bracelet"])])
        
        return f"""You are a Pixel Quest game expert assistant. Your role is to help players 
optimize their equipment, find items, and build effective loadouts.

GAME CONTEXT:
- Pixel Quest is a 2D perma-death MMORPG on Roblox with bullet-hell combat and roguelike elements.
- Players lose their character on death but earn Valor (currency) which persists.
- There are {weapon_count}+ primary weapons, {armor_count}+ armor pieces, and {accessory_count}+ accessories.
- Items are tiered from T0 (weakest) to T8 (strongest), plus LG (Legendary) and CORRUPTED (special endgame).
- Equipment includes: Primary Weapons (Sword, Bow, Staff, Dagger, Axe, Fan), 
  Secondary Abilities (Spells, Incantations, Bombs), Armor (Heavy, Leather, Robe),
  Accessories (Ring, Pendant, Belt, Bracelet, Crown, Hat, Helmet, Boot, Gauntlet, etc.)
- Items have stats like Damage, Range, Speed, Rate of Fire, Passives, and Valor Bonus.
- Items drop from specific enemies found in specific dungeons/zones.
- The game has 30+ dungeons, 80+ bosses, 200+ unique legendaries.

HOW TO ADVISE:
- Consider the player's level and available zones when suggesting items.
- Suggest items that are farmable (tell them which enemy/location drops them).
- Consider synergies between items (e.g., passives that complement each other).
- Prioritize items with good Valor Bonus for progression.
- For weapons, consider Damage, Rate of Fire, Range, and Passives.
- Always explain WHY an item is good for their specific situation.
- If asked about builds, consider the full loadout: weapon, armor, accessories."""
    
    def parse_query(self, query: str) -> dict:
        """Parse a natural language query to extract search parameters."""
        query_lower = query.lower()
        params = {
            "original": query,
            "keywords": query,
            "item_type": None,
            "tier": None,
            "location": None,
            "enemy": None,
            "level": None,
            "goal": "general",
        }
        
        # Detect item type
        type_patterns = [
            (r"\b(sword|swords)\b", "Sword"),
            (r"\b(bow|bows)\b", "Bow"),
            (r"\b(staff|staves|staffs)\b", "Staff"),
            (r"\b(dagger|daggers|knife|knives)\b", "Dagger"),
            (r"\b(axe|axes|hatchet)\b", "Axe"),
            (r"\b(armor|armour)\b", "Armor"),
            (r"\b(ring|rings|accessory|accessories)\b", "Accessory"),
            (r"\b(weapon|weapons)\b", "Primary Weapon"),
            (r"\b(pendant|amulet|necklace)\b", "Pendant"),
            (r"\b(belt|belt)\b", "Belt"),
            (r"\b(bracelet)\b", "Bracelet"),
            (r"\b(helmet|helm|hat)\b", "Helmet"),
            (r"\b(boot|boots)\b", "Boot"),
            (r"\b(gauntlet|glove|gloves)\b", "Gauntlet"),
            (r"\b(robe|robes)\b", "Robe Armor"),
            (r"\b(leather)\b", "Leather Armor"),
        ]
        
        for pattern, itype in type_patterns:
            if re.search(pattern, query_lower):
                params["item_type"] = itype
                break
        
        # Detect tier
        tier_patterns = [
            (r"\b(t0|tier\s*0|low tier|beginner)\b", "T0"),
            (r"\b(t1|tier\s*1|early)\b", "T1"),
            (r"\b(t2|tier\s*2)\b", "T2"),
            (r"\b(t3|tier\s*3|mid tier)\b", "T3"),
            (r"\b(t4|tier\s*4)\b", "T4"),
            (r"\b(t5|tier\s*5)\b", "T5"),
            (r"\b(t6|tier\s*6|high tier)\b", "T6"),
            (r"\b(t7|tier\s*7)\b", "T7"),
            (r"\b(t8|tier\s*8|endgame|best)\b", "T8"),
            (r"\b(legendary|lg)\b", "LG"),
            (r"\b(corrupted)\b", "CORRUPTED"),
        ]
        
        for pattern, tier in tier_patterns:
            if re.search(pattern, query_lower):
                params["tier"] = tier
                break
        
        # Detect location
        for loc_name in list(self.db.locations.keys()):
            if loc_name.lower() in query_lower:
                params["location"] = loc_name
                break
        
        # Detect level
        level_match = re.search(r"\blevel\s*(\d+)\b", query_lower)
        if level_match:
            params["level"] = int(level_match.group(1))
        
        # Detect goal
        goal_patterns = [
            (r"\b(dps|damage|dmg|attack)\b", "damage"),
            (r"\b(defense|defence|tank|survive|survival|hp)\b", "defense"),
            (r"\b(valor|valor bonus|forge)\b", "valor"),
            (r"\b(build|combo|synergy|combination|set)\b", "build"),
            (r"\b(farm|grind|easy|fast)\b", "farming"),
            (r"\b(boss|bosses|raid)\b", "boss"),
        ]
        
        for pattern, goal in goal_patterns:
            if re.search(pattern, query_lower):
                params["goal"] = goal
                break
        
        return params
    
    def retrieve_context(self, query: str, top_k: int = None) -> dict:
        """Retrieve relevant context for a query."""
        if top_k is None:
            top_k = config.RAG_TOP_K
        
        params = self.parse_query(query)
        
        # Build filters from parsed params
        filters = {}
        if params["item_type"]:
            filters["item_type"] = params["item_type"]
        if params["tier"]:
            filters["tier"] = params["tier"]
        if params["location"]:
            filters["location"] = params["location"]
        
        # Search
        results = self.search.search(
            query=params["keywords"],
            filters=filters,
            top_k=top_k,
        )
        
        # Build context
        items_context = []
        for item_name, score in results:
            item = self.db.get_item(item_name)
            if item:
                items_context.append(self._format_item_for_context(item))
        
        # Get relevant locations
        locations_context = {}
        if params["location"]:
            loc = self.db.get_location(params["location"])
            if loc:
                locations_context[params["location"]] = {
                    "type": loc.get("location_type", ""),
                    "enemies": loc.get("enemies", []),
                }
        
        # Get relevant enemies
        enemies_context = []
        for item_ctx in items_context:
            for enemy in item_ctx.get("dropped_by", []):
                if enemy not in enemies_context:
                    enemies_context.append(enemy)
        
        return {
            "params": params,
            "items": items_context,
            "locations": locations_context,
            "enemies": enemies_context[:15],
            "total_items_found": len(results),
        }
    
    def _format_item_for_context(self, item: dict) -> dict:
        """Format an item for compact context representation."""
        formatted = {
            "name": item.get("name", ""),
            "tier": item.get("tier", ""),
            "type": item.get("item_type", ""),
            "weapon_type": item.get("weapon_type", ""),
        }
        
        # Add weapon stats if available
        ws = item.get("weapon_stats")
        if ws:
            formatted["damage"] = ws.get("damage", "")
            formatted["range_tiles"] = ws.get("range", 0)
            formatted["rate_of_fire"] = ws.get("rate_of_fire", 0)
            formatted["speed"] = ws.get("speed", 0)
            formatted["projectiles"] = ws.get("total_projectiles", 1)
            formatted["pierces"] = ws.get("pierces", False)
        
        # Add armor stats
        if item.get("armor_stats"):
            formatted["armor"] = item["armor_stats"]
        
        # Add passives
        if item.get("passives"):
            formatted["passives"] = item["passives"]
        
        # Add requirements
        if item.get("requirements"):
            formatted["requirements"] = item["requirements"]
        
        # Add drops
        if item.get("dropped_by"):
            formatted["dropped_by"] = item["dropped_by"]
        
        # Add valor
        if item.get("valor_bonus"):
            formatted["valor_bonus"] = item["valor_bonus"]
        
        return formatted
    
    def build_prompt(self, query: str) -> dict:
        """Build a complete prompt for the AI with context."""
        context = self.retrieve_context(query)
        params = context["params"]
        
        # Build user message with context
        user_message_parts = [f"Player question: {query}"]
        
        if params["level"]:
            user_message_parts.append(f"\nPlayer level: {params['level']}")
        
        if params["location"]:
            user_message_parts.append(f"\nAvailable zone: {params['location']}")
        
        # Add relevant items
        if context["items"]:
            user_message_parts.append("\n\nRELEVANT ITEMS (from wiki data):")
            for item in context["items"][:10]:
                parts = []
                parts.append(f"\n• {item['name']} [{item['tier']}] - {item['type']}")
                if item.get("weapon_type"):
                    parts.append(f" ({item['weapon_type']})")
                
                if item.get("damage"):
                    parts.append(f"\n  Damage: {item['damage']}")
                if item.get("rate_of_fire"):
                    parts.append(f" | RoF: {item['rate_of_fire']}/s")
                if item.get("range_tiles"):
                    parts.append(f" | Range: {item['range_tiles']} tiles")
                
                if item.get("passives"):
                    parts.append(f"\n  Passives: {'; '.join(item['passives'][:2])}")
                
                if item.get("valor_bonus"):
                    parts.append(f"\n  Valor Bonus: +{item['valor_bonus']}%")
                
                if item.get("dropped_by"):
                    parts.append(f"\n  Drop from: {', '.join(item['dropped_by'][:3])}")
                
                user_message_parts.append("".join(parts))
        
        # Add location info
        if context["locations"]:
            user_message_parts.append("\n\nLOCATIONS:")
            for loc_name, loc_info in context["locations"].items():
                user_message_parts.append(f"\n• {loc_name} ({loc_info['type']})")
                if loc_info["enemies"]:
                    user_message_parts.append(f"  Enemies: {', '.join(loc_info['enemies'][:5])}")
        
        # Add enemy info
        if context["enemies"]:
            user_message_parts.append(f"\n\nRELEVANT ENEMIES: {', '.join(context['enemies'][:10])}")
        
        return {
            "system": self.system_prompt,
            "user": "".join(user_message_parts),
            "context": context,
        }
    
    def format_response(self, ai_response: str, context: dict) -> str:
        """Format the AI response with optional source citations."""
        # Add source references if items were used
        if context.get("items"):
            sources = "\n\n📚 **Sources from wiki:**\n"
            for item in context["items"][:5]:
                name = item["name"]
                if item.get("dropped_by"):
                    sources += f"- {name} (drops from: {', '.join(item['dropped_by'][:2])})\n"
                else:
                    sources += f"- {name}\n"
            
            # Add wiki link
            sources += f"\n🔗 https://wiki.playpixelquest.com/wiki/{context['items'][0]['name'].replace(' ', '_')}"
            
            if len(context["items"]) > 1:
                sources += f"\n🔗 And {len(context['items'])-1} more related items..."
        
        return ai_response + sources if "Sources from wiki" not in ai_response else ai_response
