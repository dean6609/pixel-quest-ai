"""DeepSeek API integration for RAG via Function Calling."""

import os
import json
import logging
import re
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

def parse_text_tool_calls(content: str) -> Optional[List[Dict[str, Any]]]:
    """Parse tool calls from text format like <｜｜DSML｜｜tool_calls>."""
    if not content or '<｜｜DSML｜｜tool_calls>' not in content:
        return None
    
    tool_calls = []
    # Pattern to match: <｜｜DSML｜｜invoke name="function_name"> ... </｜｜DSML｜｜invoke>
    invoke_pattern = r'<｜｜DSML｜｜invoke name="([^"]+)">(.*?)</｜｜DSML｜｜invoke>'
    matches = re.findall(invoke_pattern, content, re.DOTALL)
    
    for func_name, args_text in matches:
        # Extract parameters from <｜｜DSML｜｜parameter name="key" string="true">value</｜｜DSML｜｜parameter>
        param_pattern = r'<｜｜DSML｜｜parameter name="([^"]+)"[^>]*>([^<]*)</｜｜DSML｜｜parameter>'
        params = re.findall(param_pattern, args_text)
        
        args = {}
        for param_name, param_value in params:
            args[param_name] = param_value.strip()
        
        tool_calls.append({
            "id": f"call_{len(tool_calls)}",
            "type": "function",
            "function": {
                "name": func_name,
                "arguments": json.dumps(args)
            }
        })
    
    return tool_calls if tool_calls else None


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
    """Main RAG query function using Function Calling with multi-round tool loop."""
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
    MAX_TOOL_ROUNDS = 4
    
    try:
        for round_num in range(MAX_TOOL_ROUNDS + 1):
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
                temperature=0.3,
                max_tokens=1500
            )
            
            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls
            
            logger.info(f"Round {round_num + 1} - Content length: {len(response_message.content) if response_message.content else 0}")
            logger.info(f"Round {round_num + 1} - Structured tool_calls: {tool_calls}")
            
            use_text_tool_calls = False
            
            if (tool_calls is None or len(tool_calls) == 0) and response_message.content:
                text_tool_calls = parse_text_tool_calls(response_message.content)
                if text_tool_calls:
                    logger.info(f"Detected {len(text_tool_calls)} text-based tool calls, parsing...")
                    tool_calls = text_tool_calls
                    use_text_tool_calls = True
                    content = response_message.content
                    content = re.sub(r'<｜｜DSML｜｜tool_calls>.*?</｜｜DSML｜｜tool_calls>', '', content, flags=re.DOTALL).strip()
                    response_message.content = content
                    logger.info(f"Cleaned content: {response_message.content[:200]}...")
                else:
                    logger.info("No text-based tool calls detected in content")
            
            # If no tool calls, this is the final response
            if not tool_calls:
                logger.info(f"Final response after {round_num + 1} round(s), length: {len(response_message.content) if response_message.content else 0}")
                return response_message.content or ""
            
            logger.info(f"Round {round_num + 1} - Processing {len(tool_calls)} tool calls...")
            
            if use_text_tool_calls:
                messages.append({
                    "role": "assistant",
                    "content": response_message.content,
                    "tool_calls": [
                        {
                            "id": tc["id"],
                            "type": "function",
                            "function": {
                                "name": tc["function"]["name"],
                                "arguments": tc["function"]["arguments"]
                            }
                        } for tc in tool_calls
                    ]
                })
            else:
                messages.append(response_message)
            
            for tool_call in tool_calls:
                if isinstance(tool_call, dict):
                    func_name = tool_call.get("function", {}).get("name")
                    args_str = tool_call.get("function", {}).get("arguments")
                    tool_call_id = tool_call.get("id")
                else:
                    func_name = tool_call.function.name
                    args_str = tool_call.function.arguments
                    tool_call_id = tool_call.id
                
                if func_name == "search_database":
                    args = json.loads(args_str)
                    logger.info(f"Searching: query={args.get('query')}, tier={args.get('tier')}, type={args.get('item_type')}")
                    
                    search_results = search_engine.search(
                        query=args.get("query", ""),
                        tier_filter=args.get("tier"),
                        type_filter=args.get("item_type"),
                        weapon_type_filter=args.get("weapon_type"),
                        top_k=10
                    )
                    
                    tool_content = format_search_results(search_results)
                    logger.info(f"Found {len(search_results)} results")
                    
                    messages.append({
                        "tool_call_id": tool_call_id,
                        "role": "tool",
                        "name": "search_database",
                        "content": tool_content
                    })
        
        # Exhausted all tool rounds - force a text response without tools
        logger.warning(f"Exhausted {MAX_TOOL_ROUNDS} tool rounds, forcing text response...")
        final_response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.3,
            max_tokens=1500
        )
        final_content = final_response.choices[0].message.content
        logger.info(f"Forced final response length: {len(final_content) if final_content else 0}")
        return final_content or ""
            
    except Exception as e:
        logger.error(f"DeepSeek API error: {e}")
        return f"⚠️ Error al consultar la IA: {e}"
