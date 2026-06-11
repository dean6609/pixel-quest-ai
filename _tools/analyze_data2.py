#!/usr/bin/env python3
"""Analyze the current state of data files."""
import json

items = json.load(open('data/items.json', encoding='utf-8'))
enemies = json.load(open('data/enemies.json', encoding='utf-8'))
locations = json.load(open('data/locations.json', encoding='utf-8'))
rels = json.load(open('data/relationships.json', encoding='utf-8'))

print(f"=== DATA STATS ===")
print(f"Items: {len(items)}")
print(f"Enemies: {len(enemies)}")
print(f"Locations: {len(locations)}")

tiers = {}
types = {}
no_drops = 0
no_passives = 0
weapon_items = 0

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

print(f"\nTiers: {dict(sorted(tiers.items()))}")
print(f"Types: {dict(sorted(types.items()))}")
print(f"Items with weapon_type: {weapon_items}")
print(f"Items without dropped_by: {no_drops}")
print(f"Items without passives: {no_passives}")

# Enemy sample
print(f"\n=== ENEMY SAMPLE (first 3) ===")
for k in list(enemies.keys())[:3]:
    v = enemies[k]
    print(f"  {k}: keys={list(v.keys())}")
    print(f"    location={v.get('location','NONE')}")
    print(f"    drops={v.get('drops', [])[:2]}")

# Location sample
print(f"\n=== LOCATION SAMPLE (first 3) ===")
for k in list(locations.keys())[:3]:
    v = locations[k]
    print(f"  {k}: type={v.get('location_type','NONE')}, enemies={len(v.get('enemies',[]))}")

# Relationships
print(f"\n=== RELATIONSHIPS ===")
for rel_name, rel_data in rels.items():
    print(f"  {rel_name}: {len(rel_data)} entries")

# Check how items look with wiki_url potential
print(f"\n=== ITEMS WITH DROPS (first 3) ===")
count = 0
for k, v in items.items():
    if v.get('dropped_by'):
        wiki_url = f"https://wiki.playpixelquest.com/wiki/{k.replace(' ', '_')}"
        print(f"  {k}")
        print(f"    Wiki URL: {wiki_url}")
        print(f"    Dropped by: {v['dropped_by'][:3]}")
        count += 1
        if count >= 3:
            break

# Items without drops - can't create meaningful links for these
print(f"\n=== ITEMS WITHOUT DROPS (first 3) ===")
count = 0
for k, v in items.items():
    if not v.get('dropped_by'):
        print(f"  {k}: tier={v.get('tier')}, type={v.get('item_type')}")
        count += 1
        if count >= 3:
            break

# Check search_engine vs database loading path
print(f"\n=== DEEPSEEK RAG ISSUES ===")
# The deepseek_rag.py uses SearchEngine which loads items from ITEMS_FILE directly
# The search engine is separate from Database
print(f"SearchEngine loads items.json directly (NOT through Database)")
print(f"Database has its own Item model with to_dict()")
print(f"deepseek_rag.py and rag.py use different search paths")
print(f"  - deepseek_rag.py: SearchEngine.search(query=..., tier_filter=..., type_filter=..., weapon_type_filter=...)")
print(f"  - rag.py: self.search.search(query=..., filters=..., top_k=...)")
print(f"These are incompatible signatures!")

# Check if parse_text_tool_calls in deepseek_rag actually works
print(f"\n=== TOOL CALL FORMAT CHECK ===")
print(f"The deepseek_rag.py has a TEXT-based tool call parser (not using OpenAI structured output)")
print(f"It parses XML-style tags from the model's text output")
print(f"This is fragile compared to native function calling")

# Check items with no weapon_type but that should be weapons
print(f"\n=== TYPE CONSISTENCY CHECK ===")
for k, v in items.items():
    if v.get('item_type') == 'Primary Weapon' and not v.get('weapon_type'):
        print(f"  {k}: Primary Weapon but no weapon_type!")
        break
else:
    print(f"  All Primary Weapons have weapon_type (good)")
