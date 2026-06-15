# Streaming Backend + Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Server-Sent-Events streaming endpoint that emits the model's reasoning, a discreet activity signal, and the final answer live; and replace the static persona prompt with a neutral, emoji-free prompt whose game reference is generated dynamically from the (already corrected) data.

**Architecture:** A new generator `ask_rag_stream` in `pq_ai/deepseek_rag.py` reruns the Function-Calling loop with `stream=True`, yielding typed SSE events. A FastAPI endpoint wraps it in a `StreamingResponse`. The system prompt is assembled at runtime, injecting a reference block built from the loaded `SearchEngine` data. The existing non-streaming `ask_rag` (used by the CLI) is left intact.

**Tech Stack:** Python, FastAPI, OpenAI-compatible SDK (DeepSeek), pytest (new dev dependency).

**Reference spec:** `docs/superpowers/specs/2026-06-14-grimoire-streaming-redesign-design.md` (sub-project A).

---

### Task 0: Test infrastructure

**Files:**
- Modify: `requirements.txt`
- Create: `tests/__init__.py` (empty)
- Create: `tests/conftest.py`

- [ ] **Step 1: Add pytest to requirements**

Append to `requirements.txt`:
```
# ── Dev / tests ──────────────────────────────────────────────────────────────
pytest>=8.0.0
```

- [ ] **Step 2: Install**

Run: `pip install -r requirements.txt`
Expected: pytest installed.

- [ ] **Step 3: Create test package**

Create empty `tests/__init__.py`. Create `tests/conftest.py`:
```python
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
```

- [ ] **Step 4: Verify pytest runs**

Run: `pytest -q`
Expected: "no tests ran" (exit 0/5), no import errors.

- [ ] **Step 5: Commit**
```bash
git add requirements.txt tests/__init__.py tests/conftest.py
git commit -m "test: add pytest dev dependency and test scaffold"
```

---

### Task 1: `build_game_reference` helper

Generates the dynamic "Referencia del juego" block from loaded data.

**Files:**
- Modify: `pq_ai/deepseek_rag.py`
- Test: `tests/test_game_reference.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_game_reference.py
from pq_ai.deepseek_rag import build_game_reference

class FakeSearch:
    items = {
        "Acclaimed Armor": {"tier": "T4", "item_type": "Armor", "subtype": "Heavy Armor"},
        "Adept Boots": {"tier": "LG", "item_type": "Accessory", "subtype": "Boot"},
        "Long Bow": {"tier": "T1", "item_type": "Primary Weapon", "subtype": "Bow"},
    }
    enemies = {"Slime": {"category": "Enemies"}, "King": {"category": "Bosses"}}
    locations = {"Cave": {"location_type": "dungeon", "difficulty": 3},
                 "Town": {"location_type": "location", "difficulty": 0}}

def test_reference_lists_present_values_in_tier_order():
    ref = build_game_reference(FakeSearch())
    # Tiers ordered by progression, only those present
    assert "T1, T4, LG" in ref
    # Top-level types with their present subtypes
    assert "Primary Weapon" in ref and "Bow" in ref
    assert "Armor" in ref and "Heavy Armor" in ref
    assert "Accessory" in ref and "Boot" in ref
    # Enemy categories and location types
    assert "Enemies" in ref and "Bosses" in ref
    assert "dungeon" in ref and "location" in ref
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_game_reference.py -v`
Expected: FAIL — `ImportError: cannot import name 'build_game_reference'`.

- [ ] **Step 3: Implement**

