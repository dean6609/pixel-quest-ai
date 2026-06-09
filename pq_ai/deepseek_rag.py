"""DeepSeek API integration for RAG."""

import os
import json
import logging
from typing import Optional, List, Dict

logger = logging.getLogger(__name__)

# DeepSeek API configuration — key is loaded from environment variable
# Set DEEPSEEK_API_KEY in your .env file or system environment before running.
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")

# Optional: use structured client
try:
    from openai import OpenAI
    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url=DEEPSEEK_BASE_URL,
    )
    HAS_OPENAI = True
except Exception as e:
    logger.warning(f"OpenAI client not available: {e}")
    client = None
    HAS_OPENAI = False


def query_deepseek(
    messages: List[Dict[str, str]],
    temperature: float = 0.3,
    max_tokens: int = 2000,
) -> Optional[str]:
    """Query DeepSeek API with chat messages."""
    if not HAS_OPENAI:
        return "⚠️ DeepSeek API no está disponible en este momento."
    
    try:
        response = client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"DeepSeek API error: {e}")
        return f"⚠️ Error al consultar la IA: {e}"


SYSTEM_PROMPT = """Eres el Oráculo del Wiki, un experto asesor de Pixel Quest — un MMORPG bullet-hell de Roblox con permadeath.

Tu rol es recomendar objetos, builds y estrategias basándote en datos reales del wiki del juego.
Eres un compañero de conversación: recuerdas lo que se ha hablado antes y construyes sobre ello.

## REGLAS ESTRICTAS:
1. Solo recomiendas objetos que existen en los datos proporcionados.
2. Mantén coherencia con lo que dijiste antes en esta misma conversación. Si antes recomendaste un item, recuérdalo.
3. Explica POR QUÉ un objeto es bueno (stats, pasivas, sinergias).
4. Considera el nivel, zona disponible y estilo de juego del jugador.
5. Si el usuario pregunta "¿y ese item?" o referencias vagas, usa el contexto anterior de la conversación para entender a qué se refiere.

## DATOS DEL JUEGO:
- Tier: T0 (peor) → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → LG → CORRUPTED (mejor)
- Tipos de armas: Sword, Bow, Staff, Dagger, Axe, Fan
- Tipos de armadura: Heavy, Leather, Robe + slots (Helmet, Boot, Gauntlet, etc.)
- Accesorios: Ring, Pendant, Bracelet, Belt, Crown, Hat, Totem, etc.
- Valor: moneda que se obtiene al morir (permadeath). Más valor bonus = más monedas.
- Los objetos tienen requisitos de stats (SPD, STR, DEX, INT, etc.)

## COMPORTAMIENTO EN CONVERSACIÓN:
- Si hay mensajes previos en esta conversación, considera todo ese contexto para dar respuestas coherentes.
- Puedes referenciar recomendaciones anteriores: "Como te mencioné antes, X es bueno porque..."
- Si la pregunta actual es una continuación obvia de la anterior, responde naturalmente como si fuera un chat.

## FORMATO DE RESPUESTA:
Sé claro y conciso. Usa markdown con listas y negritas. Si recomiendas objetos, da el nombre exacto, tier y razón."""


def build_context(items: List[dict], query: str, level: int = 0, location: str = "") -> str:
    """Build a compact context from items for the RAG prompt."""
    if not items:
        return ""
    
    context_parts = [f"## Contexto ({len(items)} objetos relevantes):\n"]
    
    for item in items[:12]:  # Max 12 items to control token usage
        weapon_info = ""
        if item.get("weapon_stats"):
            ws = item["weapon_stats"]
            weapon_info = f" | DMG:{ws.get('damage','?')} Range:{ws.get('range','?')} RoF:{ws.get('rate_of_fire','?')}"
        
        passives = item.get("passives", [])
        passive_str = f" | Pasivas: {'; '.join(passives[:2])}" if passives else ""
        
        dropped = item.get("dropped_by", [])
        drop_str = f" | Drop: {', '.join(dropped[:3])}" if dropped else ""
        
        loc_str = f" | Zona: {location}" if location else ""
        
        context_parts.append(
            f"- **{item.get('name', '?')}** [{item.get('tier', '?')}] "
            f"({item.get('item_type', item.get('weapon_type', '?'))})"
            f"{weapon_info}{passive_str}{drop_str}{loc_str}"
        )
    
    return "\n".join(context_parts)


def ask_rag(query: str, items: list, level: int = 0, location: str = "", history: Optional[List[Dict[str, str]]] = None) -> str:
    """Main RAG query function."""
    context = build_context(items, query, level, location)
    
    user_prompt = f"""## Consulta del jugador:
{query}

{context if context else "⚠️ No se encontraron objetos relevantes en la base de datos."}

## Nivel del jugador: {level if level else 'No especificado'}
## Zona/Localización: {location if location else 'No especificada'}

Basado en los datos anteriores, responde a la consulta del jugador de manera útil y precisa."""
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
    ]
    if history:
        for turn in history:
            messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": user_prompt})
    
    return query_deepseek(messages)
