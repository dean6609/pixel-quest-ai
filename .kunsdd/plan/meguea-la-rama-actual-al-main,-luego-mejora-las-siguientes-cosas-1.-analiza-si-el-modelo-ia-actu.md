# Plan: Merge branch + RAG audit + Hyperlinks

## Resumen

Se mergeará la rama actual (`feature/good-fella-footer-design`) a `master`, se auditará el sistema RAG completo, se identificarán y corregirán bugs, y se implementará la funcionalidad de hipervínculos a la wiki en las respuestas del chat.

---

## Paso 1: Merge de rama actual a master

**Estado actual:**
- Rama: `feature/good-fella-footer-design`
- Mismo commit base que `master` (no hay divergencia)
- 11 archivos modificados sin commit (unstaged changes)

**Acciones:**
1. Hacer commit de los cambios actuales en la rama feature
2. Hacer checkout a master
3. Hacer merge fast-forward (están en el mismo commit base)
4. Pushear a remoto (si existe)

---

## Paso 2: Auditoría del modelo IA consultando al RAG

### Archivo analizado: `pq_ai/deepseek_rag.py` (usado por web_app.py)

**✅ Lo que funciona correctamente:**
- Usa Function Calling de DeepSeek con el tool `search_database`
- Multi-round tool loop con hasta 4 rondas (mejora respecto al single-round original)
- Parseo de tool calls en formato texto (fallback para modelos que no soporten tool_calls nativos)
- Temperatura baja (0.3) para respuestas más precisas

**❌ Problemas encontrados:**

1. **`search` en web_app.py usa `ask_rag` correctamente pero no usa `RAGEngine`** — hay dos implementaciones RAG paralelas que pueden causar confusión.

2. **El tool `search_database` no devuelve URLs de wiki** — solo devuelve nombre, tier, stats, pasivas y drops. El modelo no puede generar hipervínculos.

3. **La búsqueda no es semántica** — `SearchEngine.search()` usa matching de texto plano (keyword matching), no embeddings. Esto es intencional (evita dependencias pesadas) pero limita la calidad de resultados para consultas complejas.

4. **El SYSTEM_PROMPT no instruye al modelo a enlazar a la wiki** — no se le dice que use formato `[Item](url)`.

5. **La función `ask_rag` tiene `temperature=0.3` y `max_tokens=1500`** — puede quedarse corto para respuestas largas con múltiples items. Considerar `max_tokens=2000`.

### Archivo analizado: `pq_ai/cli.py` (usado por línea de comandos)

**❌ Problemas graves:**

1. **`RAGEngine.answer()` no existe** — el CLI llama `rag.answer(query)` pero la clase `RAGEngine` en `rag.py` no tiene ese método. El CLI está roto.

2. **`RAGEngine.retrieve_context()` llama `self.search.search()` con parámetro `filters`** — pero `SearchEngine.search()` no acepta `filters` como keyword argument (espera `tier_filter`, `type_filter`, etc.). Esto causaría TypeError en runtime.

### Recomendaciones:
- Arreglar `RAGEngine` o eliminar el código muerto del CLI que no se usa
- O migrar el CLI a usar `ask_rag` de `deepseek_rag.py`

---

## Paso 3: Auditoría de la creación y eficiencia del RAG

### Arquitectura actual:
```
web_app.py → ask_rag() → DeepSeek API (función search_database)
                         → SearchEngine.search() → items.json (local)
```

**✅ Eficiencias:**
- Sin dependencias de embeddings/vectores (más ligero, menos costoso)
- Búsqueda local en JSON sin necesidad de servidor vectorial
- Cache local de datos (items.json, enemies.json, locations.json)

**❌ Ineficiencias:**

1. **`SearchEngine.search()` hace escaneo O(n) completo** — carga todos los items en memoria y los filtra uno por uno. Para 401 items es aceptable, pero no escala.

2. **Sin índices invertidos** — la búsqueda textual usa `in` check (substring) en lugar de tokenización + índices.

3. **Sin scoring semántico** — el "score" es básico: +10 por match exacto en nombre, +5 por match en texto completo. No hay TF-IDF ni embeddings.

4. **Dos RAG engines que hacen lo mismo** — `RAGEngine` (rag.py, usado por CLI) y `ask_rag` (deepseek_rag.py, usado por web) se solapan. El `RAGEngine` además construye el prompt localmente sin usar la API de DeepSeek.

5. **La data se sincroniza desde la wiki pero no hay actualización automática** — solo hay sync manual o incremental vía CLI (`python main.py sync`).

### Recomendaciones:
- Unificar a un solo RAG engine (el `ask_rag` de deepseek_rag.py es el mejor)
- Implementar índices básicos (por tipo, tier) para filtrar antes de escanear
- Agregar un endpoint `/api/sync` en web_app.py para trigger de sincronización
- Para mejorar escalabilidad a futuro: considerar embeddings ligeros

---

