"""Pixel Quest AI - Web Frontend (serving static Vite + React build)."""
import sys, os, json, logging, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables from .env file (if present)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed; rely on system env vars

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Literal
import uvicorn

from pq_ai.database import Database
from pq_ai.search import SearchEngine
from pq_ai.deepseek_rag import ask_rag, strip_reasoning, strip_html_reasoning, ask_rag_stream
from pq_ai import extractor as wiki_extractor

logging.basicConfig(level=logging.INFO, format='%(message)s')
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("huggingface_hub").setLevel(logging.WARNING)
logger = logging.getLogger('web')

BASE = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(title="Pixel Quest AI", version="1.0.0")

db = Database()
loaded = db.load()
search = SearchEngine()
if loaded:
    logger.info(f"Loaded {len(db.items)} items")
else:
    logger.warning("No database found! Run sync first")

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class AskRequest(BaseModel):
    query: str
    level: Optional[int] = 0
    location: Optional[str] = ""
    history: Optional[List[Message]] = []

class SearchRequest(BaseModel):
    query: str
    tier: Optional[str] = ""
    item_type: Optional[str] = ""
    limit: Optional[int] = 20

# API endpoints
@app.get("/api/stats")
def get_stats():
    return JSONResponse(db.get_stats() if loaded else {"error": "No data"})

@app.post("/api/search")
def search_items(req: SearchRequest):
    if not loaded:
        raise HTTPException(400, "No database")
    filters = {}
    if req.tier: filters["tier"] = req.tier
    if req.item_type: filters["item_type"] = req.item_type
    results = search.search(req.query, top_k=req.limit,
                           tier_filter=req.tier if req.tier else None,
                           type_filter=req.item_type if req.item_type else None)
    items_out = []
    for r in results:
        d = r.item if hasattr(r, 'item') else r
        if isinstance(d, dict):
            d.pop('_score', None)
            items_out.append(d)
        elif hasattr(d, 'to_dict'):
            items_out.append(d.to_dict())
    return JSONResponse({"items": items_out, "total": len(items_out)})

@app.post("/api/ask")
def ask(req: AskRequest):
    if not loaded:
        raise HTTPException(400, "No database")
    try:
        # Sanitize/Truncate history
        sanitized_history = []
        if req.history:
            # Enforce role alternation by merging consecutive messages of the same role
            normalized_history = []
            for msg in req.history:
                if normalized_history and normalized_history[-1]["role"] == msg.role:
                    normalized_history[-1]["content"] += "\n" + msg.content
                else:
                    normalized_history.append({"role": msg.role, "content": msg.content})
            
            # Keep only the last 10 messages of the normalized history
            truncated_history = normalized_history[-10:]
            for msg in truncated_history:
                content = msg["content"]
                # Strip HTML reasoning blocks and <think> tags before truncating
                # so the 2000-char limit applies to clean text, not inflated HTML
                content = strip_html_reasoning(content)
                content = strip_reasoning(content)
                if len(content) > 2000:
                    content = content[:2000] + "... [truncated]"
                sanitized_history.append({"role": msg["role"], "content": content})
        
        response = ask_rag(req.query, search, level=req.level, location=req.location, history=sanitized_history)
        return JSONResponse({"response": response, "items_used": -1})
    except Exception as e:
        logger.error(f"Ask error: {e}")
        return JSONResponse({"response": f"Error: {e}", "items_used": 0})

@app.post("/api/ask/stream")
def ask_stream(req: AskRequest):
    if not loaded:
        raise HTTPException(400, "No database")
    history = [{"role": m.role, "content": strip_reasoning(strip_html_reasoning(m.content))}
               for m in (req.history or [])][-10:]
    gen = ask_rag_stream(req.query, search, level=req.level, location=req.location, history=history)
    return StreamingResponse(gen, media_type="text/event-stream")

@app.get("/api/items")
def list_items(tier: Optional[str] = None, item_type: Optional[str] = None, limit: int = 50):
    if not loaded: raise HTTPException(400, "No data")
    result = []
    for item in db.get_all_items():
        d = item.to_dict() if hasattr(item, 'to_dict') else item.__dict__
        if tier and d.get('tier', '') != tier: continue
        if item_type and d.get('item_type', '') != item_type: continue
        result.append(d)
        if len(result) >= limit: break
    return JSONResponse({"items": result, "total": len(result)})

@app.get("/api/tiers")
def get_tiers():
    if not loaded: return JSONResponse([])
    tiers = set()
    for item in db.get_all_items():
        t = item.tier if hasattr(item, 'tier') else ''
        if t: tiers.add(t)
    return JSONResponse(sorted(tiers))

@app.get("/api/types")
def get_types():
    if not loaded: return JSONResponse([])
    types = set()
    for item in db.get_all_items():
        t = item.item_type if hasattr(item, 'item_type') else ''
        if t: types.add(t)
    return JSONResponse(sorted(types))


@app.get("/api/changes")
def get_recent_changes(limit: int = 20):
    """Get recent changes from the wiki."""
    try:
        changes = wiki_extractor.get_recent_changes(limit=limit)
        return JSONResponse({"changes": changes, "total": len(changes)})
    except Exception as e:
        logger.error(f"Changes error: {e}")
        return JSONResponse({"changes": [], "total": 0, "error": str(e)})

# Serve the Vite (React + R3F) static build
FRONTEND_DIR = os.path.join(BASE, "frontend", "dist")
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
else:
    logger.warning("Frontend build not found. Run `npm run build` in frontend directory.")
    @app.get("/", response_class=HTMLResponse)
    def index():
        return HTMLResponse(content="<h1>Frontend build not found. Run `npm run build` in the frontend directory.</h1>")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"Pixel Quest AI running at http://localhost:{port}")
    uvicorn.run("web_app:app", host="0.0.0.0", port=port, log_level="info", reload=False)
