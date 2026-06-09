"""Real embeddings using sentence-transformers for semantic search."""
import logging
import json
import os
import pickle
from typing import Optional, List, Dict
import numpy as np

logger = logging.getLogger(__name__)

# Try to load sentence-transformers
try:
    from sentence_transformers import SentenceTransformer
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False

EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # Small, fast, good quality
EMBEDDING_CACHE = None
EMBEDDING_DIM = 384


def get_encoder():
    """Get or create the sentence encoder."""
    global EMBEDDING_CACHE
    if EMBEDDING_CACHE is not None:
        return EMBEDDING_CACHE
    if not HAS_TRANSFORMERS:
        logger.warning("sentence-transformers not available, using fallback")
        return None
    try:
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
        model = SentenceTransformer(EMBEDDING_MODEL)
        EMBEDDING_CACHE = model
        return model
    except Exception as e:
        logger.error(f"Failed to load embedding model: {e}")
        return None


def compute_embedding(text: str) -> Optional[List[float]]:
    """Compute embedding for a text string."""
    encoder = get_encoder()
    if encoder is None:
        return None
    try:
        emb = encoder.encode(text, normalize_embeddings=True)
        return emb.tolist()
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        return None


def compute_embeddings_batch(texts: List[str]) -> Optional[List[List[float]]]:
    """Compute embeddings for multiple texts at once."""
    encoder = get_encoder()
    if encoder is None:
        return None
    try:
        embs = encoder.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return embs.tolist()
    except Exception as e:
        logger.error(f"Batch embedding error: {e}")
        return None


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a = np.array(a)
    b = np.array(b)
    return float(np.dot(a, b))


def build_item_text(item: dict) -> str:
    """Build searchable text for an item."""
    parts = [
        item.get("name", ""),
        item.get("item_type", ""),
        item.get("weapon_type", ""),
        item.get("tier", ""),
        item.get("description", ""),
    ]
    
    # Add passives
    for p in item.get("passives", []):
        parts.append(p)
    
    # Add categories
    for c in item.get("categories", []):
        parts.append(c)
    
    # Add dropped by
    for d in item.get("dropped_by", [])[:3]:
        parts.append(d)
    
    # Add weapon stats
    ws = item.get("weapon_stats", {})
    if ws:
        parts.append(f"damage {ws.get('damage','')}")
        parts.append(f"range {ws.get('range','')}")
        parts.append(f"rate of fire {ws.get('rate_of_fire','')}")
    
    return " ".join(parts)


def index_items(items_file: str, index_file: str) -> bool:
    """Build embedding index for all items."""
    if not HAS_TRANSFORMERS:
        logger.warning("Cannot build embeddings without sentence-transformers")
        return False
    
    with open(items_file, "r", encoding="utf-8") as f:
        items = json.load(f)
    
    logger.info(f"Building embeddings for {len(items)} items...")
    names = list(items.keys())
    texts = [build_item_text(items[n]) for n in names]
    
    embs = compute_embeddings_batch(texts)
    if embs is None:
        return False
    
    index_data = {
        "names": names,
        "embeddings": embs,
    }
    
    with open(index_file, "wb") as f:
        pickle.dump(index_data, f)
    
    logger.info(f"Index saved: {len(names)} items, {len(embs[0])} dimensions")
    return True


def search_items(query: str, index_file: str, items: dict, top_k: int = 15) -> List[dict]:
    """Search items using semantic embeddings."""
    if not os.path.exists(index_file):
        logger.warning(f"Index file not found: {index_file}")
        return []
    
    try:
        with open(index_file, "rb") as f:
            index = pickle.load(f)
    except Exception as e:
        logger.error(f"Failed to load index: {e}")
        return []
    
    query_emb = compute_embedding(query)
    if query_emb is None:
        return []
    
    # Compute similarities
    query_vec = np.array(query_emb)
    index_vecs = np.array(index["embeddings"])
    scores = np.dot(index_vecs, query_vec)
    
    # Get top-k
    top_indices = np.argsort(scores)[::-1][:top_k]
    
    results = []
    for idx in top_indices:
        name = index["names"][idx]
        if name in items:
            item = items[name]
            item["_score"] = float(scores[idx])
            results.append(item)
    
    return results
