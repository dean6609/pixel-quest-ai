"""Data models for Pixel Quest game entities."""

from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class WeaponStats:
    damage: str = ""
    damage_min: float = 0
    damage_max: float = 0
    range: float = 0
    speed: float = 0
    rate_of_fire: float = 0
    total_projectiles: int = 1
    projectile_lifetime: float = 0
    pierces: bool = False
    pattern: str = ""


@dataclass
class Item:
    pageid: int = 0
    name: str = ""
    tier: str = ""
    item_type: str = ""  # Primary Weapon, Armor, Accessory, etc.
    weapon_type: str = ""  # Sword, Bow, Staff, Dagger, Axe (if weapon)
    categories: list = field(default_factory=list)
    description: str = ""
    tradable: bool = True
    drop_type: str = ""
    valor_bonus: float = 0
    forge_valor: int = 0
    passives: list = field(default_factory=list)
    properties: dict = field(default_factory=dict)
    weapon_stats: Optional[WeaponStats] = None
    dropped_by: list = field(default_factory=list)  # enemy names
    armor_stats: dict = field(default_factory=dict)  # for armor pieces
    requirements: dict = field(default_factory=dict)
    on_equip: dict = field(default_factory=dict)  # {"attack": 12, "defense": 12, "health": 50, "vitality": 15}
    
    def to_dict(self):
        result = asdict(self)
        if self.weapon_stats:
            result["weapon_stats"] = asdict(self.weapon_stats)
        return result
    
    @classmethod
    def from_dict(cls, data):
        if "weapon_stats" in data and data["weapon_stats"]:
            data["weapon_stats"] = WeaponStats(**data["weapon_stats"])
        return cls(**data)


@dataclass
class Enemy:
    pageid: int = 0
    name: str = ""
    location: str = ""  # dungeon/zone name
    category: str = ""
    hp: str = ""
    damage: str = ""
    drops: list = field(default_factory=list)  # item names that drop from this enemy
    armor: str = ""
    speed: str = ""
    abilities: list = field(default_factory=list)
    description: str = ""
    defense: str = ""
    experience: str = ""
    immunities: list = field(default_factory=list)
    entity_type: str = ""  # "boss", "regular", "npc"
    
    def to_dict(self):
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data):
        return cls(**data)


@dataclass
class Location:
    pageid: int = 0
    name: str = ""
    location_type: str = ""  # dungeon, overworld, etc.
    difficulty: int = 0
    recommended_level: str = ""
    biome: str = ""
    teleportation: bool = True
    perma_death: bool = False
    max_players: int = 20
    bosses: list = field(default_factory=list)
    enemies: list = field(default_factory=list)  # enemy names in this location
    description: str = ""
    max_pity: int = 0
    chest_health: str = ""
    legendaries: list = field(default_factory=list)
    found_entities: list = field(default_factory=list)  # entities found in this location
    
    def to_dict(self):
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data):
        return cls(**data)


@dataclass
class Relationships:
    """Cross-reference relationships between entities."""
    item_to_enemies: dict = field(default_factory=dict)  # item_name -> [enemy_names]
    enemy_to_items: dict = field(default_factory=dict)  # enemy_name -> [item_names]
    enemy_to_location: dict = field(default_factory=dict)  # enemy_name -> location_name
    location_to_enemies: dict = field(default_factory=dict)  # location_name -> [enemy_names]
    
    def to_dict(self):
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data):
        return cls(**data)
