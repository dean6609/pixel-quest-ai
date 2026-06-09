#!/usr/bin/env python3
"""Pixel Quest AI - Main entry point.
A hybrid RAG system for querying Pixel Quest game wiki data.

Usage:
    python main.py sync                    # Full sync from wiki
    python main.py update                  # Incremental update
    python main.py ask "your question"     # Ask the AI
    python main.py search "query"          # Search items
    python main.py interactive             # Interactive mode
"""

# Load environment variables from .env file (if present)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed; rely on system env vars

from pq_ai.cli import main

if __name__ == "__main__":
    main()
