"""Canonical Pixel Quest item taxonomy.

Single source of truth derived from the official wiki "Info" categories
(Primary Weapons / Secondary Abilities / Armors / Accessories). The wiki's
per-item ``categories`` list always carries the specific subtype (e.g.
``Helmet``, ``Heavy Armor``, ``Bow``); we map that subtype to its official
top-level type. This avoids the historical misclassification where helmets,
boots, hats, etc. were labelled ``Armor`` and flags/totems were labelled
``Primary Weapon``.
"""

# Top-level type -> ordered list of specific subtypes, exactly as the wiki
# stores them in each item's `categories` field (singular form).
TAXONOMY = {
    "Primary Weapon":    ["Bow", "Axe", "Sword", "Staff", "Dagger", "Fan"],
    "Secondary Ability": ["Totem", "Flag", "Bomb", "Spell"],
    "Armor":             ["Heavy Armor", "Leather Armor", "Robe Armor"],
    "Accessory":         ["Helmet", "Gauntlet", "Crown", "Hat",
                          "Belt", "Bracelet", "Pendant", "Boot", "Ring"],
}

# Lowercased specific subtype -> (top_level_type, canonical_subtype)
_SUBTYPE_INDEX = {
    sub.lower(): (top, sub)
    for top, subs in TAXONOMY.items()
    for sub in subs
}


def classify(categories) -> tuple:
    """Map an item's wiki ``categories`` to ``(item_type, subtype)``.

    Returns ``("", "")`` when no known subtype is present, so callers can fall
    back to legacy logic instead of overwriting a value with nothing.
    """
    for cat in categories or []:
        hit = _SUBTYPE_INDEX.get(str(cat).strip().lower())
        if hit:
            return hit
    return ("", "")


def all_subtypes(item_type: str) -> list:
    """Return the canonical subtypes for a given top-level type."""
    return list(TAXONOMY.get(item_type, []))
