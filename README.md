# Pixel Quest AI 🎮

Un asistente de IA con RAG (Retrieval-Augmented Generation) para el MMORPG **Pixel Quest** en Roblox.  
Responde preguntas sobre builds, ítems, stats y estrategias basándose en datos reales del [wiki oficial](https://wiki.playpixelquest.com).

## Características

- 🔍 **Búsqueda semántica** de ítems con `sentence-transformers`
- 🤖 **Chat con IA** (DeepSeek) con contexto del wiki
- 🌐 **Web app** con FastAPI + interfaz en HTML/JS
- 🔄 **Sincronización** automática con el wiki del juego
- 📦 **Modo CLI** interactivo para consultas rápidas

## Stack

| Capa        | Tecnología                  |
|-------------|-----------------------------|
| Backend     | FastAPI + Uvicorn            |
| IA / LLM    | DeepSeek Chat (API)          |
| Embeddings  | `sentence-transformers`      |
| Datos       | Wiki de Pixel Quest (scraped)|
| Frontend    | HTML / Vanilla JS            |

## Instalación rápida

```bash
# 1. Clonar
git clone https://github.com/TU_USUARIO/pixel-quest-ai.git
cd pixel-quest-ai

# 2. Crear entorno virtual e instalar dependencias
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt

# 3. Configurar variables de entorno
copy .env.example .env
# Editar .env y añadir tu DEEPSEEK_API_KEY

# 4. Sincronizar datos del wiki
python main.py sync

# 5. Construir el índice de embeddings
python build_index.py

# 6. Iniciar la app web
python web_app.py
```

Luego abre [http://localhost:8080](http://localhost:8080).

## Uso CLI

```bash
python main.py sync          # Sincronización completa del wiki
python main.py update        # Actualización incremental
python main.py ask "best bow T6"   # Pregunta directa
python main.py search "fire staff" # Buscar ítems
python main.py interactive   # Modo interactivo
```

## Variables de entorno

| Variable           | Descripción                        | Requerida |
|--------------------|------------------------------------|-----------|
| `DEEPSEEK_API_KEY` | API key de DeepSeek                | ✅ Sí     |
| `DEEPSEEK_BASE_URL`| URL base (default: api.deepseek.com)| ❌ No    |
| `DEEPSEEK_MODEL`   | Modelo a usar (default: deepseek-chat)| ❌ No  |

Obtén tu API key en [platform.deepseek.com](https://platform.deepseek.com/).

## Estructura del proyecto

```
pixel-quest-ai/
├── main.py              # Punto de entrada CLI
├── web_app.py           # Servidor FastAPI
├── build_index.py       # Script para construir índice de embeddings
├── pq_ai/
│   ├── config.py        # Configuración global
│   ├── database.py      # Carga y gestión de datos
│   ├── search.py        # Motor de búsqueda
│   ├── embeddings.py    # Embeddings semánticos
│   ├── deepseek_rag.py  # Integración con DeepSeek AI
│   ├── rag.py           # Motor RAG principal
│   ├── parser.py        # Parseo del wiki
│   ├── extractor.py     # Extracción de datos del wiki
│   ├── updater.py       # Sincronización incremental
│   └── cli.py           # Interfaz de línea de comandos
├── templates/
│   └── index.html       # Frontend de la app web
├── data/                # Datos sincronizados (generados, no en git)
├── .env.example         # Plantilla de variables de entorno
└── requirements.txt     # Dependencias Python
```

## Licencia

Proyecto personal / privado. El wiki de Pixel Quest es propiedad de sus respectivos autores.
