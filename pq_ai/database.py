"""JSON-based data store with indexing for Pixel Quest data."""

import json
import os
import logging
from typing import Optional, List
from datetime import datetime

from . import config
from .models import Item, Enemy, Location, Relationships

logger = logging.getLogger(__name__)


class Database:
    """Manages the local data store using JSON files."""
    
    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = data_dir or config.DATA_DIR
        os.makedirs(self.data_dir, exist_ok=True)
        
        self.items: dict[str, Item] = {}
        self.enemies: dict[str, Enemy] = {}
        self.locations: dict[str, Location] = {}
        self.relationships = Relationships()
        
        self._item_index: dict = {}  # additional indices
        self._loaded = False
    
    # ── Persistence ──────────────────────────────────────
    
    def save(self):
        """Save all data to JSON files."""
        items_dict = {k: v.to_dict() for k, v in self.items.items()}
        enemies_dict = {k: v.to_dict() for k, v in self.enemies.items()}
        locations_dict = {k: v.to_dict() for k, v in self.locations.items()}
        
        self._write_json(config.ITEMS_FILE, items_dict)
        self._write_json(config.ENEMIES_FILE, enemies_dict)
        self._write_json(config.LOCATIONS_FILE, locations_dict)
        self._write_json(config.RELATIONSHIPS_FILE, self.relationships.to_dict())
        
        logger.info(f"Saved {len(self.items)} items, {len(self.enemies)} enemies, "
                    f"{len(self.locations)} locations")
    
    def load(self) -> bool:
        """Load data from JSON files. Returns True if data was loaded."""
        items = self._read_json(config.ITEMS_FILE)
        enemies = self._read_json(config.ENEMIES_FILE)
        locations = self._read_json(config.LOCATIONS_FILE)
        rel = self._read_json(config.RELATIONSHIPS_FILE)
        
        if items is None:
            return False
        
        self.items = {k: Item.from_dict(v) for k, v in items.items()}
        self.enemies = {k: Enemy.from_dict(v) for k, v in (enemies or {}).items()}
        self.locations = {k: Location.from_dict(v) for k, v in (locations or {}).items()}
        self.relationships = Relationships.from_dict(rel) if rel else Relationships()
        
        self._rebuild_index()
        self._loaded = True
        logger.info(f"Loaded {len(self.items)} items, {len(self.enemies)} enemies, "
                    f"{len(self.locations)} locations")
        return True
    
    def needs_sync(self) -> bool:
        """Check if the data is stale (no sync in last 24h)."""
        sync_data = self._read_json(config.LAST_SYNC_FILE)
        if not sync_data:
            return True
        
        last = sync_data.get("timestamp", "")
        if not last:
            return True
        
        try:
            last_time = datetime.fromisoformat(last)
            delta = datetime.utcnow() - last_time
            return delta.total_seconds() > 86400  # 24h
        except:
            return True
    
    def mark_synced(self):
        """Record the last sync time."""
        self._write_json(config.LAST_SYNC_FILE, {
            "timestamp": datetime.utcnow().isoformat(),
        })
    
    # ── Indexing ──────────────────────────────────────────
    

    # ── Mutations ─────────────────────────────────────────

    def save_item(self, item):
        """Save or update an item."""
        self.items[item.name] = item

    def save_enemy(self, enemy):
        """Save or update an enemy."""
        self.enemies[enemy.name] = enemy

    def save_location(self, location):
        """Save or update a location."""
        self.locations[location.name] = location

    def build_relationships(self):
        """Build cross-reference relationships."""
        from .models import Relationships
        rel = Relationships()

        # item_to_enemies: item_name -> [enemy_names that drop it]
        # enemy_to_items: enemy_name -> [item_names it drops]
        for item_name, item in self.items.items():
            for enemy_name in item.dropped_by:
                # item -> enemies mapping
                if item_name not in rel.item_to_enemies:
                    rel.item_to_enemies[item_name] = []
                if enemy_name not in rel.item_to_enemies[item_name]:
                    rel.item_to_enemies[item_name].append(enemy_name)

                # enemy -> items mapping
                if enemy_name not in rel.enemy_to_items:
                    rel.enemy_to_items[enemy_name] = []
                if item_name not in rel.enemy_to_items[enemy_name]:
                    rel.enemy_to_items[enemy_name].append(item_name)

        # enemy_to_location: enemy_name -> location_name
        # location_to_enemies: location_name -> [enemy_names]
        for enemy_name, enemy in self.enemies.items():
            if enemy.location:
                rel.enemy_to_location[enemy_name] = enemy.location
                if enemy.location not in rel.location_to_enemies:
                    rel.location_to_enemies[enemy.location] = []
                if enemy_name not in rel.location_to_enemies[enemy.location]:
                    rel.location_to_enemies[enemy.location].append(enemy_name)

        self.relationships = rel

    def _rebuild_index(self):
        """Rebuild in-memory indices."""
        self._item_index = {
            "by_tier": {},
            "by_type": {},
            "by_category": {},
            "by_location": {},
        }
        
        for name, item in self.items.items():
            tier = item.tier
            if tier not in self._item_index["by_tier"]:
                self._item_index["by_tier"][tier] = []
            self._item_index["by_tier"][tier].append(name)
            
            itype = item.item_type
            if itype not in self._item_index["by_type"]:
                self._item_index["by_type"][itype] = []
            self._item_index["by_type"][itype].append(name)
            
            for cat in item.categories:
                if cat not in self._item_index["by_category"]:
                    self._item_index["by_category"][cat] = []
                self._item_index["by_category"][cat].append(name)
    
    # ── Queries ───────────────────────────────────────────
    
    def get_item(self, name: str) -> Optional[Item]:
        return self.items.get(name)
    
    def get_enemy(self, name: str) -> Optional[Enemy]:
        return self.enemies.get(name)
    
    def get_location(self, name: str) -> Optional[Location]:
        return self.locations.get(name)
    
    def get_items_by_tier(self, tier: str) -> List[Item]:
        names = self._item_index.get("by_tier", {}).get(tier, [])
        return [self.items[n] for n in names if n in self.items]
    
    def get_items_by_type(self, item_type: str) -> List[Item]:
        names = self._item_index.get("by_type", {}).get(item_type, [])
        return [self.items[n] for n in names if n in self.items]
    
    def get_items_by_category(self, category: str) -> List[Item]:
        names = self._item_index.get("by_category", {}).get(category, [])
        return [self.items[n] for n in names if n in self.items]
    
    def get_enemies_in_location(self, location: str) -> List[Enemy]:
        enemy_names = self.relationships.location_to_enemies.get(location, [])
        return [self.enemies[n] for n in enemy_names if n in self.enemies]
    
    def get_items_dropped_by(self, enemy_name: str) -> List[Item]:
        item_names = self.relationships.enemy_to_items.get(enemy_name, [])
        return [self.items[n] for n in item_names if n in self.items]
    
    def get_dropped_by_for_item(self, item_name: str) -> List[Enemy]:
        enemy_names = self.relationships.item_to_enemies.get(item_name, [])
        return [self.enemies[n] for n in enemy_names if n in self.enemies]
    
    def get_items_in_location(self, location: str) -> List[Item]:
        """Get all items that drop in a given location (via enemies)."""
        enemies = self.get_enemies_in_location(location)
        items = []
        seen = set()
        for enemy in enemies:
            for item_name in self.relationships.enemy_to_items.get(enemy.name, []):
                if item_name not in seen and item_name in self.items:
                    items.append(self.items[item_name])
                    seen.add(item_name)
        return items
    
    def search_by_name(self, query: str) -> List[Item]:
        """Simple name-based search."""
        query = query.lower()
        results = []
        for name, item in self.items.items():
            if query in name.lower():
                results.append(item)
        return results[:20]
    
    def get_all_items(self) -> List[Item]:
        return list(self.items.values())
    
    def get_all_enemies(self) -> List[Enemy]:
        return list(self.enemies.values())
    
    def get_all_locations(self) -> List[Location]:
        return list(self.locations.values())
    
    def get_stats(self) -> dict:
        """Get database statistics."""
        return {
            "items": len(self.items),
            "enemies": len(self.enemies),
            "locations": len(self.locations),
            "item_types": len(self._item_index.get("by_type", {})),
            "tiers": sorted(self._item_index.get("by_tier", {}).keys()),
        }
    
    # ── Helpers ───────────────────────────────────────────
    
    def _write_json(self, path: str, data: dict):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def _read_json(self, path: str) -> Optional[dict]:
        if not os.path.exists(path):
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.warning(f"Failed to read {path}: {e}")
            return None
