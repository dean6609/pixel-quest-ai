# Pixel Quest AI 🎮

Un asistente de IA con RAG (Retrieval-Augmented Generation) para el MMORPG **Pixel Quest** en Roblox.  
Responde preguntas sobre builds, ítems, stats y estrategias basándose en datos reales del [wiki oficial](https://wiki.playpixelquest.com).

## Características

- 🔍 **Búsqueda Dinámica**: El motor RAG utiliza la capacidad de *Function Calling* (uso de herramientas) de la IA para explorar la base de datos de manera precisa.
- 🤖 **Chat Multilingüe**: Gracias al motor de DeepSeek, el asistente comprende lenguaje natural en múltiples idiomas y traduce tu intención en filtros de búsqueda exactos (ej. "arco inicial" -> "Bow, Tier 1").
- 🌐 **Web App Moderna**: Interfaz frontend construida con **Next.js** y **React**, servida a través de un backend **FastAPI**.
- 🔄 **Sincronización Automática**: El backend cuenta con scripts para descargar y extraer automáticamente los datos más recientes del wiki del juego.

## Stack Tecnológico

| Capa        | Tecnología                  |
|-------------|-----------------------------|
| Backend     | FastAPI + Uvicorn            |
| IA / LLM    | DeepSeek Chat (API)          |
| Búsqueda    | RAG vía LLM Function Calling |
| Frontend    | Next.js, React, Tailwind CSS |
| Datos       | JSON (Sincronizado vía web scraping) |

## Instalación rápida

### 1. Clonar y preparar entorno
```bash
git clone https://github.com/TU_USUARIO/pixel-quest-ai.git
cd pixel-quest-ai

# Crear entorno virtual e instalar dependencias del backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
```

### 2. Configurar variables de entorno
```bash
copy .env.example .env
# Edita el archivo .env y añade tu DEEPSEEK_API_KEY
```

### 3. Preparar el Frontend (Next.js)
El frontend debe ser compilado estáticamente para que el backend de Python pueda servirlo.
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Sincronizar datos del wiki
```bash
# Descarga los datos más recientes de ítems, enemigos y localizaciones
python main.py sync
```

### 5. Iniciar la app web
```bash
python web_app.py
```
Luego abre [http://localhost:8080](http://localhost:8080) en tu navegador.

## Uso CLI (Línea de Comandos)

Si no deseas utilizar la web, puedes usar la herramienta directamente desde la terminal:

```bash
python main.py sync          # Sincronización completa del wiki
python main.py update        # Actualización incremental (cambios recientes)
python main.py ask "best bow T6"   # Pregunta directa a la IA
python main.py search "fire staff" # Búsqueda de texto en ítems
python main.py interactive   # Modo chat en terminal
```

## Variables de entorno (.env)

| Variable           | Descripción                        | Requerida |
|--------------------|------------------------------------|-----------|
| `DEEPSEEK_API_KEY` | API key de DeepSeek                | ✅ Sí     |
| `DEEPSEEK_BASE_URL`| URL base (default: api.deepseek.com)| ❌ No    |
| `DEEPSEEK_MODEL`   | Modelo a usar (default: deepseek-chat)| ❌ No  |

Puedes obtener tu API key en [platform.deepseek.com](https://platform.deepseek.com/).

## Estructura del proyecto

```
pixel-quest-ai/
├── main.py              # Punto de entrada CLI
├── web_app.py           # Servidor FastAPI que monta el frontend y sirve la API
├── pq_ai/               # Backend en Python
│   ├── config.py        # Configuración global
│   ├── database.py      # Carga y gestión de datos JSON
│   ├── search.py        # Motor de búsqueda nativo
│   ├── deepseek_rag.py  # Integración con DeepSeek (Function Calling)
│   ├── rag.py           # Orquestador del flujo
│   ├── extractor.py     # Extracción de datos del wiki
│   ├── updater.py       # Sincronización incremental
│   └── cli.py           # Interfaz de línea de comandos
├── frontend/            # Código fuente de Next.js
│   ├── src/             # Componentes de React
│   └── out/             # Build estático (generado tras 'npm run build')
├── data/                # Datos sincronizados (archivos generados)
├── .env.example         # Plantilla de variables de entorno
└── requirements.txt     # Dependencias del backend
```

## Legado / Backups
En el directorio raíz existen archivos `.zip` (`legacy_html_templates.zip` y `legacy_semantic_search.zip`) que contienen código antiguo del proyecto original (scripts de plantillas hechas a mano y búsqueda semántica con `sentence-transformers`). Estos se preservan únicamente como referencia y no interfieren con la app moderna.

## Licencia

Proyecto personal. El wiki de Pixel Quest y todos los datos del juego son propiedad de sus respectivos creadores/autores.
