<div align="center">

# 🎮 Pixel Quest AI

*Un asistente inteligente potenciado por RAG (Retrieval-Augmented Generation) para el MMORPG **Pixel Quest**.*

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![DeepSeek](https://img.shields.io/badge/AI-DeepSeek-blue?style=for-the-badge)](https://deepseek.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

</div>

---

**Pixel Quest AI** es tu compañero ideal para explorar Roblox. Responde preguntas sobre builds, ítems, stats y estrategias utilizando datos 100% reales extraídos directamente del [wiki oficial](https://wiki.playpixelquest.com).

## ✨ Características Principales

*   🔍 **Búsqueda Dinámica**: El motor RAG utiliza *Function Calling* para explorar la base de datos de manera precisa, sin alucinaciones.
*   🤖 **Chat Multilingüe**: Gracias al potente motor de DeepSeek, comprende lenguaje natural en múltiples idiomas y traduce tu intención en filtros de búsqueda exactos (ej. *"arco inicial"* $\rightarrow$ *"Bow, Tier 1"*).
*   🌐 **Web App Moderna**: Interfaz frontend elegante, construida con **Next.js** y **React**, servida a través de un backend asíncrono con **FastAPI**.
*   🔄 **Sincronización Automática**: Scripts integrados para descargar y extraer automáticamente los datos más recientes del wiki del juego.

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Backend** | `FastAPI` + `Uvicorn` | API rápida y asíncrona para servir el contenido. |
| **IA / LLM** | `DeepSeek Chat (API)` | Motor de inteligencia artificial principal. |
| **Búsqueda** | `RAG` + `Function Calling` | Recuperación de información exacta. |
| **Frontend** | `Next.js`, `React`, `Tailwind` | Interfaz de usuario moderna y responsiva. |
| **Datos** | `JSON` | Sincronizados vía web scraping del wiki. |

---

## 🚀 Guía de Instalación

Sigue estos pasos para levantar el entorno de desarrollo localmente.

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/pixel-quest-ai.git
cd pixel-quest-ai
```

### 2. Configurar el Backend (Python)
Crea y activa un entorno virtual, luego instala las dependencias:
```bash
# Crear entorno virtual
python -m venv .venv

# Activar (Windows)
.venv\Scripts\activate
# Activar (macOS/Linux)
# source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar Variables de Entorno
Copia el archivo de ejemplo y configura tu clave de API:
```bash
cp .env.example .env
# En Windows (CMD) usa: copy .env.example .env
```

> [!IMPORTANT]
> Edita el archivo `.env` y añade tu `DEEPSEEK_API_KEY`. Puedes obtenerla en [platform.deepseek.com](https://platform.deepseek.com/).

### 4. Preparar el Frontend (Next.js)
El frontend debe ser compilado de forma estática para que FastAPI pueda servirlo:
```bash
cd frontend
npm install
npm run build
cd ..
```

### 5. Sincronizar Base de Datos
Descarga los datos más recientes de ítems, enemigos y localizaciones del wiki:
```bash
python main.py sync
```

### 6. ¡Iniciar la Aplicación!
Arranca el servidor web:
```bash
python web_app.py
```
> 🌟 **¡Listo!** Abre [http://localhost:8080](http://localhost:8080) en tu navegador para empezar a usar la aplicación.

---

## 💻 Uso desde la CLI

Si prefieres la velocidad de la terminal, **Pixel Quest AI** ofrece un conjunto completo de comandos:

```bash
# 🔄 Mantenimiento de datos
python main.py sync          # Sincronización completa del wiki
python main.py update        # Actualización incremental de cambios recientes

# 🔍 Consultas rápidas
python main.py search "fire staff" # Búsqueda de texto directo en la DB
python main.py ask "best bow T6"   # Pregunta directa procesada por la IA

# 💬 Modo interactivo
python main.py interactive   # Abre una sesión de chat continua en terminal
```

---

## ⚙️ Variables de Entorno

El sistema se configura a través del archivo `.env`:

| Variable | Descripción | Estado |
| :--- | :--- | :---: |
| `DEEPSEEK_API_KEY` | Tu clave secreta de API de DeepSeek. | **Requerida** |
| `DEEPSEEK_BASE_URL` | URL base. *Default: api.deepseek.com* | Opcional |
| `DEEPSEEK_MODEL` | Modelo a utilizar. *Default: deepseek-chat* | Opcional |

---

## 📁 Estructura del Proyecto

```text
pixel-quest-ai/
├── 📄 main.py              # Punto de entrada para la CLI
├── 📄 web_app.py           # Servidor FastAPI (monta API y frontend)
├── 📁 pq_ai/               # Core del Backend en Python
│   ├── config.py           # Gestión de configuración
│   ├── database.py         # Manejo de base de datos JSON
│   ├── search.py           # Motor de búsqueda
│   ├── deepseek_rag.py     # Integración de IA y Function Calling
│   ├── rag.py              # Orquestador del flujo
│   ├── extractor.py        # Scraping del wiki
│   ├── updater.py          # Lógica de sincronización
│   └── cli.py              # Comandos de terminal
├── 📁 frontend/            # Código fuente Next.js + React
├── 📁 data/                # Archivos JSON sincronizados
├── 📄 .env.example         # Plantilla de configuración
└── 📄 requirements.txt     # Dependencias del proyecto
```

---

## 📜 Licencia y Notas

*   **Legado**: Los archivos `.zip` (`legacy_html_templates.zip`, `legacy_semantic_search.zip`) en el proyecto contienen código de iteraciones anteriores. Se preservan como referencia y no afectan la aplicación actual.
*   **Derechos**: Este es un proyecto personal. El wiki de Pixel Quest y todos los datos/imágenes del juego son propiedad exclusiva de sus respectivos creadores.
