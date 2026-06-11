import json, os, sys, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from pq_ai import config

# Generate wiki URL for an item name
def get_wiki_url(item_name: str) -> str:
    encoded = urllib.parse.quote(item_name.replace(" ", "_"), safe="")
    return f"{config.WIKI_BASE}/wiki/{encoded}"

# Test on items with apostrophes
items = json.load(open("data/items.json", "r", encoding="utf-8"))
names = list(items.keys())
test_names = names[:5] + [n for n in names if "'" in n][:3]
for name in test_names:
    print(f"  {name} -> {get_wiki_url(name)}")
