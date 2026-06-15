# Pixel Quest AI — Grimorio 3D + Backend de Streaming (Design)

**Fecha:** 2026-06-14
**Estado:** Diseño aprobado, listo para implementar.

> Este documento es autocontenido: una sesión nueva puede leerlo y ejecutar el
> plan asociado (`2026-06-14-grimoire-streaming-redesign-plan.md`) sin más contexto.

---

## 1. Contexto

Pixel Quest AI es un asistente RAG sobre el wiki de Pixel Quest (MMORPG
bullet-hell con permadeath). El backend (Python/FastAPI) extrae datos del wiki a
JSON, y un motor de Function Calling con **DeepSeek** (`deepseek-v4-flash`,
`reasoning_effort: high`) responde consultas usando búsquedas sobre esos datos.

El frontend anterior (Next.js) fue **eliminado** por baja calidad de diseño. El
objetivo es reconstruirlo como una experiencia 3D inmersiva ("grimorio en una
habitación con velas") nivel awwwards, pero **usable**.

### Estado del backend al momento de este diseño
Dos correcciones ya implementadas y commiteadas:

- `e638004` — **Bucle RAG robusto:** tope de rondas 8 → backstop de 25,
  detección de búsquedas repetidas, y garantía de que nunca se devuelve una
  respuesta en blanco (`_force_final_answer`).
- `90608b2` — **Taxonomía de datos:** `item_type`/`subtype` ahora se derivan de
  la taxonomía canónica del wiki (`pq_ai/taxonomy.py`). Corrigió ~21% de objetos
  mal clasificados (cascos/botas/sombreros eran "Armor"; banderas/tótems eran
  "Primary Weapon"). Cada objeto tiene ahora `subtype`.

Queda **una pieza de backend** (streaming + prompt nuevo) y luego **el frontend**.

---

## 2. Alcance y descomposición

El trabajo restante son dos sub-proyectos, en este orden (el frontend depende del
contrato de eventos del backend):

- **Sub-proyecto A — Backend de streaming + prompt nuevo** (Python).
- **Sub-proyecto B — Frontend del grimorio 3D** (Vite + React + R3F).

Decisiones de producto acordadas (aplican a B salvo indicación):

| Tema | Decisión |
|---|---|
| Rol del libro | Cinemático: cerrado/flotando → se abre → revela el chat |
| Estética | Grimorio realista y atmosférico (habitación de mago, velas, polvo). **Sin** pixel-art en la UI |
| Funciones | Solo dos: **chat** (grimorio) e **historial** (reloj de arena) |
| Historial | Conversaciones guardadas en **localStorage**, reabribles |
| Dispositivos | **Solo escritorio**, máxima calidad visual |
| "La IA piensa" | La habitación reacciona; respuesta "escrita con tinta" |
| Entrada/cámara | Intro cinemática (cámara vuela al libro, se abre). Saltable |
| Stack | **Vite + React + TypeScript + R3F + drei + postprocessing** |
| Ver razonar | **Streaming en vivo** (de ahí el sub-proyecto A) |
| Detalle de consulta | Razonamiento en vivo + señal ambiental discreta; **sin** mostrar queries técnicas |
| Voz de la IA | Experto preciso, **sin personaje**, **sin emojis** |

---

## 3. Sub-proyecto A — Backend de streaming + prompt

### 3.1 Endpoint

Nuevo: `POST /api/ask/stream` → `text/event-stream` (SSE).

- Request: igual que `/api/ask` (`{query, level, location, history}`).
- El `/api/ask` no-streaming **se mantiene** (lo usa la CLI). Se añade un
  generador `ask_rag_stream(...)` en `pq_ai/deepseek_rag.py` que reutiliza los
  guardas existentes (backstop 25, anti-repetición, anti-blanco).

### 3.2 Contrato de eventos (SSE)

Cada evento es una línea `event: <tipo>` + `data: <json>`.

| Evento | Datos | Significado |
|---|---|---|
| `reasoning` | `{ "delta": str }` | Fragmento de razonamiento (streaming token a token) |
| `status` | `{ "state": "thinking" \| "searching" }` | Señal de fase para la reacción ambiental. **No** incluye queries |
| `answer` | `{ "delta": str }` | Fragmento de la respuesta final (para animación de tinta) |
| `done` | `{}` | Fin del stream |
| `error` | `{ "message": str }` | Falla controlada; el frontend muestra un mensaje |

### 3.3 Lógica de `ask_rag_stream`

Reescribe el bucle de Function Calling con `stream=True` del SDK OpenAI-compat:

1. Construye `messages` (system + history + user) igual que `ask_rag`.
2. Emite `status: thinking`.
3. Por cada ronda (hasta el backstop de 25):
   - Llama con `stream=True`, `tools=TOOLS`, `extra_body=thinking_params`.
   - Acumula los deltas del chunk:
     - `reasoning_content` → emitir como evento `reasoning` (en vivo, en toda ronda).
     - `content` → **bufferizar** en la ronda (no emitir aún).
     - `tool_calls` → acumular (los deltas de tool calls llegan fragmentados).
   - Al cerrar la ronda:
     - Si hay tool calls → emitir `status: searching`, aplicar guarda
       anti-repetición, **ejecutar las búsquedas en el servidor (ocultas)**,
       añadir resultados a `messages`, emitir `status: thinking`, siguiente ronda.
       (El `content` bufferizado de una ronda intermedia se descarta: era ruido,
       no la respuesta final.)
     - Si **no** hay tool calls → el `content` bufferizado es la respuesta final:
       emitirlo como uno o más eventos `answer`. Si quedó vacío (todo fue
       razonamiento), aplicar el rescate `_force_final_answer` y emitir su texto
       como `answer`.
4. Si se alcanza el backstop → `_force_final_answer` → emitir como `answer`.
5. Emitir `done`. En excepción → emitir `error`.

> Nota: el `answer` final se bufferiza por ronda y se emite al cerrar la ronda
> final. El efecto "escribiéndose con tinta" lo produce el **frontend** animando
> ese texto; el razonamiento sí fluye en vivo durante toda la espera, que es lo
> que da la sensación de "página viva".

### 3.4 Prompt nuevo (sin personaje, sin emojis) + referencia dinámica

Reemplazar `SYSTEM_PROMPT` estático por uno construido en runtime. Texto base:

```
Eres un asistente experto en datos de Pixel Quest, un MMORPG bullet-hell con
permadeath. Das información precisa y útil sobre objetos, enemigos, ubicaciones,
builds y estrategias, basándote ÚNICAMENTE en los datos reales del wiki.

## Voz y estilo
- Directo, claro y preciso. NO interpretas un personaje: no eres un oráculo, mago
  ni narrador. Hablas como un experto que conoce el juego a fondo.
- No uses emojis.
- Responde en el idioma del jugador.
- Da datos concretos (stats, números, ubicaciones), no afirmaciones vagas.
- No narres tu proceso ni menciones herramientas o bases de datos: solo responde.

## Exactitud (lo más importante)
- NUNCA inventes objetos, enemigos, ubicaciones, stats ni efectos. Si no tienes el
  dato, búscalo. Si tras buscar no existe, dilo con claridad.
- NO asumas que un tier más alto es siempre mejor. El tier indica progresión y
  rareza, pero la mejor opción depende del nivel, la zona, la build y el estilo del
  jugador. Compara con stats y efectos reales, nunca con suposiciones.
- Al recomendar, explica POR QUÉ con datos: daño, alcance, cadencia, pasivas,
  efectos al equipar, y dónde se consigue.

## Búsqueda
- Si necesitas consultar varios temas, haz todas las búsquedas en un mismo turno;
  no repitas una búsqueda ya hecha.
- Investiga lo que necesites, pero SIEMPRE cierra con una respuesta clara y útil.

## Datos disponibles
- Objetos: tier, tipo, subtipo, stats (daño/alcance/cadencia), pasivas,
  efectos al equipar, y qué enemigo los dropea.
- Enemigos: HP, defensa, ubicación, tipo (jefe/regular/npc), inmunidades, drops.
- Ubicaciones: tipo, dificultad (1-10), permadeath, jugadores máx., enemigos,
  jefes y legendarios.
- Cruza estos datos cuando ayude (ej. "para conseguir X, derrota a Y en la zona Z").

## Hipervínculos
Al mencionar un objeto, enemigo o ubicación por nombre, enlázalo en markdown:
[Nombre](https://wiki.playpixelquest.com/wiki/Nombre). Usa guiones bajos en vez de
espacios y codifica caracteres especiales.

<<REFERENCIA_DINAMICA>>
```

`<<REFERENCIA_DINAMICA>>` se genera con un helper nuevo
`build_game_reference(search_engine)` a partir de los datos cargados:

- **Tiers** presentes, ordenados por `config.TIER_ORDER`.
- **Tipos de objeto** presentes y, por cada uno, sus **subtipos** presentes
  (orden de `pq_ai/taxonomy.py`).
- **Categorías de enemigo** y **tipos de ubicación** presentes, con rango de
  dificultad.

Así la referencia nunca queda desactualizada tras un `sync`. También quitar el
emoji `🧠` del wrapper de razonamiento heredado.

### 3.5 Manejo de errores
- Sin API key → evento `error` con mensaje claro.
- Excepción del SDK a mitad de stream → `error` + cerrar stream.
- Búsqueda sin resultados → el modelo lo maneja (ya soportado).

### 3.6 Pruebas
- Unit test de `build_game_reference` contra datos de muestra (tiers/tipos/subtipos
  esperados).
- Unit test del parser SSE / formato de eventos (función pura que serializa
  eventos).
- Test de `ask_rag_stream` con un cliente DeepSeek **mockeado** (simular chunks
  con `reasoning_content`, `tool_calls`, y `content`), verificando la secuencia de
  eventos emitidos (incluido el caso "respuesta final vacía → rescate").
- No se prueba contra la API real (coste); los guardas son defensivos.

---

## 4. Sub-proyecto B — Frontend del grimorio 3D

### 4.1 Stack y serving
- **Vite + React + TypeScript.**
- 3D: **React Three Fiber** + **@react-three/drei** + **@react-three/postprocessing**.
- Estilos de la capa 2D: CSS (o Tailwind, a elección del implementador).
- Markdown de respuestas: `react-markdown` + sanitización (la respuesta puede
  traer HTML del wrapper de razonamiento; sanitizar con DOMPurify/rehype-sanitize).
- Build estático → `frontend/dist`. **Ajuste en `web_app.py`:** cambiar
  `FRONTEND_DIR` de `frontend/out` a `frontend/dist`.

### 4.2 Máquina de estados de la escena
`intro` → `idle` → `thinking` → (`idle`). Transición `historyOpen` ortogonal.

- `intro`: cámara vuela hacia el libro cerrado en penumbra; el libro se abre;
  termina en `idle`. Saltable (click / tecla / botón).
- `idle`: libro abierto, chat listo; la habitación "respira".
- `thinking`: disparado al enviar consulta; velas titilan más fuerte, partículas
  se arremolinan hacia el libro; alimentado por eventos `status`/`reasoning`.

### 4.3 Arquitectura de componentes

**Capa 3D (`<Canvas>`):**
- `Room` — habitación (paredes, atril, props). Geometría propia o glTF.
- `Candles` — luces puntuales animadas + llamas + bloom.
- `DustParticles` — partículas flotantes.
- `Grimoire` — el libro; animación abrir/cerrar; páginas.
- `CameraRig` — vuelo de intro + deriva sutil en `idle`.
- Postprocesado: Bloom, Vignette, DepthOfField, grano de film.

**Capa 2D (HTML sobre el canvas, posicionada sobre el libro):**
- `ChatPanel` — lista de mensajes (usuario/asistente) estilo tinta sobre pergamino.
- `ReasoningStream` — muestra el razonamiento en vivo (eventos `reasoning`),
  colapsable una vez llega la respuesta.
- `InkInput` — input de texto estilo pluma.
- `HourglassButton` — abre el historial.
- `HistoryDrawer` — lista de conversaciones de localStorage; reabrir una la carga.

**Estado/lógica:**
- `ChatContext` — conversación actual, estado de envío, fase de escena.
- `streamClient.ts` — consume `POST /api/ask/stream` (SSE/fetch + ReadableStream),
  despacha `reasoning`/`status`/`answer`/`done`/`error`.
- `history.ts` — CRUD de conversaciones en localStorage.
- `sceneState.ts` — la máquina de estados.

### 4.4 Flujo de datos
1. Usuario escribe → `InkInput` → `ChatContext.send()`.
2. `streamClient` abre el stream; escena → `thinking`.
3. `reasoning` deltas → `ReasoningStream` (en vivo); `status` → reacción ambiental.
4. `answer` deltas → se acumulan y se animan "con tinta" en `ChatPanel`.
5. `done` → escena vuelve a `idle`; la conversación se guarda en localStorage.
6. `error` → mensaje temático breve, escena a `idle`.

### 4.5 Rendimiento (solo escritorio)
- Objetivo 60fps en GPU de escritorio decente.
- En móvil/GPU débil: pantalla mínima "mejor en escritorio" (sin paridad).
- Presupuesto: instancing para partículas, límites de luces, postprocesado
  ajustado.

### 4.6 Pruebas
- Unit: `history.ts` (guardar/cargar/reabrir), reductor de `sceneState`,
  parser del stream (mapear chunks SSE a acciones).
- E2E (Playwright) mínimo: cargar, saltar intro, enviar consulta con backend
  mockeado, ver razonamiento y respuesta, abrir historial y reabrir conversación.

---

## 5. Fuera de alcance (futuro)
- Toggle "debug" para ver queries/resultados exactos (opción C de consulta).
- Explotar campos ricos aún no usados: objetos (`requirements`, `forge_valor`,
  `valor_bonus`, `tradable`), enemigos (`abilities`, `damage`, `experience`),
  ubicaciones (`biome`, `recommended_level`, `teleportation`).
- Filtro por `subtype` en el esquema de las tools de búsqueda (hoy `subtype` ya
  es buscable por texto; exponerlo como filtro estructurado es una mejora).
- Persistencia de historial en backend (hoy: solo localStorage).

## 6. Preguntas abiertas
Ninguna bloqueante. Tailwind vs CSS plano queda a criterio del implementador.
