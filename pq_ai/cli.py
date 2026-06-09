"""Command-line interface for Pixel Quest AI.

Usage:
    python -m pq_ai.cli sync           # Full sync from wiki
    python -m pq_ai.cli update         # Incremental update
    python -m pq_ai.cli stats          # Show data stats
    python -m pq_ai.cli ask "query"    # Ask a question
    python -m pq_ai.cli interactive    # Interactive mode
"""

import argparse
import json
import logging
import os
import sys
import time
from typing import Optional

from . import config
from .database import Database
from .updater import WikiUpdater
from .search import SearchEngine
from .rag import RAGEngine

logger = logging.getLogger(__name__)


def setup_logging(verbose: bool = False):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def cmd_sync(args):
    """Full sync from wiki."""
    db = Database()
    updater = WikiUpdater(db)
    
    print("=" * 60)
    print("  PIXEL QUEST AI - Full Wiki Sync")
    print("=" * 60)
    print()
    print("This will download all items, enemies, and locations from")
    print("the Pixel Quest wiki. This may take a few minutes.")
    print()
    
    if not args.yes:
        response = input("Continue? (y/n): ").strip().lower()
        if response != "y":
            print("Cancelled.")
            return
    
    print("\nStarting sync...\n")
    start = time.time()
    updater.full_sync()
    elapsed = time.time() - start
    
    print(f"\n{'=' * 60}")
    print(f"  Sync complete in {elapsed:.1f} seconds")
    print(f"  Items: {len(db.items)}")
    print(f"  Enemies: {len(db.enemies)}")
    print(f"  Locations: {len(db.locations)}")
    print(f"{'=' * 60}")


def cmd_update(args):
    """Incremental update - check for changes since last sync."""
    db = Database()
    updater = WikiUpdater(db)
    
    print("Checking for wiki updates...")
    result = updater.incremental_sync()
    
    if result["status"] == "no_changes":
        print("✓ No changes since last sync.")
    else:
        print(f"✓ Updated {result['updated']} pages "
              f"(checked {result['checked']} recent changes).")
    
    print(f"\nCurrent data:")
    print(f"  Items: {len(db.items)}")
    print(f"  Enemies: {len(db.enemies)}")
    print(f"  Locations: {len(db.locations)}")


