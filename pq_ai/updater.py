"""Incremental updater for Pixel Quest wiki data."""

import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Optional

from . import config
from . import extractor
from . import parser
from .database import Database

logger = logging.getLogger(__name__)


class WikiUpdater:
    """Handles incremental updates to the local data store."""
    
    def __init__(self, db: Database):
        self.db = db
        self.last_sync = self._load_last_sync()
    
    def _load_last_sync(self) -> Optional[str]:
        """Load the timestamp of the last successful sync."""
        try:
            if os.path.exists(config.LAST_SYNC_FILE):
                with open(config.LAST_SYNC_FILE, "r") as f:
                    data = json.load(f)
                    return data.get("last_sync")
        except Exception as e:
            logger.warning(f"Could not load last sync time: {e}")
        return None
    
    def _save_last_sync(self, timestamp: str):
        """Save the timestamp of this sync."""
        os.makedirs(config.DATA_DIR, exist_ok=True)
        with open(config.LAST_SYNC_FILE, "w") as f:
            json.dump({"last_sync": timestamp}, f)
        self.last_sync = timestamp
    
    def check_for_updates(self) -> list:
        """Check for recently changed pages. Returns list of changed titles."""
        changes = extractor.get_recent_changes(limit=100)
        changed_titles = []
        
        for change in changes:
            title = change.get("title", "")
            timestamp = change.get("timestamp", "")
            
            # Skip non-main namespace or special pages
            if ":" in title and not title.startswith("Category:"):
                # Could be a file or template - check if it's equipment-related
                pass
            
            if title and title not in changed_titles:
                changed_titles.append({
                    "title": title,
                    "timestamp": timestamp,
                    "type": change.get("type", ""),
                    "pageid": change.get("pageid", 0),
                })
        
        return changed_titles
    
    def sync_page(self, title: str) -> bool:
        """Sync a single page from the wiki."""
        try:
            wikitext = extractor.get_page_wikitext(title)
            if not wikitext:
                logger.warning(f"No wikitext found for {title}")
                return False
            
            # Determine page type and parse accordingly
            if "PQ Item" in wikitext or "PQ_Item" in wikitext:
                item = parser.parse_item_wikitext(title, wikitext)
                if item:
                    self.db.save_item(item)
                    logger.info(f"Synced item: {title}")
                    return True
            elif "PQ Entity" in wikitext or "PQ_Entity" in wikitext:
                enemy = parser.parse_enemy_wikitext(title, wikitext)
                if enemy:
                    self.db.save_enemy(enemy)
                    logger.info(f"Synced enemy: {title}")
                    return True
            elif "PQ_Location" in wikitext or "PQ Location" in wikitext:
                location = parser.parse_location_wikitext(title, wikitext)
                if location:
                    self.db.save_location(location)
                    logger.info(f"Synced location: {title}")
                    return True
            elif title.startswith("Category:"):
                cat_name = title.replace("Category:", "", 1)
                if cat_name in config.WEAPON_CATEGORIES or \
                   cat_name in config.ARMOR_CATEGORIES or \
                   cat_name in config.ACCESSORY_CATEGORIES or \
                   cat_name in config.CONSUMABLE_CATEGORIES or \
                   cat_name in {"Equipment", "Items"}:
                    # Refresh items in this category
                    members = extractor.get_category_members(cat_name)
                    for member in members:
                        self.sync_page(member["title"])
                    logger.info(f"Synced category: {title} ({len(members)} items)")
                    return True
            else:
                # Try parsing as item (most game pages use PQ_Item template)
                if "{{PQ_Item" in wikitext or "{{PQ Item" in wikitext:
                    item = parser.parse_item_wikitext(title, wikitext)
                    if item:
                        self.db.save_item(item)
                        logger.info(f"Synced item (auto-detected): {title}")
                        return True
                
                # Check if it's an enemy page (PQ Entity template)
                enemy_data = parser.parse_enemy_wikitext(title, wikitext)
                if enemy_data:
                    self.db.save_enemy(enemy_data)
                    logger.info(f"Synced enemy (auto-detected): {title}")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error syncing page {title}: {e}")
            return False
    
    def full_sync(self):
        """Perform a full sync of all wiki data."""
        logger.info("Starting full wiki sync...")
        
        # Sync primary categories
        equipment_pages = extractor.get_category_members("Equipment", limit=500)
        logger.info(f"Found {len(equipment_pages)} equipment pages")
        
        for i, page in enumerate(equipment_pages):
            if i % 20 == 0:
                logger.info(f"Processing equipment {i}/{len(equipment_pages)}")
            self.sync_page(page["title"])
            time.sleep(config.REQUEST_DELAY)
        
        # Sync locations
        location_pages = extractor.get_category_members("Locations", limit=100)
        logger.info(f"Found {len(location_pages)} location pages")
        for page in location_pages:
            self.sync_page(page["title"])
            time.sleep(config.REQUEST_DELAY)
        
        # Sync dungeons
        dungeon_pages = extractor.get_category_members("Dungeon", limit=100)
        logger.info(f"Found {len(dungeon_pages)} dungeon pages")
        for page in dungeon_pages:
            if page["title"] not in [l["title"] for l in location_pages]:
                self.sync_page(page["title"])
                time.sleep(config.REQUEST_DELAY)
        
        # Sync enemies (first 200 out of 475 - can continue later)
        enemy_pages = extractor.get_category_members("Enemies", limit=500)
        logger.info(f"Found {len(enemy_pages)} enemy pages")
        for i, page in enumerate(enemy_pages):
            if i % 50 == 0:
                logger.info(f"Processing enemies {i}/{len(enemy_pages)}")
            self.sync_page(page["title"])
            time.sleep(config.REQUEST_DELAY)
        
        # Build relationships
        self.db.build_relationships()
        
        # Save sync time
        now = datetime.now(timezone.utc).isoformat()
        self._save_last_sync(now)
        
        # Actually save the database to JSON files
        self.db.save()
        
        logger.info(f"Full sync complete. Items: {len(self.db.items)}, "
                    f"Enemies: {len(self.db.enemies)}, "
                    f"Locations: {len(self.db.locations)}")
    
    def incremental_sync(self) -> dict:
        """Check for changes and sync only modified pages."""
        changes = self.check_for_updates()
        if not changes:
            return {"status": "no_changes", "updated": 0}
        
        updated = 0
        for change in changes:
            title = change["title"]
            success = self.sync_page(title)
            if success:
                updated += 1
        
        # Rebuild relationships if anything changed
        if updated > 0:
            self.db.build_relationships()
            now = datetime.now(timezone.utc).isoformat()
            self._save_last_sync(now)
            
            # Actually save the database to JSON files
            self.db.save()
        
        return {
            "status": "updated" if updated > 0 else "no_changes",
            "checked": len(changes),
            "updated": updated,
        }



