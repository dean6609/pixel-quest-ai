"""DeepSeek API integration for RAG via Function Calling."""

import os
import json
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

def get_openai_client():
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
        
    api_key = os.environ.get("DEEPSEEK_API_KEY", "")
    base_url = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
    
    if not api_key:
        return None
        
    try:
        from openai import OpenAI
        return OpenAI(api_key=api_key, base_url=base_url)
    except Exception as e:
        logger.warning(f"OpenAI client not available: {e}")
        return None

SYSTEM_PROMPT = """Eres el Oráculo del Wiki, un experto asesor de Pixel Quest — un MMORPG bullet-hell con permadeath.

Tu rol es recomendar objetos, builds y estrategias basándote en datos reales del wiki.
¡NO INVENTES OBJETOS! Si no conoces un objeto o no tienes datos suficientes, TIENES que usar la herramienta `search_database` para buscarlo.
Si te preguntan por recomendaciones para empezar (ej. "arco inicial"), usa la herramienta para buscar por categoría (ej. "Bow") y filtra por Tiers bajos (ej. "T1" o "T2").

## REGLAS ESTRICTAS:
1. Solo recomiendas objetos que existen en los datos.
2. Si el usuario pregunta algo general, usa la herramienta de búsqueda para obtener contexto antes de responder.
3. Considera el nivel, zona disponible y estilo de juego del jugador si te lo proporcionan.
4. NUNCA rompas la cuarta pared. NUNCA menciones que usaste una "herramienta" o "base de datos". 

## DATOS DEL JUEGO:
- Tier: T0 (peor) → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → LG → CORRUPTED (mejor)
- Tipos de armas: Sword, Bow, Staff, Dagger, Axe, Fan
- Tipos de armadura: Heavy Armor, Leather Armor, Robe Armor
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_database",
            "description": "Busca objetos en el wiki de Pixel Quest.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Texto libre para buscar (nombres, descripciones)."
                    },
                    "tier": {
                        "type": "string",
                        "description": "Filtro de nivel exacto, ej. 'T1', 'T2', 'LG'."
                    },
                    "item_type": {
                        "type": "string",
                        "description": "Tipo de objeto general, ej. 'Primary Weapon', 'Armor', 'Accessory'."
                    },
                    "weapon_type": {
                        "type": "string",
                        "description": "Tipo de arma específica, ej. 'Bow', 'Sword', 'Staff'."
                    }
                }
            }
        }
    }
]

def format_search_results(items: List[dict]) -> str:
    """Format search results into a readable string for the LLM."""
    if not items:
        return "No se encontraron objetos que coincidan con la búsqueda."
    
    parts = []
    for item in items[:10]: # Max 10 items
        weapon_info = ""
        if item.get("weapon_stats"):
            ws = item["weapon_stats"]
            weapon_info = f" | DMG:{ws.get('damage','?')} Range:{ws.get('range','?')} RoF:{ws.get('rate_of_fire','?')}"
        
        passives = item.get("passives", [])
        passive_str = f" | Pasivas: {'; '.join(passives[:2])}" if passives else ""
        
        dropped = item.get("dropped_by", [])
        drop_str = f" | Drop: {', '.join(dropped[:3])}" if dropped else ""
        
        itype = item.get('item_type', '?')
        wtype = item.get('weapon_type', '')
        type_str = f"{itype} - {wtype}" if wtype and wtype != itype else itype
        
        parts.append(
            f"- {item.get('name', '?')} [{item.get('tier', '?')}] "
            f"({type_str}){weapon_info}{passive_str}{drop_str}"
        )
    return "\n".join(parts)

def ask_rag(query: str, search_engine: Any, level: int = 0, location: str = "", history: Optional[List[Dict[str, str]]] = None) -> str:
    """Main RAG query function using Function Calling."""
    client = get_openai_client()
    if not client:
        return "⚠️ DeepSeek API no está disponible en este momento. Revisa tu clave API."
    
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if history:
        for turn in history:
            messages.append({"role": turn["role"], "content": turn["content"]})
            
    user_prompt = f"Consulta del jugador: {query}\n"
    if level: user_prompt += f"Nivel: {level}\n"
    if location: user_prompt += f"Zona: {location}\n"
    
    messages.append({"role": "user", "content": user_prompt})
    
    model = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
    
    try:
        # First call to LLM, giving it the tool
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.3,
            max_tokens=1000
        )
        
        response_message = response.choices[0].message
        
        # Check if the model wants to call a function
        if response_message.tool_calls:
            messages.append(response_message) # Append the tool call itself
            
            for tool_call in response_message.tool_calls:
                if tool_call.function.name == "search_database":
                    args = json.loads(tool_call.function.arguments)
                    
                    search_results = search_engine.search(
                        query=args.get("query", ""),
                        tier_filter=args.get("tier"),
                        type_filter=args.get("item_type"),
                        weapon_type_filter=args.get("weapon_type"),
                        top_k=10
                    )
                    
                    tool_content = format_search_results(search_results)
                    
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": "search_database",
                        "content": tool_content
                    })
            
            # Second call to LLM to get final answer after tools
            final_response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.3,
                max_tokens=1500
            )
            return final_response.choices[0].message.content
            
        else:
            return response_message.content
            
    except Exception as e:
        logger.error(f"DeepSeek API error: {e}")
        return f"⚠️ Error al consultar la IA: {e}"
