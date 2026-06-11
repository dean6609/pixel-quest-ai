#!/usr/bin/env python3
"""Analyze the current state of data files."""
import json, sys, os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from pq_ai.config import ITEMS_FILE, ENEMIES_FILE, LOCATIONS_FILE, RELATIONSHIPS_FILE

items = json.load(open(ITEMS_FILE, encoding='utf-8'))
enemies = json.load(open(ENEMIES_FILE, encoding='utf-8'))
locations = json.load(open(LOCATIONS_FILE, encoding='utf-8'))
rels = json.load(open(RELATIONSHIPS_FILE, encoding='utf-8'))

print(f"=== DATA STATS ===")
print(f"Items: {len(items)}")
print(f"Enemies: {len(enemies)}")
print(f"Locations: {len(locations)}")

# Tiers
tiers = {}
types = {}
no_weapon_type = 0
no_drops = 0
no_passives = 0
weapon_items = 0
named_with_space = 0

for k, v in items.items():
    t = v.get('tier', '') or 'NONE'
    tiers[t] = tiers.get(t, 0) + 1
    tp = v.get('item_type', '') or 'NONE'
    types[tp] = types.get(tp, 0) + 1
    if v.get('weapon_type'):
        weapon_items += 1
    if not v.get('dropped_by'):
        no_drops += 1
    if not v.get('passives'):
        no_passives += 1
    if ' ' in k:
        named_with_space += 1

print(f"\nTiers: {dict(sorted(tiers.items()))}")
print(f"Types: {dict(sorted(types.items()))}")
print(f"Items with weapon_type: {weapon_items}")
print(f"Items without dropped_by: {no_drops}")
print(f"Items without passives: {no_passives}")
print(f"Items with spaces in name: {named_with_space}")

# Enemy data
enemies_with_location = sum(1 for v in enemies.values() if v.get('location'))
enemies_with_drops = sum(1 for v in enemies.values() if v.get('drops'))
print(f"\nEnemies with location: {enemies_with_location}")
print(f"Enemies with drops: {enemies_with_drops}")

# Location data
print(f"\nLocation types: {dict(sorted({v.get('location_type','NONE'): 1 for v in locations.items()}.items()))}")

# Relationships
print(f"\nRelationships:")
print(f"  item_to_enemies: {len(rels.get('item_to_enemies', {}))}")
print(f"  enemy_to_items: {len(rels.get('enemy_to_items', {}))}")
print(f"  enemy_to_location: {len(rels.get('enemy_to_location', {}))}")
print(f"  location_to_enemies: {len(rels.get('location_to_enemies', {}))}")

# Sample items with hyperlink potential
print(f"\n=== SAMPLE ITEMS (5 with drops) ===")
count = 0
for k, v in items.items():
    if v.get('dropped_by'):
        wiki_url = f"https://wiki.playpixelquest.com/wiki/{k.replace(' ', '_')}"
        print(f"  {k} -> {wiki_url}")
        print(f"    Dropped by: {v['dropped_by'][:3]}")
        count += 1
        if count >= 5:
            break

# Check pageid
pageids = sum(1 for v in items.values() if v.get('pageid', 0) > 0)
print(f"\nItems with pageid > 0: {pageids} / {len(items)}")