Add to `pq_ai/deepseek_rag.py` (near the top, after imports add `from . import config, taxonomy`):
```python
def build_game_reference(search_engine: Any) -> str:
    """Build the '## Referencia del juego' block from the loaded data so it
    never goes stale after a sync."""
    if not getattr(search_engine, "_loaded", False):
        search_engine.load_items()

    items = search_engine.items.values()

    present_tiers = {it.get("tier") for it in items if it.get("tier")}
    tiers = [t for t, _ in sorted(config.TIER_ORDER.items(), key=lambda kv: kv[1])
             if t in present_tiers]

    # type -> ordered present subtypes
    present_sub = {}
    for it in items:
        present_sub.setdefault(it.get("item_type", ""), set()).add(it.get("subtype", ""))
    type_lines = []
    for top, subs in taxonomy.TAXONOMY.items():
        here = [s for s in subs if s in present_sub.get(top, set())]
        if here:
            type_lines.append(f"  - {top}: {', '.join(here)}")

    enemy_cats = sorted({e.get("category") for e in search_engine.enemies.values() if e.get("category")})
    loc_types = sorted({l.get("location_type") for l in search_engine.locations.values() if l.get("location_type")})
    diffs = [l.get("difficulty") for l in search_engine.locations.values()
             if isinstance(l.get("difficulty"), (int, float))]
    diff_range = f"{min(diffs)}-{max(diffs)}" if diffs else "?"

    lines = ["## Referencia del juego (generada desde la base actual)"]
    lines.append(f"- Tiers (de inicial a final): {', '.join(tiers)}")
    lines.append("- Tipos de objeto y sus subtipos:")
    lines.extend(type_lines)
    lines.append(f"- Categorías de enemigo: {', '.join(enemy_cats)}")
    lines.append(f"- Tipos de ubicación: {', '.join(loc_types)} (dificultad {diff_range})")
    return "\n".join(lines)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_game_reference.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add pq_ai/deepseek_rag.py tests/test_game_reference.py
git commit -m "feat(rag): generate game reference dynamically from data"
```

---

### Task 2: New neutral system prompt assembly

**Files:**
- Modify: `pq_ai/deepseek_rag.py` (replace `SYSTEM_PROMPT` constant + its usage; remove 🧠 emoji)
- Test: `tests/test_system_prompt.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_system_prompt.py
from pq_ai.deepseek_rag import build_system_prompt
from tests.test_game_reference import FakeSearch

def test_prompt_has_no_persona_or_emoji_and_includes_reference():
    p = build_system_prompt(FakeSearch())
    assert "oráculo" not in p.lower() and "mago" not in p.lower()
    assert "No uses emojis" in p
    # no emoji characters
    assert all(ord(c) < 0x1F000 for c in p)
    # dynamic reference injected
    assert "Referencia del juego" in p and "Bow" in p
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_system_prompt.py -v`
Expected: FAIL — `cannot import name 'build_system_prompt'`.

- [ ] **Step 3: Implement**

