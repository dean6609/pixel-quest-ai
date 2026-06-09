"""Build embeddings index and verify everything works."""
import sys, os, json, logging

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

logging.basicConfig(level=logging.INFO, format='%(message)s')

from pq_ai.embeddings import index_items, HAS_TRANSFORMERS

print(f"✓ sentence-transformers available: {HAS_TRANSFORMERS}")

# Build embeddings index
items_file = os.path.join(BASE_DIR, "data", "items.json")
index_file = os.path.join(BASE_DIR, "data", "embedding_index.pkl")

print("Building embedding index...")
success = index_items(items_file, index_file)
print(f"✓ Index built: {success}")

if success:
    # Test search
    from pq_ai.embeddings import search_items
    with open(items_file, 'r', encoding='utf-8') as f:
        items = json.load(f)
    
    test_queries = [
        "good dagger for beginners",
        "best bow with high damage",
        "armor with valor bonus",
        "fire staff",
    ]
    
    for q in test_queries:
        results = search_items(q, index_file, items, top_k=3)
        print(f"\nQuery: '{q}'")
        for r in results:
            print(f"  [{r.get('_score',0):.3f}] {r['name']} ({r.get('item_type','?')}) [{r.get('tier','?')}]")

print("\n✓ All systems ready!")
