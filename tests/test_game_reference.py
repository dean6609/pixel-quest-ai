from pq_ai.deepseek_rag import build_game_reference

class FakeSearch:
    _loaded = True
    items = {
        "Acclaimed Armor": {"tier": "T4", "item_type": "Armor", "subtype": "Heavy Armor"},
        "Adept Boots": {"tier": "LG", "item_type": "Accessory", "subtype": "Boot"},
        "Long Bow": {"tier": "T1", "item_type": "Primary Weapon", "subtype": "Bow"},
    }
    enemies = {"Slime": {"category": "Enemies"}, "King": {"category": "Bosses"}}
    locations = {"Cave": {"location_type": "dungeon", "difficulty": 3},
                 "Town": {"location_type": "location", "difficulty": 0}}

def test_reference_lists_present_values_in_tier_order():
    ref = build_game_reference(FakeSearch())
    # Tiers ordered by progression, only those present
    assert "T1, T4, LG" in ref
    # Top-level types with their present subtypes
    assert "Primary Weapon" in ref and "Bow" in ref
    assert "Armor" in ref and "Heavy Armor" in ref
    assert "Accessory" in ref and "Boot" in ref
    # Enemy categories and location types
    assert "Enemies" in ref and "Bosses" in ref
    assert "dungeon" in ref and "location" in ref
