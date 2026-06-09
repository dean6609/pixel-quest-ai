"""MediaWiki API data extractor for Pixel Quest wiki."""

import json
import time
import urllib.request
import urllib.parse
import urllib.error
import logging
from typing import Optional

from . import config

logger = logging.getLogger(__name__)


def api_request(params: dict) -> Optional[dict]:
    """Make a request to the MediaWiki API with retry logic."""
    params["format"] = "json"
    url = f"{config.WIKI_API}?{urllib.parse.urlencode(params, doseq=True)}"
    
    for attempt in range(3):
        try:
            req = urllib.request.Request(url)
            req.add_header("User-Agent", "PixelQuestAI/1.0")
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return data
        except Exception as e:
            logger.warning(f"API request failed (attempt {attempt + 1}): {e}")
            time.sleep(1)
    
    return None


def get_all_categories() -> list:
    """Get all categories from the wiki."""
    categories = []
    acfrom = ""
    
    while True:
        params = {
            "action": "query",
            "list": "allcategories",
            "aclimit": 500,
            "acfrom": acfrom,
        }
        result = api_request(params)
        if not result:
            break
        
        for cat in result.get("query", {}).get("allcategories", []):
            categories.append(cat["*"])
        
        if "continue" in result and "acfrom" in result["continue"]:
            acfrom = result["continue"]["acfrom"]
        else:
            break
    
    return categories


def get_category_members(category: str, limit: int = 500) -> list:
    """Get all pages in a category."""
    pages = []
    cmcontinue = ""
    
    while True:
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": f"Category:{category}",
            "cmlimit": min(limit, 500),
            "cmcontinue": cmcontinue,
        }
        result = api_request(params)
        if not result:
            break
        
        for member in result.get("query", {}).get("categorymembers", []):
            pages.append({
                "pageid": member["pageid"],
                "title": member["title"],
                "ns": member["ns"],
            })
        
        if "continue" in result and "cmcontinue" in result["continue"]:
            cmcontinue = result["continue"]["cmcontinue"]
        else:
            break
    
    return pages


def get_page_wikitext(title: str) -> Optional[str]:
    """Get the raw wikitext of a page."""
    params = {
        "action": "query",
        "prop": "revisions",
        "titles": title,
        "rvprop": "content",
        "rvslots": "main",
    }
    result = api_request(params)
    if not result:
        return None
    
    pages = result.get("query", {}).get("pages", {})
    for pageid, page in pages.items():
        if "revisions" in page and page["revisions"]:
            return page["revisions"][0].get("slots", {}).get("main", {}).get("*", "")
    
    return None


def get_recent_changes(limit: int = 50) -> list:
    """Get recent changes from the wiki."""
    params = {
        "action": "query",
        "list": "recentchanges",
        "rcprop": "title|timestamp|ids|comment",
        "rclimit": min(limit, 500),
        "rcnamespace": "0",  # Main namespace only
    }
    result = api_request(params)
    if not result:
        return []
    
    return result.get("query", {}).get("recentchanges", [])


def get_all_page_titles_in_namespace(namespace: int = 0, limit: int = 500) -> list:
    """Get all page titles in a given namespace."""
    titles = []
    apfrom = ""
    
    while True:
        params = {
            "action": "query",
            "list": "allpages",
            "apnamespace": namespace,
            "aplimit": min(limit, 500),
            "apfrom": apfrom,
        }
        result = api_request(params)
        if not result:
            break
        
        for page in result.get("query", {}).get("allpages", []):
            titles.append(page["title"])
        
        if "continue" in result and "apfrom" in result["continue"]:
            apfrom = result["continue"]["apfrom"]
        else:
            break
    
    return titles


def extract_tier_from_text(text: str) -> str:
    """Extract tier information from wikitext."""
    tier_map = {
        "tier_star": "LG",
        "tier_corrupted": "CORRUPTED",
        "tier_0": "T0",
        "tier_1": "T1",
        "tier_2": "T2",
        "tier_3": "T3",
        "tier_4": "T4",
        "tier_5": "T5",
        "tier_6": "T6",
        "tier_7": "T7",
        "tier_8": "T8",
    }
    for key, value in tier_map.items():
        if key in text.lower():
            return value
    return ""


def parse_damage_range(damage_str: str) -> tuple:
    """Parse a damage string like '130-150' or '360-420'."""
    import re
    match = re.search(r"(\d+)\s*[-–]\s*(\d+)", damage_str)
    if match:
        return (float(match.group(1)), float(match.group(2)))
    match = re.search(r"(\d+)", damage_str)
    if match:
        v = float(match.group(1))
        return (v, v)
    return (0, 0)
