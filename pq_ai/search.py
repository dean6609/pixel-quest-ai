"""Enhanced search engine using semantic embeddings with TF-IDF fallback."""
import re
import json
import logging
import math
import os
from collections import Counter
from typing import List, Optional, Dict
from dataclasses import dataclass

from . import config
from . import embeddings

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    item: dict
    score: float
    tier_score: float = 0.0
    type_score: float = 0.0
    
    @property
    def total_score(self) -> float:
        return self.score + self.tier_score + self.type_score


class SearchEngine:
    """Hybrid search engine: semantic (if available) + keyword + metadata filters."""
    
    def __init__(self):
        self.items: Dict[str, dict] = {}
        self._loaded = False
        self._index_file = os.path.join(config.DATA_DIR, "embedding_index.pkl")
        self._index_built = False
    
    def load_items(self):
        """Load items from the database."""
        items_file = config.ITEMS_FILE
        if os.path.exists(items_file):
            with open(items_file, "r", encoding="utf-8") as f:
                self.items = json.load(f)
            self._loaded = True
            logger.info(f"Loaded {len(self.items)} items for search")
            
            # Check if embedding index exists
            if os.path.exists(self._index_file):
                self._index_built = True
        else:
            logger.warning("No items file found")
    
    def build_index(self):
        """Build the embedding index if sentence-transformers is available."""
        if not embeddings.HAS_TRANSFORMERS:
            logger.info("sentence-transformers not available, using keyword search")
            return False
        
        if self._index_built:
            return True
        
        if not self._loaded:
            self.load_items()
        
        if not self.items:
            return False
        
        success = embeddings.index_items(config.ITEMS_FILE, self._index_file)
        if success:
            self._index_built = True
        return success
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenizer for keyword search fallback."""
        text = text.lower()
        tokens = re.findall(r'[a-z0-9]+', text)
        return [t for t in tokens if len(t) > 1]
    
    def _keyword_search(self, query: str, top_k: int = 20) -> List[SearchResult]:
        """Fallback keyword-based search with scoring."""
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []
        
        results = []
        for name, item in self.items.items():
            search_text = embeddings.build_item_text(item)
            search_tokens = self._tokenize(search_text)
            
            if not search_tokens:
                continue
            
            # Count matching tokens
            matches = sum(1 for t in query_tokens if t in search_tokens)
            if matches == 0:
                continue
            
            # Score = match ratio * inverse document frequency weight
            score = matches / len(query_tokens)
            
            # Boost exact name matches
            name_lower = name.lower()
            query_lower = query.lower()
            if query_lower in name_lower:
                score += 0.3
            
            results.append(SearchResult(item=item, score=score))
        
        results.sort(key=lambda r: r.score, reverse=True)
        return results[:top_k]
    
    def _semantic_search(self, query: str, top_k: int = 15) -> List[SearchResult]:
        """Semantic search using sentence embeddings."""
        if not self._index_built:
            return []
        
        try:
            raw_results = embeddings.search_items(query, self._index_file, self.items, top_k)
            results = []
            for r in raw_results:
                score = r.pop("_score", 0.0)
                results.append(SearchResult(item=r, score=score))
            return results
        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return []
    
    def _compute_tier_score(self, tier: str) -> float:
        """Compute numeric score for tier."""
        order = config.TIER_ORDER
        return order.get(tier, 0) / 10.0
    
    def _compute_type_score(self, item: dict, query: str) -> float:
        """Boost score based on type/class relevance."""
        query_lower = query.lower()
        score = 0.0
        
        item_type = (item.get("item_type") or "").lower()
        weapon_type = (item.get("weapon_type") or "").lower()
        
        # Check if query mentions a specific type
        type_keywords = {
            "sword": 0.2, "bow": 0.2, "staff": 0.2, "dagger": 0.2, 
            "axe": 0.2, "fan": 0.2, "armor": 0.1, "helmet": 0.1,
            "ring": 0.1, "pendant": 0.1, "accessory": 0.1,
            "weapon": 0.05, "primary": 0.05,
        }
        
        for keyword, boost in type_keywords.items():
            if keyword in query_lower and (keyword in item_type or keyword in weapon_type):
                score += boost
                break
        
        return score
    
    def search(
        self,
        query: str,
        top_k: int = 15,
        tier_filter: Optional[str] = None,
        type_filter: Optional[str] = None,
        min_damage: Optional[float] = None,
        location: Optional[str] = None,
    ) -> List[dict]:
        """Main search function with hybrid approach and filters."""
        if not self._loaded:
            self.load_items()
        
        if not self.items:
            return []
        
        # Try semantic search first
        results = self._semantic_search(query, top_k * 2)
        
        # Fall back to keyword search if no semantic results
        if not results:
            results = self._keyword_search(query, top_k * 2)
        
        if not results:
            return []
        
        # Apply filters and compute final scores
        filtered = []
        for r in results:
            item = r.item
            
            # Apply tier filter
            if tier_filter and tier_filter != "all":
                item_tier = item.get("tier", "")
                if item_tier != tier_filter:
                    continue
            
            # Apply type filter
            if type_filter and type_filter != "all":
                item_type = item.get("item_type", "")
                if item_type != type_filter:
                    continue
            
            # Apply location filter
            if location and location != "all":
                dropped_by = [d.lower() for d in item.get("dropped_by", [])]
                loc_lower = location.lower()
                if not any(loc_lower in d for d in dropped_by):
                    # Check if the item's zone matches
                    continue
            
            # Apply damage filter
            if min_damage is not None:
                ws = item.get("weapon_stats", {})
                if ws:
                    dmg_max = ws.get("damage_max", 0)
                    if dmg_max < min_damage:
                        continue
            
            # Compute tier score boost
            r.tier_score = self._compute_tier_score(item.get("tier", ""))
            
            # Compute type relevance score
            r.type_score = self._compute_type_score(item, query)
            
            filtered.append(r)
        
        # Sort by total score
        filtered.sort(key=lambda r: r.total_score, reverse=True)
        
        # Remove score fields from output
        output = []
        for r in filtered[:top_k]:
            item = dict(r.item)
            item["_score"] = round(r.score, 4)
            item["_total_score"] = round(r.total_score, 4)
            output.append(item)
        
        return output
    
    def get_item(self, name: str) -> Optional[dict]:
        """Get a single item by name."""
        if not self._loaded:
            self.load_items()
        return self.items.get(name)
    
    def get_all(self) -> List[dict]:
        """Get all items."""
        if not self._loaded:
            self.load_items()
        return list(self.items.values())
    
    def get_stats(self) -> dict:
        """Get search index statistics."""
        if not self._loaded:
            self.load_items()
        
        types = {}
        tiers = {}
        for item in self.items.values():
            t = item.get("item_type", "unknown")
            types[t] = types.get(t, 0) + 1
            ti = item.get("tier", "unknown")
            tiers[ti] = tiers.get(ti, 0) + 1
        
        return {
            "total_items": len(self.items),
            "has_embeddings": self._index_built,
            "types": types,
            "tiers": tiers,
        }
