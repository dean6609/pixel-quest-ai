"""Simple database search for LLM Function Calling."""
import json
import logging
import os
import re
from typing import List, Optional, Dict
from dataclasses import dataclass

from . import config

logger = logging.getLogger(__name__)

WEAPON_SYNONYMS = {
    "arco": "bow", "sword": "sword", "espada": "sword",
    "staff": "staff", "bastón": "staff", "baston": "staff",
    "dagger": "dagger", "daga": "dagger",
    "axe": "axe", "hacha": "axe",
    "fan": "fan", "abanico": "fan",
    "armor": "armor", "armadura": "armor",
    "anillo": "ring", "ring": "ring",
    "collar": "pendant", "pendant": "pendant",
    "casco": "helmet", "helmet": "helmet",
}

class SearchEngine:
    """Database search engine for items, enemies, and locations."""
    
    def __init__(self):
        self.items: Dict[str, dict] = {}
        self.enemies: Dict[str, dict] = {}
        self.locations: Dict[str, dict] = {}
        self._loaded = False
    
    def load_items(self):
        """Load all data from the database."""
        # Load items
        items_file = config.ITEMS_FILE
        if os.path.exists(items_file):
            with open(items_file, "r", encoding="utf-8") as f:
                self.items = json.load(f)
        
        # Load enemies
        enemies_file = config.ENEMIES_FILE
        if os.path.exists(enemies_file):
            with open(enemies_file, "r", encoding="utf-8") as f:
                self.enemies = json.load(f)
        
        # Load locations
        locations_file = config.LOCATIONS_FILE
        if os.path.exists(locations_file):
            with open(locations_file, "r", encoding="utf-8") as f:
                self.locations = json.load(f)
        
        self._loaded = True
        logger.info(f"Loaded {len(self.items)} items, {len(self.enemies)} enemies, {len(self.locations)} locations")
    
    def search(
        self,
        query: str = "",
        tier_filter: Optional[str] = None,
        type_filter: Optional[str] = None,
        weapon_type_filter: Optional[str] = None,
        min_damage: Optional[float] = None,
        location: Optional[str] = None,
        top_k: int = 15
    ) -> List[dict]:
        """Main search function."""
        if not self._loaded:
            self.load_items()
        
        if not self.items:
            return []
        
        results = []
        query_lower = query.lower() if query else ""
        
        for name, item in self.items.items():
            # Apply tier filter
            if tier_filter and tier_filter != "all":
                item_tier = item.get("tier", "")
                if item_tier != tier_filter:
                    continue
            
            # Apply type filter
            if type_filter and type_filter != "all":
                item_type = item.get("item_type", "")
                if item_type.lower() != type_filter.lower():
                    continue
                    
            # Apply weapon type filter
            if weapon_type_filter and weapon_type_filter != "all":
                wt = item.get("weapon_type", "")
                if wt.lower() != weapon_type_filter.lower():
                    continue
            
            # Apply location filter
            if location and location != "all":
                dropped_by = [d.lower() for d in item.get("dropped_by", [])]
                loc_lower = location.lower()
                if not any(loc_lower in d for d in dropped_by):
                    continue
            
            # Apply damage filter
            if min_damage is not None:
                ws = item.get("weapon_stats", {})
                if ws:
                    dmg_max = ws.get("damage_max", 0)
                    if dmg_max < min_damage:
                        continue
                        
            # Apply text query filter
            score = 0
            if query_lower:
                text_blob = f"{name} {item.get('description', '')} {item.get('item_type', '')} {item.get('weapon_type', '')}".lower()
                
                # Check for exact matches
                if query_lower in name.lower():
                    score += 10
                elif query_lower in text_blob:
                    score += 5
                
                # Check tokens with synonym expansion
                query_tokens = re.findall(r'[a-z0-9]+', query_lower)
                expanded_tokens = set(query_tokens)
                for token in query_tokens:
                    if token in WEAPON_SYNONYMS:
                        expanded_tokens.add(WEAPON_SYNONYMS[token])
                blob_tokens = re.findall(r'[a-z0-9]+', text_blob)
                matches = sum(1 for t in expanded_tokens if t in blob_tokens)
                if matches > 0:
                    score += matches
                
                if score == 0:
                    continue  # Doesn't match the query
            else:
                score = 1 # No query, everything matches
                
            results.append((item, score))
            
        # Sort by score descending
        results.sort(key=lambda x: x[1], reverse=True)
        
        return [r[0] for r in results[:top_k]]
    
    def search_enemies(
        self,
        query: str = "",
        category: Optional[str] = None,
        location: Optional[str] = None,
        entity_type: Optional[str] = None,
        top_k: int = 10
    ) -> List[dict]:
        """Search enemies by name, category, location, or type."""
        if not self._loaded:
            self.load_items()
        
        results = []
        query_lower = query.lower() if query else ""
        
        for name, enemy in self.enemies.items():
            # Apply category filter
            if category and category != "all":
                if enemy.get("category", "").lower() != category.lower():
                    continue
            
            # Apply location filter
            if location and location != "all":
                enemy_loc = enemy.get("location", "").lower()
                if location.lower() not in enemy_loc:
                    continue
            
            # Apply entity type filter
            if entity_type and entity_type != "all":
                if enemy.get("entity_type", "").lower() != entity_type.lower():
                    continue
            
            # Score by text query
            score = 0
            if query_lower:
                text_blob = f"{name} {enemy.get('location', '')} {enemy.get('category', '')} {' '.join(enemy.get('drops', []))}".lower()
                
                if query_lower in name.lower():
                    score += 10
                elif query_lower in text_blob:
                    score += 5
                
                # Token overlap
                query_tokens = re.findall(r'[a-z0-9]+', query_lower)
                blob_tokens = re.findall(r'[a-z0-9]+', text_blob)
                matches = sum(1 for t in query_tokens if t in blob_tokens)
                if matches > 0:
                    score += matches
                
                if score == 0:
                    continue
            else:
                score = 1
                
            results.append((enemy, score))
        
        results.sort(key=lambda x: x[1], reverse=True)
        return [r[0] for r in results[:top_k]]
    
    def search_locations(
        self,
        query: str = "",
        location_type: Optional[str] = None,
        max_difficulty: Optional[int] = None,
        top_k: int = 10
    ) -> List[dict]:
        """Search locations by name, type, or difficulty."""
        if not self._loaded:
            self.load_items()
        
        results = []
        query_lower = query.lower() if query else ""
        
        for name, loc in self.locations.items():
            # Apply type filter
            if location_type and location_type != "all":
                if loc.get("location_type", "").lower() != location_type.lower():
                    continue
            
            # Apply difficulty filter
            if max_difficulty is not None:
                if loc.get("difficulty", 0) > max_difficulty:
                    continue
            
            # Score by text query
            score = 0
            if query_lower:
                enemies_str = ' '.join(loc.get('enemies', []))
                bosses_str = ' '.join(loc.get('bosses', []))
                legendaries_str = ' '.join(loc.get('legendaries', []))
                text_blob = f"{name} {loc.get('location_type', '')} {enemies_str} {bosses_str} {legendaries_str}".lower()
                
                if query_lower in name.lower():
                    score += 10
                elif query_lower in text_blob:
                    score += 5
                
                query_tokens = re.findall(r'[a-z0-9]+', query_lower)
                blob_tokens = re.findall(r'[a-z0-9]+', text_blob)
                matches = sum(1 for t in query_tokens if t in blob_tokens)
                if matches > 0:
                    score += matches
                
                if score == 0:
                    continue
            else:
                score = 1
            
            results.append((loc, score))
        
        results.sort(key=lambda x: x[1], reverse=True)
        return [r[0] for r in results[:top_k]]
    
    def get_item(self, name: str) -> Optional[dict]:
        """Get a single item by name."""
        if not self._loaded:
            self.load_items()
        return self.items.get(name)
    
    def get_item_by_name(self, name: str) -> Optional[dict]:
        """Get a single item by exact name."""
        if not self._loaded:
            self.load_items()
        return self.items.get(name)
    
    def get_enemy_by_name(self, name: str) -> Optional[dict]:
        """Get a single enemy by exact name."""
        if not self._loaded:
            self.load_items()
        return self.enemies.get(name)
    
    def get_location_by_name(self, name: str) -> Optional[dict]:
        """Get a single location by exact name."""
        if not self._loaded:
            self.load_items()
        return self.locations.get(name)
    
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
            "total_enemies": len(self.enemies),
            "total_locations": len(self.locations),
            "has_embeddings": False,
            "types": types,
            "tiers": tiers,
        }
