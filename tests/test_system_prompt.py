from pq_ai.deepseek_rag import build_system_prompt
from tests.test_game_reference import FakeSearch

def test_prompt_has_no_persona_or_emoji_and_includes_reference():
    p = build_system_prompt(FakeSearch())
    # Neutral identity established and persona explicitly disclaimed (per spec §3.4)
    assert "Eres un asistente experto" in p
    assert "no eres un oráculo" in p.lower()
    assert "No uses emojis" in p
    # no emoji characters
    assert all(ord(c) < 0x1F000 for c in p)
    # dynamic reference injected
    assert "Referencia del juego" in p and "Bow" in p
