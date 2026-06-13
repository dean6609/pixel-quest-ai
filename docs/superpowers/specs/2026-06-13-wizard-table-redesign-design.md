# Diseño: La Mesa del Oráculo

## Resumen

Rediseño completo del frontend de Pixel Quest AI. Se abandona la estética anterior de UI moderna oscura para adoptar una **mesa de hechicero vista desde arriba**: madera oscura, pergamino central, tintero con pluma, reloj de arena para el historial y sello de cera para el estado.

## Objetivo

Crear una experiencia visual claramente distinta a la versión anterior, manteniendo únicamente las funciones esenciales que el usuario definió:

- Chat con el Oráculo (`/api/ask`).
- Historial de sesiones con `localStorage` (nueva sesión, purgar memorias).

Se eliminan de la UI:

- Búsqueda de items.
- Panel de cambios de la wiki.

Los endpoints del backend (`/api/items`, `/api/tiers`, `/api/changes`) no se modifican; simplemente dejan de ser consumidos por el frontend.

## Concepto visual

### Escenario

Fondo de madera oscura con vetas y sombras suaves. En el centro, un pergamino desplegado. El usuario escribe en la parte inferior con una pluma y un tintero. El Oráculo responde con tinta que aparece animada sobre el pergamino.

### Elementos principales

| Elemento | Descripción |
|----------|-------------|
| **Pergamino central** | Ocupará ~70 % del ancho en escritorio (máx. ~900 px). Bordes irregulares y textura de papel envejecido. Mensajes del usuario a la izquierda, respuestas del Oráculo a la derecha. |
| **Entrada** | Barra inferior con tintero y pluma. El campo de texto simula un espacio en blanco del pergamino. Botón de envío como sello de lacre o gota de cera. |
| **Sello de cera** | Esquina superior/derecha. Indica “Oracle Online” con un color rojo intenso y ligero brillo. |
| **Reloj de arena** | Flota cerca del pergamino. Al hacer clic gira y abre un popup de pergamino con el historial de sesiones. |
| **Popup de historial** | Pergamino flotante que se despliega desde el reloj de arena. Lista sesiones con fecha/hora y permite crear nueva sesión o purgar memorias. |

## Paleta de colores

```
--color-wood:        #1f140d  // fondo de mesa
--color-wood-light:  #2e2016  // vetas/sombreado
--color-parchment:   #e8dcc4  // pergamino
--color-parchment-dark: #d4c5a9 // sombras del pergamino
--color-ink:         #2a1d12  // texto principal
--color-ink-muted:   #5c4a3a  // texto secundario
--color-gold:        #bfa046  // acentos dorados
--color-wax:         #8b2222  // sello de cera
--color-wax-light:   #a82e2e  // brillo del sello
```

## Tipografía

- **Títulos / etiquetas:** `Cinzel` (Google Fonts), serif clásica, mayúsculas con espaciado.
- **Cuerpo / chat:** `EB Garamond` (Google Fonts), legible, estilo manuscrito antiguo.
- **Stats o datos técnicos:** mismo `EB Garamond`, posiblemente en small-caps para números.

## Animaciones

| Animación | Detalle |
|-----------|---------|
| **Despliegue del pergamino** | Al cargar, el pergamino se desenrolla verticalmente con un ligero rebote. |
| **Revelado de tinta** | Cada respuesta del Oráculo aparece como si la tinta se extendiera letra por letra o párrafo a párrafo. |
| **Reloj de arena** | Rotación suave al hacer hover; giro más pronunciado al abrir el historial. |
| **Popup de historial** | El pergamino se despliega con una curva de ease-out, como si lo abrieran. |
| **Sello de cera** | Brillo pulsante sutil para indicar que el Oráculo está online. |
| **Vela/candil** | Parpadeo muy ligero en las sombras del fondo para dar vida a la escena. |

## Layout responsive

### Escritorio (≥1024 px)

- Pergamino centrado, ~70 % de ancho, máx. 900 px.
- Reloj de arena a la derecha del pergamino.
- Sello de cera en esquina superior derecha.
- Entrada fija en la parte inferior, dentro de un soporte de madera.

### Tablet (768–1023 px)

- Pergamino ~85 % de ancho.
- Reloj de arena más pequeño, arriba a la derecha.
- Entrada fija abajo.

### Móvil (<768 px)

- Pergamino casi a todo ancho con márgenes pequeños.
- Reloj de arena compacto en esquina superior derecha.
- Entrada fija abajo, sin decoración excesiva.

## Componentes principales

1. **`WizardTableBackground`** — capa de fondo con textura de madera y sombras.
2. **`ScrollContainer`** — el pergamino central con bordes decorativos y sombra.
3. **`MessageInk`** — burbuja de mensaje con efecto de tinta/revelado.
4. **`QuillInput`** — barra de entrada con tintero, pluma y campo de texto.
5. **`WaxSeal`** — indicador de estado del Oráculo.
6. **`HourglassHistory`** — reloj de arena que abre el popup de historial.
7. **`HistoryPopup`** — popup de pergamino con lista de sesiones y acciones.
8. **`ChatContext`** — se reutiliza el existente (localStorage, sesiones, mensajes).

## Data flow

- El chat sigue usando `ChatContext` actual.
- Las llamadas al backend siguen siendo `POST /api/ask`.
- El historial se almacena en `localStorage` como hasta ahora.
- No se consumen `/api/items`, `/api/tiers` ni `/api/changes`.

## Accesibilidad

- `prefers-reduced-motion`: desactivar revelado de tinta y parpadeos; mostrar contenido directamente.
- Botones con `aria-label` (reloj de arena, enviar, sello de estado).
- Contraste suficiente entre tinta (`#2a1d12`) y pergamino (`#e8dcc4`).

## Notas de implementación

- Se usará Tailwind CSS v4 con clases utilitarias y componentes custom en `@layer components`.
- Las texturas se implementarán preferentemente con SVG/CSS (wood grain, parchment edges) para evitar assets pesados.
- Las animaciones usarán Framer Motion o GSAP según convenga para secuencias complejas.
- No se modifica el backend (`web_app.py`, `pq_ai/`).
