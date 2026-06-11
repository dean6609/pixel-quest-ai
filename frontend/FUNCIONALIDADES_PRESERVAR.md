# Pixel Quest AI - Análisis de Funcionalidades Preservar

## Componentes y Su Función

### 1. ChatContext (`context/ChatContext.tsx`)
- **Estado global del chat**: `chats`, `activeChatId`, `activeChat`
- **Persistencia**: LocalStorage (`pq_ai_chats`, `pq_ai_active_chat_id`)
- **Funciones**: `createNewChat`, `addMessage`, `deleteChat`, `clearAllChats`, `setActiveChatId`
- **Tipos**: `Message {role, content}`, `ChatSession {id, title, messages, createdAt, updatedAt}`

### 2. ClientLayout (`components/ClientLayout.tsx`)
- **Header fluid island**: Logo "AI Oracle" + Material Symbols icon + menú hamburguesa
- **Gestión de sidebar**: Toggle derecho con `rightSidebarOpen` state
- **Estructura**: Flex col h-screen con header absolute + main content

### 3. ChatArea (`components/ChatArea.tsx`)
- **Empty state**: Icono grande + título "Pixel Quest Oracle" + 4 sugerencias de preguntas
- **Mensajes usuario**: Right-aligned, bubble `doppelrand-bubble`, label "Adventurer"
- **Mensajes Oracle**: Left-aligned, avatar circular, markdown render, label "Oracle"
- **Loading state**: 3 dots bouncing + "Oracle is manifesting an answer..."
- **Input area**: Textarea auto-expand + botón "Cast" con icono send
- **API call**: POST `/api/ask` con `{query, history: messages.slice(-10)}`

### 4. RightSidebar (`components/RightSidebar.tsx`)
- **SearchTab**: Input búsqueda + filtro tier select + lista items (`/api/items`, `/api/tiers`)
- **ChangesTab**: Lista de cambios recientes del wiki (`/api/changes`)
- **HistoryTab**: Lista chats + crear nuevo + eliminar individual + purgar todos

## APIs del Backend
- `POST /api/ask` - Enviar pregunta al Oracle
- `GET /api/items?limit=100` - Buscar items del juego
- `GET /api/tiers` - Obtener tiers disponibles
- `GET /api/changes?limit=20` - Obtener cambios recientes del wiki

## Elementos de Diseño Actuales
- **Glass morphism**: `bg-white/[0.02] backdrop-blur-3xl border border-white/10`
- **Doppelrand system**: Shell (p-[6px] rounded-[2rem]) + Core (bg-[#0a0a0a])
- **Material Symbols**: `auto_awesome`, `menu`, `send`
- **Animaciones**: fade-in, zoom-in, slide-in, bounce, pulse
- **Colores**: Background #050505, superficies glass, white/10 borders

## Stack Tecnológico Actual
- Next.js 14.2.3 (App Router)
- React 18
- Tailwind CSS 3.4.1
- Framer Motion 11.2.10 (disponible pero poco usado)
- Lucide React (iconos)
- Marked 13.0.1 (markdown parsing)
- TypeScript 5

## Funcionalidades Clave a Preservar
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