## Paso 4: Auditoría de la calidad de datos desde la wiki

### Fuente: `https://wiki.playpixelquest.com/`

**✅ Datos correctos:**
- 401 items con nombres, tiers, tipos y stats (mayoría completos)
- 197 armas con weapon_stats (solo 2 sin stats)
- 475 enemigos registrados
- URLs de wiki verificadas: `https://wiki.playpixelquest.com/wiki/Item_Name` funcionan correctamente

**❌ Problemas de calidad:**

1. **22 items sin tier** — la mayoría son variantes "OF DOOM" y objetos especiales (Fishing Rod, Metal Detector, Necklace of Protection). No se extrajo el tier de la wiki.

2. **70 items sin `dropped_by`** — no se pudo extraer información de drop de la wiki para estos items.

3. **CRÍTICO: 475 enemigos sin datos de ubicación (`location` vacío)** — el extractor no está parseando correctamente la información de locación de los enemigos. Esto afecta la capacidad de responder "¿dónde farmear X?".

4. **55 items con apóstrofes en el nombre** — `Adventurer's Dirk`, `Ahi's Amulet`, etc. La URL `https://wiki.playpixelquest.com/wiki/Adventurer%27s_Dirk` funciona con encoding correcto, pero el código actual usa `.replace(' ', '_')` que no maneja estos casos.

5. **Solo un item_type por item** — algunos items multicategoría (e.g., "Helmet" y "Accessory") solo se clasifican con un tipo.

### Recomendaciones:
- Mejorar el parser de wikitext para extraer tiers de items "OF DOOM"
- Arreglar la extracción de `dropped_by` en el parser
- **Prioridad alta**: Arreglar el extractor de enemigos para poblar el campo `location`
- Normalizar nombres de items con URL encoding al generar links

---

## Paso 5: Implementación de hipervínculos en respuestas del chat

### Estado actual:
- Frontend usa `marked` para renderizar markdown (`dangerouslySetInnerHTML`)
- El sanitizador `sanitizeContent()` elimina tags XML pero permite HTML de markdown
- `format_response()` en `rag.py` ya genera links básicos pero solo en el footer

### Implementación propuesta:

**A. Backend (`pq_ai/deepseek_rag.py`):**

1. **Agregar campo `wiki_url` al resultado de `search_database`:**
   - En `format_search_results()`, incluir la URL de wiki para cada item
   - Usar `urllib.parse.quote()` para encoding correcto

2. **Actualizar SYSTEM_PROMPT para instruir el uso de hipervínculos:**
   - Agregar regla: "Cuando menciones un objeto, usa formato markdown: `[Nombre del Objeto](url_del_wiki)`"
   - Incluir ejemplo de cómo formatear

3. **Agregar URLs en los datos de tool response:**
   - Incluir `wiki_url` como metadata adicional en los resultados de búsqueda
   - El modelo podrá usarlos para crear enlaces

**B. Frontend (`frontend/src/components/ChatArea.tsx`):**

4. **Verificar que `marked` renderiza links correctamente**
   - Ya usa `marked.parse()` → markdown `[texto](url)` se convierte en `<a href="url">texto</a>`

5. **Mejorar sanitizador** para no bloquear tags `<a>` (ya los permite porque el markdown se procesa antes)

**C. Consideraciones técnicas:**
- URL encoding: `urllib.parse.quote(nombre.replace(' ', '_'), safe='')`
- Para apóstrofes: `Ahi's Amulet` → `Ahi%27s_Amulet`
- El frontend ya tiene estilos para `<a>` (prose prose-invert)
- No necesita cambios en el CSS para soportar links

---

## Resumen de cambios necesarios

| Archivo | Cambio |
|---------|--------|
| `pq_ai/deepseek_rag.py` | Agregar `wiki_url` a resultados de search, actualizar SYSTEM_PROMPT con instrucciones de hipervínculos |
| `pq_ai/search.py` | Agregar método `get_wiki_url()` para generar URLs correctas |
| `pq_ai/rag.py` | Arreglar `retrieve_context()` (filters bug), agregar `answer()` o sync con deepseek_rag.py |
| `pq_ai/cli.py` | Arreglar llamadas rotas a RAGEngine, o migrar a usar `ask_rag` |
| `pq_ai/parser.py` | Mejorar extracción de tier para items OF DOOM y `dropped_by` |
| `pq_ai/extractor.py` | Arreglar extracción de ubicación de enemigos |
| `data/enemies.json` | (Se regenerará al ejecutar sync tras arreglar el extractor) |

## Riesgos

- Los cambios en `deepseek_rag.py` (SYSTEM_PROMPT) podrían afectar el comportamiento del modelo si no se instruye correctamente
- La URL encoding especial (apóstrofes) debe probarse con items problemáticos
- Los arreglos al extractor requieren re-sincronizar datos de la wiki
- Merge a master debe verificar que los tests y build de frontend sigan funcionando
