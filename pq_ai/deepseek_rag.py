"""DeepSeek API integration for RAG via Function Calling."""

import os
import json
import logging
import re
from typing import Optional, List, Dict, Any
from . import config

logger = logging.getLogger(__name__)


def strip_reasoning(content: str) -> str:
    """Remove <think> reasoning blocks and other model artifacts from response."""
    if not content:
        return content
    content = re.sub(r'<think>[\s\S]*?<\/think>', '', content)
    content = re.sub(r'<thinking>[\s\S]*?</thinking>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'\n{3,}', '\n\n', content).strip()
    return content


def strip_html_reasoning(content: str) -> str:
    """Remove oracle-thinking HTML blocks from content before sending as history.

    The frontend stores assistant responses that include <details class="oracle-thinking">
    blocks. When these are sent back as conversation history, they contaminate the model's
    context and cause it to malfunction on follow-up queries.
    """
    if not content:
        return content
    content = re.sub(r'<details class="oracle-thinking">[\s\S]*?</details>\s*', '', content)
    content = re.sub(r'\n{3,}', '\n\n', content).strip()
    return content


def extract_reasoning(content: str) -> tuple:
    """Extract reasoning blocks from content and convert to collapsible HTML.
    Returns (reasoning_html, clean_content)."""
    if not content:
        return "", content

    reasoning_blocks = []

    # Extract <think> blocks
    def _capture_think(m):
        reasoning_blocks.append(m.group(1).strip())
        return ""
    content = re.sub(r'<think>([\s\S]*?)</think>', _capture_think, content)

    # Extract <thinking> blocks
    def _capture_thinking(m):
        reasoning_blocks.append(m.group(1).strip())
        return ""
    content = re.sub(r'<thinking>([\s\S]*?)</thinking>', _capture_thinking, content, flags=re.IGNORECASE)

    content = re.sub(r'\n{3,}', '\n\n', content).strip()

    reasoning_html = ""
    if reasoning_blocks:
        combined = "\n\n".join(reasoning_blocks)
        reasoning_html = (
            '<details class="oracle-thinking">'
            '<summary><span class="oracle-thinking-icon">🧠</span> Razonamiento del Oracle</summary>'
            f'<div class="oracle-thinking-content">{combined}</div>'
            '</details>\n\n'
        )

    return reasoning_html, content

def get_openai_client():
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
        
    api_key = os.environ.get("DEEPSEEK_API_KEY", "")
    base_url = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    
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
¡NO INVENTES OBJETOS! Si no conoces un objeto o no tienes datos suficientes, TIENES que usar las herramientas de búsqueda para buscarlo.
Si te preguntan por recomendaciones para empezar (ej. "arco inicial"), usa la herramienta para buscar por categoría (ej. "Bow") y filtra por Tiers bajos (ej. "T1" o "T2").

## HERRAMIENTAS DISPONIBLES:
- `search_database`: Busca objetos, armas, armaduras, accesorios. Puedes filtrar por tier, tipo de arma, etc.
- `search_enemies`: Busca enemigos y jefes. Puedes filtrar por categoría, ubicación, tipo.
- `search_locations`: Busca ubicaciones y dungeons. Puedes filtrar por tipo y dificultad.

## REGLAS ESTRICTAS:
1. Solo recomiendas objetos/enemigos/ubicaciones que existen en los datos.
2. Si el usuario pregunta algo general, usa la herramienta de búsqueda para obtener contexto antes de responder.
3. Considera el nivel, zona disponible y estilo de juego del jugador si te lo proporcionan.
4. NUNCA rompas la cuarta pared. NUNCA menciones que usaste una "herramienta" o "base de datos".
5. Si necesitas consultar varios temas, haz TODAS las búsquedas necesarias en un mismo turno (en paralelo), no una por una. No repitas una búsqueda que ya hiciste.
6. Tómate el tiempo que necesites para investigar, pero SIEMPRE termina con una respuesta clara y útil para el jugador.

## HIPERVÍNCULOS:
Cuando menciones un objeto, enemigo o ubicación por nombre, SIEMPRE incluye un hipervínculo markdown a su página del wiki.
Formato: [Nombre del Objeto](https://wiki.playpixelquest.com/wiki/Nombre_del_Objeto)
Usa guiones bajos (_) en lugar de espacios en la URL. Codifica caracteres especiales.

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
            "description": "Busca objetos/armas/armaduras en el wiki de Pixel Quest. Úsalo cuando el usuario pregunte por items, armas, armaduras, builds, o recomendaciones de equipamiento.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Texto libre para buscar (nombres, descripciones)."
                    },
                    "tier": {
                        "type": "string",
                        "description": "Filtro de nivel exacto, ej. 'T1', 'T2', 'LG', 'CORRUPTED'."
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
    },
    {
        "type": "function",
        "function": {
            "name": "search_enemies",
            "description": "Busca enemigos y jefes en el wiki de Pixel Quest. Úsalo cuando el usuario pregunte por enemigos, jefes, drops de enemigos, o dónde encontrar enemigos.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Nombre o texto libre del enemigo."
                    },
                    "category": {
                        "type": "string",
                        "description": "Categoría del enemigo: 'Bosses', 'Enemies', 'Friendlies', 'NPCs'."
                    },
                    "location": {
                        "type": "string",
                        "description": "Ubicación donde se encuentra el enemigo."
                    },
                    "entity_type": {
                        "type": "string",
                        "description": "Tipo: 'boss', 'regular', 'npc'."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_locations",
            "description": "Busca ubicaciones y dungeons en el wiki de Pixel Quest. Úsalo cuando el usuario pregunte por zonas, dungeons, o dónde farmear.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Nombre o texto libre de la ubicación."
                    },
                    "location_type": {
                        "type": "string",
                        "description": "Tipo: 'dungeon' o 'location'."
                    },
                    "max_difficulty": {
                        "type": "integer",
                        "description": "Dificultad máxima (1-10)."
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
    for item in items[:10]:
        wiki_url = config.get_wiki_url(item.get('name', ''))
        
        weapon_info = ""
        if item.get("weapon_stats"):
            ws = item["weapon_stats"]
            weapon_info = f" | DMG:{ws.get('damage','?')} Range:{ws.get('range','?')} RoF:{ws.get('rate_of_fire','?')}"
        
        passives = item.get("passives", [])
        passive_str = f" | Pasivas: {'; '.join(passives[:2])}" if passives else ""
        
        dropped = item.get("dropped_by", [])
        drop_str = f" | Drop: {', '.join(dropped[:3])}" if dropped else ""
        
        # On equip stats
        on_equip = item.get("on_equip", {})
        equip_str = ""
        if on_equip:
            equip_parts = [f"+{v} {k.capitalize()}" for k, v in on_equip.items()]
            equip_str = f" | Equip: {', '.join(equip_parts)}"
        
        itype = item.get('item_type', '?')
        wtype = item.get('weapon_type', '')
        type_str = f"{itype} - {wtype}" if wtype and wtype != itype else itype
        
        parts.append(
            f"- [{item.get('name', '?')}]({wiki_url}) [{item.get('tier', '?')}] "
            f"({type_str}){weapon_info}{passive_str}{drop_str}{equip_str}"
        )
    return "\n".join(parts)


def format_enemy_results(enemies: List[dict]) -> str:
    """Format enemy search results for the LLM."""
    if not enemies:
        return "No se encontraron enemigos que coincidan con la búsqueda."
    
    parts = []
    for enemy in enemies[:10]:
        wiki_url = config.get_wiki_url(enemy.get('name', ''))
        
        hp = enemy.get('hp', '')
        defense = enemy.get('defense', '')
        location = enemy.get('location', '')
        entity_type = enemy.get('entity_type', '')
        immunities = enemy.get('immunities', [])
        drops = enemy.get('drops', [])
        
        type_str = f" ({entity_type})" if entity_type else ""
        hp_str = f" | HP: {hp}" if hp else ""
        def_str = f" | Def: {defense}" if defense else ""
        loc_str = f" | Ubicación: {location}" if location else ""
        imm_str = f" | Inmunidades: {', '.join(immunities)}" if immunities else ""
        drop_str = f" | Drops: {', '.join(drops[:5])}" if drops else ""
        
        parts.append(
            f"- [{enemy.get('name', '?')}]({wiki_url}){type_str}{hp_str}{def_str}{loc_str}{imm_str}{drop_str}"
        )
    return "\n".join(parts)


def format_location_results(locations: List[dict]) -> str:
    """Format location search results for the LLM."""
    if not locations:
        return "No se encontraron ubicaciones que coincidan con la búsqueda."
    
    parts = []
    for loc in locations[:10]:
        wiki_url = config.get_wiki_url(loc.get('name', ''))
        
        loc_type = loc.get('location_type', '')
        difficulty = loc.get('difficulty', 0)
        perma = loc.get('perma_death', False)
        max_players = loc.get('max_players', 0)
        enemies = loc.get('enemies', [])
        bosses = loc.get('bosses', [])
        legendaries = loc.get('legendaries', [])
        
        type_str = f" ({loc_type})" if loc_type else ""
        diff_str = f" | Dificultad: {difficulty}/10" if difficulty else ""
        perma_str = " | ⚠️ Perma death" if perma else ""
        players_str = f" | Max jugadores: {max_players}" if max_players else ""
        boss_str = f" | Jefes: {', '.join(bosses[:3])}" if bosses else ""
        enemy_str = f" | Enemigos: {len(enemies)}" if enemies else ""
        leg_str = f" | Legendarios: {', '.join(legendaries[:3])}" if legendaries else ""
        
        parts.append(
            f"- [{loc.get('name', '?')}]({wiki_url}){type_str}{diff_str}{perma_str}{players_str}{boss_str}{enemy_str}{leg_str}"
        )
    return "\n".join(parts)

def _tool_call_signature(tool_call: Any) -> tuple:
    """Build a (name, arguments) signature to detect repeated tool calls."""
    if isinstance(tool_call, dict):
        fn = tool_call.get("function", {})
        return (fn.get("name"), fn.get("arguments"))
    return (tool_call.function.name, tool_call.function.arguments)


def _force_final_answer(client: Any, messages: List[Dict[str, Any]], model: str,
                        thinking_params: Dict[str, Any]) -> str:
    """Force a clean final answer without tools.

    Guarantees a non-empty response even when the model returns everything as
    reasoning content (the blank-response bug). Used both when the round backstop
    is reached and when the model loops on repeated searches.
    """
    messages = messages + [{
        "role": "user",
        "content": "Da tu respuesta final al jugador basándote en lo que ya investigaste. "
                   "No busques más, solo responde de forma clara y útil.",
    }]
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.3,
        max_tokens=3000,
        extra_body=thinking_params,
    )
    content = response.choices[0].message.content or ""
    reasoning_html, clean_content = extract_reasoning(content)

    # Last resort: if it STILL returned only reasoning, ask once more without
    # thinking so we never hand the user a blank message.
    if not clean_content.strip():
        logger.warning("Forced answer was empty (all reasoning) — retrying without thinking...")
        retry_messages = messages + [
            {"role": "assistant", "content": content},
            {"role": "user", "content": "Por favor, da tu respuesta final al jugador. No pienses más, solo responde."},
        ]
        retry = client.chat.completions.create(
            model=model,
            messages=retry_messages,
            temperature=0.3,
            max_tokens=3000,
        )
        extra_reasoning, clean_content = extract_reasoning(retry.choices[0].message.content or "")
        reasoning_html += extra_reasoning

    return reasoning_html + clean_content


def ask_rag(query: str, search_engine: Any, level: int = 0, location: str = "", history: Optional[List[Dict[str, str]]] = None) -> str:
    """Main RAG query function using Function Calling with multi-round tool loop."""
    client = get_openai_client()
    if not client:
        return "⚠️ DeepSeek API no está disponible en este momento. Revisa tu clave API."
    
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if history:
        for turn in history:
            # Strip HTML reasoning blocks that were stored for display
            # but would contaminate the model's conversation context
            clean_content = strip_html_reasoning(turn["content"])
            messages.append({"role": turn["role"], "content": clean_content})
            
    user_prompt = f"Consulta del jugador: {query}\n"
    if level: user_prompt += f"Nivel: {level}\n"
    if location: user_prompt += f"Zona: {location}\n"
    
    messages.append({"role": "user", "content": user_prompt})
    
    model = os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-flash")
    # Generous safety backstop, not a functional cap: the model searches as much
    # as it needs and answers when ready. This only protects against runaway loops.
    MAX_TOOL_ROUNDS = 25
    seen_signatures: set = set()

    # DeepSeek v4 thinking mode parameters (sent via extra_body for OpenAI SDK compat)
    thinking_params = {
        "thinking": {"type": "enabled"},
        "reasoning_effort": "high",
    }
    
    try:
        for round_num in range(MAX_TOOL_ROUNDS + 1):
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
                temperature=0.3,
                max_tokens=3000,
                extra_body=thinking_params
            )
            
            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls
            
            # Capture reasoning_content if DeepSeek returns it separately
            api_reasoning = getattr(response_message, 'reasoning_content', None) or ""
            
            logger.info(f"Round {round_num + 1} - Content length: {len(response_message.content) if response_message.content else 0}")
            logger.info(f"Round {round_num + 1} - Reasoning length: {len(api_reasoning)}")
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
                reasoning_html, clean_content = extract_reasoning(response_message.content or "")
                # Prepend API-level reasoning if available
                if api_reasoning:
                    reasoning_html = (
                        '<details class="oracle-thinking">'
                        '<summary><span class="oracle-thinking-icon">🧠</span> Razonamiento del Oracle</summary>'
                        f'<div class="oracle-thinking-content">{api_reasoning}</div>'
                        '</details>\n\n'
                    ) + reasoning_html

                logger.info(f"Reasoning detected: api={bool(api_reasoning)}, html_blocks={bool(reasoning_html)}")
                logger.info(f"History turns: {len(history) if history else 0}, model={model}")

                # If all content was inside thinking tags, force a final answer
                if not clean_content.strip() and reasoning_html:
                    logger.info("All content was reasoning — requesting final answer...")
                    messages.append({"role": "assistant", "content": response_message.content or ""})
                    messages.append({"role": "user", "content": "Por favor, da tu respuesta final al jugador basándote en tu análisis. No pienses más, solo responde."})
                    forced = client.chat.completions.create(
                        model=model,
                        messages=messages,
                        temperature=0.3,
                        max_tokens=3000,
                        extra_body=thinking_params
                    )
                    clean_content = forced.choices[0].message.content or ""
                    extra_reasoning, clean_content = extract_reasoning(clean_content)
                    reasoning_html += extra_reasoning

                return reasoning_html + clean_content

            # Repetition guard: if every search requested this round was already
            # executed before, the model is looping — force it to answer instead.
            current_signatures = {_tool_call_signature(tc) for tc in tool_calls}
            if current_signatures and current_signatures.issubset(seen_signatures):
                logger.warning("Repeated tool calls detected — forcing final answer")
                return _force_final_answer(client, messages, model, thinking_params)
            seen_signatures |= current_signatures

            logger.info(f"Round {round_num + 1} - Processing {len(tool_calls)} tool calls...")
            
            if use_text_tool_calls:
                messages.append({
                    "role": "assistant",
                    "content": strip_reasoning(response_message.content),
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
                
                elif func_name == "search_enemies":
                    args = json.loads(args_str)
                    logger.info(f"Searching enemies: query={args.get('query')}, category={args.get('category')}")
                    
                    enemy_results = search_engine.search_enemies(
                        query=args.get("query", ""),
                        category=args.get("category"),
                        location=args.get("location"),
                        entity_type=args.get("entity_type"),
                        top_k=10
                    )
                    
                    tool_content = format_enemy_results(enemy_results)
                    logger.info(f"Found {len(enemy_results)} enemies")
                    
                    messages.append({
                        "tool_call_id": tool_call_id,
                        "role": "tool",
                        "name": "search_enemies",
                        "content": tool_content
                    })
                
                elif func_name == "search_locations":
                    args = json.loads(args_str)
                    logger.info(f"Searching locations: query={args.get('query')}, type={args.get('location_type')}")
                    
                    location_results = search_engine.search_locations(
                        query=args.get("query", ""),
                        location_type=args.get("location_type"),
                        max_difficulty=args.get("max_difficulty"),
                        top_k=10
                    )
                    
                    tool_content = format_location_results(location_results)
                    logger.info(f"Found {len(location_results)} locations")
                    
                    messages.append({
                        "tool_call_id": tool_call_id,
                        "role": "tool",
                        "name": "search_locations",
                        "content": tool_content
                    })
        
        # Reached the safety backstop - force a clean final answer (never blank)
        logger.warning(f"Reached backstop of {MAX_TOOL_ROUNDS} tool rounds, forcing final answer...")
        return _force_final_answer(client, messages, model, thinking_params)
            
    except Exception as e:
        logger.error(f"DeepSeek API error: {e}")
        return f"⚠️ Error al consultar la IA: {e}"
