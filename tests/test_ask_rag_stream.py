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
