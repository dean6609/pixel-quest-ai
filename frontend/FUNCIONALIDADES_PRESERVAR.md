# Pixel Quest AI - Funcionalidades y Diseño Actual

## Componentes y Su Función

### 1. ChatContext (`context/ChatContext.tsx`)
- **Estado global del chat**: `chats`, `activeChatId`, `activeChat`
- **Persistencia**: LocalStorage (`pq_ai_chats`, `pq_ai_active_chat_id`)
- **Funciones**: `createNewChat`, `addMessage`, `deleteChat`, `clearAllChats`, `setActiveChatId`
- **Tipos**: `Message {role, content}`, `ChatSession {id, title, messages, createdAt, updatedAt}`
- **Validación**: validación de datos almacenados y fallback seguro para `crypto.randomUUID`

### 2. ClientLayout (`components/ClientLayout.tsx`)
- **Header Good Fella**: Marca "Pixel Quest AI" + indicador de estado "Oracle Online" + menú hamburguesa
- **Gestión de sidebar**: Toggle derecho con `rightSidebarOpen` state y transición `GridWipe`
- **Estructura**: Layout de altura completa con header fijo, chat principal y sidebar
- **Atajos**: `Ctrl/Cmd + G` para debug de grid, `C` para rotar color brand

### 3. ChatArea (`components/ChatArea.tsx`)
- **Empty state**: Título animado con `ScrambleText` "Ethereal Oracle" + 4 sugerencias de preguntas
- **Mensajes usuario**: Right-aligned, bubble `doppelrand-bubble`, label "Adventurer"
- **Mensajes Oracle**: Left-aligned, avatar circular con `Sparkles`, markdown render, label "Oracle"
- **Loading state**: 3 dots bouncing + "Oracle is manifesting an answer..." con `aria-live`
- **Input area**: Textarea auto-expand con `aria-label` + botón "Cast" con icono `Send`
- **API call**: POST `/api/ask` con `{query, history: messages.slice(-10)}`
- **Accesibilidad**: regiones `aria-live`, `aria-label`, alertas de error con `role="alert"`

### 4. RightSidebar (`components/RightSidebar.tsx`)
- **SearchTab**: Input búsqueda + filtro tier select + lista items (`/api/items?limit=100`, `/api/tiers`)
- **ChangesTab**: Lista de cambios recientes del wiki (`/api/changes?limit=20`)
- **HistoryTab**: Lista chats + crear nuevo + eliminar individual + purgar todos
- **Accesibilidad**: patrón de tabs ARIA (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`)

## APIs del Backend
- `POST /api/ask` - Enviar pregunta al Oracle
- `GET /api/items?limit=100` - Buscar items del juego
- `GET /api/tiers` - Obtener tiers disponibles
- `GET /api/changes?limit=20` - Obtener cambios recientes del wiki

## Elementos de Diseño Actuales (Good Fella Style)
- **Grid system**: 12 columnas con `grid-container` / `grid-layout`, responsive breakpoint 1024px
- **Tipografía**: Inter (sans), DM Mono + Geist Mono (monospace)
- **Glass morphism**: `glass-panel` con `bg-white/[0.02] backdrop-blur-2xl border-white/10`
- **Doppelrand system**: `doppelrand-shell` (p-[6px] rounded-[2rem]) + `doppelrand-core`
- **Colores**: Background #141314, foreground #eee, brand #fd551d
- **Easing curves**: 14+ curvas personalizadas con aliases power2/power3/power4

## Stack Tecnológico Actual
- Next.js 15.1.0 (App Router + Turbopack)
- React 19
- Tailwind CSS 4.0
- Framer Motion 11.15+
- GSAP + ScrollTrigger
- Lenis (smooth scroll)
- Three.js (partículas 3D)
- Lucide React (iconos)
- Marked 13.0.1 (markdown parsing)
- Zod, clsx, tailwind-merge
- TypeScript 5

## Sistema de Animaciones

### GSAP + ScrollTrigger
- ScrollTrigger one-shot animations via `useScrollAnimation` hook
- Staggered child animations via `useStaggerScrollAnimation` hook
- ScrambleGroup context for coordinated text scramble

### Text Scramble Dual-Layer
- Two-phase scramble: brand color → foreground resolve
- `useDualLayerScramble` hook con respeto a `prefers-reduced-motion`
- `ScrambleText` componente reutilizable

### Framer Motion
- `AnimatePresence` para sidebar open/close
- `GridWipe`: 12-column page transition overlay
- Staggered list animations en sidebar tabs
- `useReducedMotion` en todas las animaciones

### Particles (Three.js)
- 3000 primary + 500 secondary particles por canvas (2 canvas)
- Distribución cilíndrica con mouse parallax
- Respeto a `prefers-reduced-motion` (no inicializa WebGL)
- Detección de dispositivos low-end (reduce count para <4 cores)

### Easing Curves
- 14+ custom cubic-bezier curves
- Named aliases: power2-out, power3-out, power3-in-out, power4-in-out

## Funcionalidades Clave Preservadas
1. ✅ Chat con persistencia LocalStorage
2. ✅ Múltiples sesiones de chat
3. ✅ Renderizado markdown de respuestas
4. ✅ Búsqueda de items con filtros
5. ✅ Historial de cambios del wiki
6. ✅ Sidebar derecha con tabs
7. ✅ Sugerencias de preguntas iniciales
8. ✅ Auto-scroll al último mensaje
9. ✅ Textarea auto-expandible
10. ✅ Estados de loading
11. ✅ Atajos de teclado (grid debug, cambio de color brand)
12. ✅ Partículas de fondo con Three.js
13. ✅ Transición GridWipe al abrir sidebar
14. ✅ Accesibilidad: `prefers-reduced-motion`, ARIA labels, roles