In `pq_ai/deepseek_rag.py`, replace the `SYSTEM_PROMPT = """Eres el Oráculo..."""`
block with a base template + builder. Use the exact prompt text from the spec
§3.4 with the placeholder `<<REFERENCIA_DINAMICA>>`:
```python
SYSTEM_PROMPT_BASE = """Eres un asistente experto en datos de Pixel Quest, un MMORPG bullet-hell con
permadeath. Das información precisa y útil sobre objetos, enemigos, ubicaciones,
builds y estrategias, basándote ÚNICAMENTE en los datos reales del wiki.

## Voz y estilo
- Directo, claro y preciso. NO interpretas un personaje: no eres un oráculo, mago
  ni narrador. Hablas como un experto que conoce el juego a fondo.
- No uses emojis.
- Responde en el idioma del jugador.
- Da datos concretos (stats, números, ubicaciones), no afirmaciones vagas.
- No narres tu proceso ni menciones herramientas o bases de datos: solo responde.

## Exactitud (lo más importante)
- NUNCA inventes objetos, enemigos, ubicaciones, stats ni efectos. Si no tienes el
  dato, búscalo. Si tras buscar no existe, dilo con claridad.
- NO asumas que un tier más alto es siempre mejor. El tier indica progresión y
  rareza, pero la mejor opción depende del nivel, la zona, la build y el estilo del
  jugador. Compara con stats y efectos reales, nunca con suposiciones.
- Al recomendar, explica POR QUÉ con datos: daño, alcance, cadencia, pasivas,
  efectos al equipar, y dónde se consigue.

## Búsqueda
- Si necesitas consultar varios temas, haz todas las búsquedas en un mismo turno;
  no repitas una búsqueda ya hecha.
- Investiga lo que necesites, pero SIEMPRE cierra con una respuesta clara y útil.

## Datos disponibles
- Objetos: tier, tipo, subtipo, stats (daño/alcance/cadencia), pasivas,
  efectos al equipar, y qué enemigo los dropea.
- Enemigos: HP, defensa, ubicación, tipo (jefe/regular/npc), inmunidades, drops.
- Ubicaciones: tipo, dificultad (1-10), permadeath, jugadores máx., enemigos,
  jefes y legendarios.
- Cruza estos datos cuando ayude (ej. "para conseguir X, derrota a Y en la zona Z").

## Hipervínculos
Al mencionar un objeto, enemigo o ubicación por nombre, enlázalo en markdown:
[Nombre](https://wiki.playpixelquest.com/wiki/Nombre). Usa guiones bajos en vez de
espacios y codifica caracteres especiales.

<<REFERENCIA_DINAMICA>>"""

def build_system_prompt(search_engine: Any) -> str:
    return SYSTEM_PROMPT_BASE.replace("<<REFERENCIA_DINAMICA>>",
                                      build_game_reference(search_engine))
```
Then in `ask_rag`, change `messages = [{"role": "system", "content": SYSTEM_PROMPT}]`
to `messages = [{"role": "system", "content": build_system_prompt(search_engine)}]`.
Also remove the `🧠 ` from the two `<summary>` strings in `extract_reasoning` and
the forced-answer branch (replace `'<span class="oracle-thinking-icon">🧠</span> Razonamiento del Oracle'`
with `'Razonamiento del Oracle'`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_system_prompt.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add pq_ai/deepseek_rag.py tests/test_system_prompt.py
git commit -m "feat(rag): neutral emoji-free system prompt with dynamic reference"
```

---

### Task 3: SSE event serialization

**Files:**
- Modify: `pq_ai/deepseek_rag.py`
- Test: `tests/test_sse.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_sse.py
from pq_ai.deepseek_rag import sse_event

def test_sse_format():
    out = sse_event("reasoning", {"delta": "hola"})
    assert out == 'event: reasoning\ndata: {"delta": "hola"}\n\n'

def test_sse_unicode_not_escaped():
    out = sse_event("answer", {"delta": "árbol"})
    assert "árbol" in out
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_sse.py -v`
Expected: FAIL — `cannot import name 'sse_event'`.

- [ ] **Step 3: Implement**
```python
def sse_event(event: str, data: Dict[str, Any]) -> str:
    """Serialize one Server-Sent Event."""
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_sse.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add pq_ai/deepseek_rag.py tests/test_sse.py
git commit -m "feat(rag): add SSE event serializer"
```

---

### Task 4: `ask_rag_stream` generator

The streaming variant of the tool loop. Yields SSE strings.

**Files:**
- Modify: `pq_ai/deepseek_rag.py`
- Test: `tests/test_ask_rag_stream.py`

- [ ] **Step 1: Write the failing test (with a mocked DeepSeek client)**

```python
# tests/test_ask_rag_stream.py
import json, types
import pq_ai.deepseek_rag as dr
from tests.test_game_reference import FakeSearch

def _chunk(content=None, reasoning=None, tool_calls=None):
    delta = types.SimpleNamespace(content=content, reasoning_content=reasoning,
                                  tool_calls=tool_calls)
    return types.SimpleNamespace(choices=[types.SimpleNamespace(delta=delta)])

class FakeStream:
    """Iterable of chunks for one create() call."""
    def __init__(self, chunks): self._chunks = chunks
    def __iter__(self): return iter(self._chunks)

class FakeClient:
    """Returns queued streams on successive create() calls."""
    def __init__(self, streams): self._streams = list(streams); self.calls = 0
    class _Chat:
        def __init__(self, outer): self.completions = outer
    @property
    def chat(self): return types.SimpleNamespace(completions=self)
    def create(self, **kw):
        s = self._streams[self.calls]; self.calls += 1; return FakeStream(s)

def _events(gen):
    return [e for e in gen]

def test_simple_answer_no_tools(monkeypatch):
    # one round: reasoning then final content, no tool calls
    client = FakeClient([[_chunk(reasoning="pensando"), _chunk(content="Hola jugador")]])
    monkeypatch.setattr(dr, "get_openai_client", lambda: client)
    fs = FakeSearch(); fs._loaded = True
    out = "".join(_events(dr.ask_rag_stream("hi", fs)))
    assert "event: reasoning" in out and "pensando" in out
    assert "event: answer" in out and "Hola jugador" in out
    assert out.strip().endswith("event: done\ndata: {}")

def test_empty_final_triggers_force(monkeypatch):
    # final round has only reasoning, no content -> force_final_answer used
    client = FakeClient([[_chunk(reasoning="solo razono")]])
    monkeypatch.setattr(dr, "get_openai_client", lambda: client)
    monkeypatch.setattr(dr, "_force_final_answer", lambda *a, **k: "Respuesta forzada")
    fs = FakeSearch(); fs._loaded = True
    out = "".join(_events(dr.ask_rag_stream("hi", fs)))
    assert "Respuesta forzada" in out and "event: answer" in out

def test_no_client_emits_error(monkeypatch):
    monkeypatch.setattr(dr, "get_openai_client", lambda: None)
    fs = FakeSearch(); fs._loaded = True
    out = "".join(_events(dr.ask_rag_stream("hi", fs)))
    assert "event: error" in out
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_ask_rag_stream.py -v`
Expected: FAIL — `module 'pq_ai.deepseek_rag' has no attribute 'ask_rag_stream'`.

- [ ] **Step 3: Implement**

Add to `pq_ai/deepseek_rag.py`:
```python
def _accumulate_tool_calls(acc: dict, deltas) -> None:
    """Merge streamed tool_call deltas into acc keyed by index."""
    for d in deltas or []:
        idx = getattr(d, "index", 0)
        slot = acc.setdefault(idx, {"id": None, "name": None, "arguments": ""})
        if getattr(d, "id", None):
            slot["id"] = d.id
        fn = getattr(d, "function", None)
        if fn is not None:
            if getattr(fn, "name", None):
                slot["name"] = fn.name
            if getattr(fn, "arguments", None):
                slot["arguments"] += fn.arguments


def ask_rag_stream(query: str, search_engine: Any, level: int = 0,
                   location: str = "", history: Optional[List[Dict[str, str]]] = None):
    """Streaming RAG. Yields SSE strings (event: reasoning/status/answer/done/error)."""
    client = get_openai_client()
    if not client:
        yield sse_event("error", {"message": "DeepSeek API no disponible. Revisa tu clave API."})
        return

    messages = [{"role": "system", "content": build_system_prompt(search_engine)}]
    if history:
        for turn in history:
            messages.append({"role": turn["role"],
                             "content": strip_html_reasoning(turn["content"])})
    user_prompt = f"Consulta del jugador: {query}\n"
    if level: user_prompt += f"Nivel: {level}\n"
    if location: user_prompt += f"Zona: {location}\n"
    messages.append({"role": "user", "content": user_prompt})

    model = os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-flash")
    MAX_TOOL_ROUNDS = 25
    seen_signatures: set = set()
    thinking_params = {"thinking": {"type": "enabled"}, "reasoning_effort": "high"}

    try:
        yield sse_event("status", {"state": "thinking"})
        for _round in range(MAX_TOOL_ROUNDS + 1):
            stream = client.chat.completions.create(
                model=model, messages=messages, tools=TOOLS, tool_choice="auto",
                temperature=0.3, max_tokens=3000, extra_body=thinking_params, stream=True)

            content_buf = ""
            tool_acc: dict = {}
            for chunk in stream:
                delta = chunk.choices[0].delta
                r = getattr(delta, "reasoning_content", None)
                if r:
                    yield sse_event("reasoning", {"delta": r})
                c = getattr(delta, "content", None)
                if c:
                    content_buf += c
                tc = getattr(delta, "tool_calls", None)
                if tc:
                    _accumulate_tool_calls(tool_acc, tc)

            tool_calls = [
                {"id": v["id"] or f"call_{i}", "type": "function",
                 "function": {"name": v["name"], "arguments": v["arguments"] or "{}"}}
                for i, v in sorted(tool_acc.items())
            ]

            if not tool_calls:
                final = content_buf
                if not strip_reasoning(final).strip():
                    final = _force_final_answer(client, messages, model, thinking_params)
                else:
                    _, final = extract_reasoning(final)
                if final:
                    yield sse_event("answer", {"delta": final})
                yield sse_event("done", {})
                return

            # repetition guard
            sigs = {(tc["function"]["name"], tc["function"]["arguments"]) for tc in tool_calls}
            if sigs and sigs.issubset(seen_signatures):
                yield sse_event("answer", {"delta": _force_final_answer(client, messages, model, thinking_params)})
                yield sse_event("done", {})
                return
            seen_signatures |= sigs

            yield sse_event("status", {"state": "searching"})
            messages.append({"role": "assistant", "content": content_buf or None,
                             "tool_calls": tool_calls})
            for tc in tool_calls:
                messages.append({"tool_call_id": tc["id"], "role": "tool",
                                 "name": tc["function"]["name"],
                                 "content": _run_tool(tc["function"]["name"],
                                                      tc["function"]["arguments"], search_engine)})
            yield sse_event("status", {"state": "thinking"})

        # backstop reached
        yield sse_event("answer", {"delta": _force_final_answer(client, messages, model, thinking_params)})
        yield sse_event("done", {})
    except Exception as e:
        logger.error(f"Stream error: {e}")
        yield sse_event("error", {"message": str(e)})
```
Also extract the existing per-tool dispatch (the `if func_name == "search_database" ...`
blocks inside `ask_rag`) into a reusable helper so both paths share it:
```python
def _run_tool(func_name: str, args_str: str, search_engine: Any) -> str:
    args = json.loads(args_str or "{}")
    if func_name == "search_database":
        results = search_engine.search(query=args.get("query", ""), tier_filter=args.get("tier"),
            type_filter=args.get("item_type"), weapon_type_filter=args.get("weapon_type"), top_k=10)
        return format_search_results(results)
    if func_name == "search_enemies":
        results = search_engine.search_enemies(query=args.get("query", ""), category=args.get("category"),
            location=args.get("location"), entity_type=args.get("entity_type"), top_k=10)
        return format_enemy_results(results)
    if func_name == "search_locations":
        results = search_engine.search_locations(query=args.get("query", ""),
            location_type=args.get("location_type"), max_difficulty=args.get("max_difficulty"), top_k=10)
        return format_location_results(results)
    return "Herramienta desconocida."
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_ask_rag_stream.py -v`
Expected: PASS (3 tests).

- [ ] **Step 5: Run full suite**

Run: `pytest -q`
Expected: all pass.

- [ ] **Step 6: Commit**
```bash
git add pq_ai/deepseek_rag.py tests/test_ask_rag_stream.py
git commit -m "feat(rag): streaming ask_rag_stream generator with SSE events"
```

---

### Task 5: FastAPI streaming endpoint

**Files:**
- Modify: `web_app.py`
- Test: `tests/test_stream_endpoint.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_stream_endpoint.py
from fastapi.testclient import TestClient
import pq_ai.deepseek_rag as dr
import web_app

def test_stream_endpoint(monkeypatch):
    def fake_stream(query, search, **kw):
        yield dr.sse_event("reasoning", {"delta": "x"})
        yield dr.sse_event("answer", {"delta": "ok"})
        yield dr.sse_event("done", {})
    monkeypatch.setattr(web_app, "ask_rag_stream", fake_stream)
    web_app.loaded = True
    client = TestClient(web_app.app)
    r = client.post("/api/ask/stream", json={"query": "hola"})
    assert r.status_code == 200
    assert "text/event-stream" in r.headers["content-type"]
    assert "event: answer" in r.text and "event: done" in r.text
```

(Requires `httpx`; it ships with FastAPI's TestClient. If missing: `pip install httpx`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_stream_endpoint.py -v`
Expected: FAIL — 404 (endpoint not defined).

- [ ] **Step 3: Implement**

In `web_app.py`: add to imports
`from pq_ai.deepseek_rag import ask_rag, strip_reasoning, strip_html_reasoning, ask_rag_stream`
and `from fastapi.responses import StreamingResponse`. Add the endpoint (before the
static-mount section so it is not shadowed):
```python
@app.post("/api/ask/stream")
def ask_stream(req: AskRequest):
    if not loaded:
        raise HTTPException(400, "No database")
    history = [{"role": m.role, "content": strip_reasoning(strip_html_reasoning(m.content))}
               for m in (req.history or [])][-10:]
    gen = ask_rag_stream(req.query, search, level=req.level, location=req.location, history=history)
    return StreamingResponse(gen, media_type="text/event-stream")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_stream_endpoint.py -v`
Expected: PASS.

- [ ] **Step 5: Run full suite**

Run: `pytest -q`
Expected: all pass.

- [ ] **Step 6: Commit**
```bash
git add web_app.py tests/test_stream_endpoint.py
git commit -m "feat(web): add /api/ask/stream SSE endpoint"
```

---

## Self-Review Notes
- Spec §3.1 endpoint → Task 5. §3.2 events → Tasks 3, 4. §3.3 loop → Task 4.
  §3.4 prompt + dynamic reference → Tasks 1, 2. §3.5 errors → Task 4 (error event,
  no-client). §3.6 tests → every task is TDD.
- `web_app.py` `FRONTEND_DIR` `out`→`dist` change belongs to the frontend plan
  (Task: serving), since `dist` only exists once the Vite app is built.
- Signatures used consistently: `build_game_reference`, `build_system_prompt`,
  `sse_event`, `ask_rag_stream`, `_run_tool`, `_force_final_answer`.