def cmd_stats(args):
    """Show statistics about the loaded data."""
    db = Database()
    
    if not db.items and not db.enemies:
        print("No data loaded. Run 'sync' first.")
        return
    
    print("=" * 60)
    print("  PIXEL QUEST AI - Data Statistics")
    print("=" * 60)
    
    # Items stats
    print(f"\n📦 Items: {len(db.items)}")
    item_types = {}
    tiers = {}
    for item in db.items:
        t = item.item_type or "Unknown"
        item_types[t] = item_types.get(t, 0) + 1
        if item.tier:
            tiers[item.tier] = tiers.get(item.tier, 0) + 1
    
    print(f"  By type:")
    for t, c in sorted(item_types.items(), key=lambda x: -x[1]):
        print(f"    {t}: {c}")
    
    if tiers:
        print(f"  By tier:")
        for t in ["T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "LG", "CORRUPTED"]:
            if t in tiers:
                print(f"    {t}: {tiers[t]}")
    
    # Enemies
    print(f"\n👾 Enemies: {len(db.enemies)}")
    
    # Locations
    print(f"\n📍 Locations: {len(db.locations)}")
    loc_types = {}
    for loc in db.locations:
        lt = loc.location_type or "Unknown"
        loc_types[lt] = loc_types.get(lt, 0) + 1
    for t, c in sorted(loc_types.items(), key=lambda x: -x[1]):
        print(f"  {t}: {c}")
    
    # Relationships
    rel = db.relationships
    if rel:
        print(f"\n🔗 Relationships:")
        print(f"  Items with drop info: {len(rel.item_to_enemies)}")
        print(f"  Enemies with known drops: {len(rel.enemy_to_items)}")
        print(f"  Enemies linked to locations: {len(rel.enemy_to_location)}")
        print(f"  Locations with enemies: {len(rel.location_to_enemies)}")
    
    # Last sync
    if os.path.exists(config.LAST_SYNC_FILE):
        with open(config.LAST_SYNC_FILE) as f:
            sync_data = json.load(f)
            print(f"\n🕐 Last sync: {sync_data.get('last_sync', 'unknown')}")
    
    print()


def cmd_ask(args):
    """Ask a question to the RAG engine."""
    db = Database()
    
    if not db.items:
        print("No data loaded. Run 'sync' first.")
        return
    
    search = SearchEngine(db)
    rag = RAGEngine(search, db)
    
    query = " ".join(args.query) if isinstance(args.query, list) else args.query
    
    print(f"\n🔍 Query: {query}")
    print(f"{'=' * 60}\n")
    
    result = rag.answer(query)
    
    print(result["answer"])
    print(f"\n{'─' * 40}")
    print(f"📊 Sources: {result['sources_count']} items, "
          f"{result['enemies_count']} enemies, "
          f"{result['locations_count']} locations")
    print(f"📝 Tokens estimados: ~{result['estimated_tokens']}")
    
    if args.verbose and result.get("sources"):
        print(f"\n📋 Fuentes detalladas:")
        for s in result["sources"][:5]:
            print(f"  • {s['name']} ({s['type']}) - {s.get('tier', 'N/A')}"
                  f" - {s.get('location', '')}")
    
    print()


def cmd_interactive(args):
    """Interactive chat mode."""
    db = Database()
    
    if not db.items:
        print("No data loaded. Run 'sync' first.")
        return
    
    search = SearchEngine(db)
    rag = RAGEngine(search, db)
    
    print("=" * 60)
    print("  PIXEL QUEST AI - Interactive Mode")
    print("=" * 60)
    print()
    print("  Ask me anything about Pixel Quest items,")
    print("  builds, and strategies!")
    print()
    print("  Commands:")
    print("    /stats   - Show data statistics")
    print("    /sync    - Check for updates")
    print("    /help    - Show this help")
    print("    /quit    - Exit")
    print()
    
    # Show quick stats
    print(f"  Loaded: {len(db.items)} items, {len(db.enemies)} enemies, "
          f"{len(db.locations)} locations")
    print()
    
    while True:
        try:
            query = input("🎮 You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            break
        
        if not query:
            continue
        
        if query.startswith("/"):
            cmd = query[1:].lower()
            if cmd in ("quit", "exit", "q"):
                print("Bye!")
                break
            elif cmd == "stats":
                for item_type in set(i.item_type for i in db.items if i.item_type):
                    count = sum(1 for i in db.items if i.item_type == item_type)
                    print(f"  {item_type}: {count}")
                continue
            elif cmd == "sync":
                updater = WikiUpdater(db)
                result = updater.incremental_sync()
                print(f"  Updated: {result['updated']} pages")
                continue
            elif cmd == "help":
                print("  Commands: /stats, /sync, /help, /quit")
                continue
            else:
                print(f"  Unknown command: {cmd}")
                continue
        
        print(f"\n🤖 AI: ", end="", flush=True)
        
        result = rag.answer(query)
        
        # Type out the answer character by character for effect
        answer = result["answer"]
        for char in answer:
            print(char, end="", flush=True)
            time.sleep(0.01)
        
        print(f"\n\n  ─ Sources: {result['sources_count']} items | "
              f"~{result['estimated_tokens']} tokens ─\n")


def cmd_export(args):
    """Export data to JSON for external use."""
    db = Database()
    
    if not db.items:
        print("No data loaded. Run 'sync' first.")
        return
    
    export_path = args.output or os.path.join(config.DATA_DIR, "export.json")
    
    data = {
        "items": [item.to_dict() for item in db.items],
        "enemies": [e.to_dict() for e in db.enemies],
        "locations": [l.to_dict() for l in db.locations],
        "relationships": db.relationships.to_dict() if db.relationships else {},
        "stats": {
            "items": len(db.items),
            "enemies": len(db.enemies),
            "locations": len(db.locations),
        }
    }
    
    with open(export_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    file_size = os.path.getsize(export_path)
    print(f"✓ Exported to {export_path}")
    print(f"  Size: {file_size / 1024:.1f} KB")
    print(f"  Items: {len(db.items)}, Enemies: {len(db.enemies)}, "
          f"Locations: {len(db.locations)}")


def cmd_server(args):
    """Start a simple HTTP server for API access."""
    try:
        from .server import start_server
        db = Database()
        
        if not db.items:
            print("No data loaded. Run 'sync' first.")
            return
        
        search = SearchEngine(db)
        rag = RAGEngine(search, db)
        
        port = args.port or 8765
        print(f"Starting API server on http://localhost:{port}")
        print("Endpoints:")
        print(f"  GET  /api/ask?q=query  - Ask a question")
        print(f"  GET  /api/items        - List all items")
        print(f"  GET  /api/stats        - Show stats")
        print(f"  GET  /api/search?q=... - Search items")
        print("Press Ctrl+C to stop.\n")
        
        start_server(rag, db, port=port)
    except ImportError:
        print("Server dependencies not available.")
        print("Install with: pip install flask")


def main():
    parser = argparse.ArgumentParser(
        description="Pixel Quest AI - Wiki-powered item advisor"
    )
    parser.add_argument("-v", "--verbose", action="store_true",
                       help="Verbose output")
    
    subparsers = parser.add_subparsers(dest="command", help="Command")
    
    # Sync command
    p_sync = subparsers.add_parser("sync", help="Full sync from wiki")
    p_sync.add_argument("-y", "--yes", action="store_true",
                       help="Skip confirmation")
    
    # Update command
    subparsers.add_parser("update", help="Incremental update")
    
    # Stats command
    subparsers.add_parser("stats", help="Show data statistics")
    
    # Ask command
    p_ask = subparsers.add_parser("ask", help="Ask a question")
    p_ask.add_argument("query", nargs="+", help="Your question")
    p_ask.add_argument("--verbose", action="store_true",
                      help="Show source details")
    
    # Interactive command
    subparsers.add_parser("interactive", help="Interactive chat mode")
    
    # Export command
    p_export = subparsers.add_parser("export", help="Export data to JSON")
    p_export.add_argument("-o", "--output", help="Output file path")
    
    # Server command
    p_server = subparsers.add_parser("server", help="Start API server")
    p_server.add_argument("-p", "--port", type=int, default=8765,
                         help="Port number")
    
    args = parser.parse_args()
    
    if args.command:
        setup_logging(args.verbose if hasattr(args, 'verbose') else False)
        
        if args.command == "sync":
            cmd_sync(args)
        elif args.command == "update":
            cmd_update(args)
        elif args.command == "stats":
            cmd_stats(args)
        elif args.command == "ask":
            cmd_ask(args)
        elif args.command == "interactive":
            cmd_interactive(args)
        elif args.command == "export":
            cmd_export(args)
        elif args.command == "server":
            cmd_server(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
