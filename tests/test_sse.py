from pq_ai.deepseek_rag import sse_event

def test_sse_format():
    out = sse_event("reasoning", {"delta": "hola"})
    assert out == 'event: reasoning\ndata: {"delta": "hola"}\n\n'

def test_sse_unicode_not_escaped():
    out = sse_event("answer", {"delta": "árbol"})
    assert "árbol" in out
