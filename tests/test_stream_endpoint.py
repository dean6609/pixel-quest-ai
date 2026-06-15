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
