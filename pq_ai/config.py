"""Configuration for Pixel Quest AI."""

import os

# Wiki API
WIKI_API = "https://wiki.playpixelquest.com/api.php"
WIKI_BASE = "https://wiki.playpixelquest.com"

# Data storage paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

# JSON data files
ITEMS_FILE = os.path.join(DATA_DIR, "items.json")
ENEMIES_FILE = os.path.join(DATA_DIR, "enemies.json")
LOCATIONS_FILE = os.path.join(DATA_DIR, "locations.json")
RELATIONSHIPS_FILE = os.path.join(DATA_DIR, "relationships.json")
LAST_SYNC_FILE = os.path.join(DATA_DIR, "last_sync.json")

# Rate limiting
REQUEST_DELAY = 0.3  # seconds between API requests

# Search configuration
SEARCH_TOP_K = 15  # default number of results
RAG_TOP_K = 10  # items to include in RAG context

# Tier mapping for comparison
TIER_ORDER = {
    "T0": 0, "T1": 1, "T2": 2, "T3": 3, "T4": 4,
    "T5": 5, "T6": 6, "T7": 7, "T8": 8,
    "LG": 9, "CORRUPTED": 10
}

# Category relevance for item type classification
WEAPON_CATEGORIES = {"Sword", "Bow", "Staff", "Dagger", "Axe", "Fan",
                     "Primary Weapon", "Weapon", "Secondary Ability",
                     "Incantation", "Spell", "Bomb"}
ARMOR_CATEGORIES = {"Armor", "Heavy Armor", "Leather Armor", "Robe Armor",
                    "Helmet", "Boot", "Gauntlet", "Hat", "Crown"}
ACCESSORY_CATEGORIES = {"Accessory", "Ring", "Pendant", "Bracelet",
                        "Belt", "Backpack", "Clover", "Totem",
                        "Flag", "Banner", "Notifier", "Rune",
                        "Soul", "Tombstone"}
CONSUMABLE_CATEGORIES = {"Consumable", "Potion", "Food", "Scroll",
                         "Key", "Token", "Voucher", "Teleporter Stone",
                         "Experience Booster"}
