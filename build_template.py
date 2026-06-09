"""Build the full pixel-art HTML template in parts."""
OUT = r"C:\Users\dean\Documents\deep\pixel-quest-ai\templates\index.html"

# Write the complete HTML in one Python execution
html = r"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Pixel Quest AI</title>
<style>
@font-face{font-family:'PixelFont';src:local('Courier New'),local('Lucida Console'),local('Consolas')}
:root{--bg:#0a0a12;--bg2:#12121e;--surface:#1c1c30;--surface2:#282840;--border:#3a3a58;--text:#d0d0e0;--text-dim:#6a6a8a;--primary:#7c5cff;--primary-dim:#5a3ebb;--accent:#ff6b9d;--gold:#ffd700;--green:#44d9a0;--red:#ff4466;--blue:#4a9eff;--pixel:2px}
*{margin:0;padding:0;box-sizing:border-box;image-rendering:pixelated}
body{font-family:'PixelFont','Courier New',monospace;background:var(--bg);color:var(--text);min-height:100vh;font-size:13px;line-height:1.5}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--border)}
.pixel-btn{font-family:inherit;font-size:11px;padding:6px 14px;border:var(--pixel) solid var(--border);background:var(--surface2);color:var(--text);cursor:pointer;text-transform:uppercase;letter-spacing:1px;transition:all .1s}
.pixel-btn:hover{background:var(--primary);color:#fff;border-color:var(--primary-dim)}
.pixel-btn.primary{background:var(--primary);color:#fff;border-color:var(--primary-dim)}
.app{display:flex;flex-direction:column;height:100vh;max-width:1260px;margin:0 auto}
header{padding:10px 16px;background:var(--bg2);border-bottom:var(--pixel) solid var(--border);display:flex;align-items:center;gap:10px;flex-shrink:0}
.header-sword{width:28px;height:28px;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff}
header h1{font-size:14px;font-weight:400;letter-spacing:2px;text-transform:uppercase}
header h1 span{color:var(--gold)}
.stats-bar{display:flex;gap:10px;font-size:10px;color:var(--text-dim);margin-left:auto}
.stats-bar b{color:var(--text)}
.tabs{display:flex;background:var(--bg2);border-bottom:var(--pixel) solid var(--border);flex-shrink:0}
.tab{padding:7px 18px;font-size:10px;text-transform:uppercase;letter-spacing:2px;cursor:pointer;border:none;background:transparent;color:var(--text-dim);font-family:inherit;border-bottom:2px solid transparent;transition:all .15s}
.tab:hover{color:var(--text)}
.tab.active{color:var(--gold);border-bottom-color:var(--gold)}
.main{display:flex;flex:1;overflow:hidden}
.tab-content{display:none;flex:1;overflow:hidden}
.tab-content.active{display:flex}

/* CHAT TAB */
.chat-area{flex:1;display:flex;flex-direction:column}
.chat-messages{flex:1;overflow-y:auto;padding:16px}
.msg{margin-bottom:12px;max-width:85%;animation:fadeIn .2s}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.msg.user{margin-left:auto}
.msg .bubble{padding:10px 14px;border:var(--pixel) solid var(--border);line-height:1.5;font-size:12px}
.msg.user .bubble{background:var(--primary);color:#fff}
.msg.assistant .bubble{background:var(--surface)}
.msg .label{font-size:10px;color:var(--text-dim);margin-bottom:4px;letter-spacing:.5px}
.chat-input{padding:12px 16px;border-top:var(--pixel) solid var(--border);display:flex;gap:8px;flex-shrink:0;background:var(--bg2)}
.chat-input textarea{flex:1;padding:8px 12px;background:var(--surface);border:var(--pixel) solid var(--border);color:var(--text);font-size:12px;resize:none;min-height:36px;max-height:80px;font-family:inherit;outline:none}
.chat-input textarea:focus{border-color:var(--primary)}
.chat-input button{padding:8px 16px;font-family:inherit;font-size:11px;border:var(--pixel) solid var(--primary-dim);background:var(--primary);color:#fff;cursor:pointer;text-transform:uppercase;letter-spacing:1px}
.chat-input button:hover{background:var(--primary-dim)}
.chat-input button:disabled{opacity:.4;cursor:not-allowed}
.loading{display:flex;align-items:center;gap:8px;padding:10px 14px;color:var(--text-dim);font-size:11px}
.loading .spinner{width:12px;height:12px;border:2px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.examples{display:flex;gap:6px;padding:8px 16px;border-top:var(--pixel) solid var(--border);flex-wrap:wrap;background:var(--bg2)}
.examples .chip{padding:4px 10px;font-size:10px;border:var(--pixel) solid var(--border);background:var(--surface);cursor:pointer;transition:all .15s;letter-spacing:.3px}
.examples .chip:hover{border-color:var(--primary);color:var(--gold)}

/* BROWSER TAB */
.browser-sidebar{width:260px;flex-shrink:0;border-right:var(--pixel) solid var(--border);display:flex;flex-direction:column;background:var(--bg2)}
.browser-search{padding:8px;border-bottom:var(--pixel) solid var(--border)}
.browser-search input{width:100%;padding:6px 8px;background:var(--surface);border:var(--pixel) solid var(--border);color:var(--text);font-family:inherit;font-size:11px;outline:none}
.browser-search input:focus{border-color:var(--primary)}
.browser-filters{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:6px 8px;border-bottom:var(--pixel) solid var(--border)}
.browser-filters select{padding:3px 4px;background:var(--surface);border:var(--pixel) solid var(--border);color:var(--text);font-family:inherit;font-size:9px;text-transform:uppercase;outline:none}
.browser-count{padding:4px 8px;font-size:9px;color:var(--text-dim);border-bottom:var(--pixel) solid var(--border)}
.browser-list{flex:1;overflow-y:auto;padding:4px}
.item-row{padding:6px 8px;margin-bottom:3px;background:var(--surface);border:var(--pixel) solid var(--border);cursor:pointer;transition:all .1s;font-size:11px;display:flex;align-items:center;gap:8px}
.item-row:hover{border-color:var(--primary);background:var(--surface2)}
.item-row .item-icon{width:16px;height:16px;background:var(--bg2);flex-shrink:0;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:9px}
.item-row .item-name{flex:1;font-weight:600}
.item-row .item-meta{font-size:9px;color:var(--text-dim)}
.tier-badge{font-size:8px;padding:1px 5px;font-weight:700}
.tier-LG{background:linear-gradient(135deg,#fdcb6e,#e17055);color:#000}
.tier-CORRUPTED{background:linear-gradient(135deg,#7c5cff,#ff6b9d);color:#fff}
.tier-T0{background:#636e72;color:#fff}.tier-T1{background:#00b894;color:#fff}
.tier-T2{background:#00cec9;color:#fff}.tier-T3{background:#0984e3;color:#fff}
.tier-T4{background:#6c5ce7;color:#fff}.tier-T5{background:#e17055;color:#fff}
.tier-T6{background:#d63031;color:#fff}.tier-T7{background:#e84393;color:#fff}
.tier-T8{background:#b71540;color:#fff}

/* BROWSE GRID */
.browser-grid{flex:1;overflow-y:auto;padding:8px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;align-content:start}
.item-card{padding:10px;background:var(--surface);border:var(--pixel) solid var(--border);cursor:pointer;transition:all .1s}
.item-card:hover{border-color:var(--primary);background:var(--surface2)}
.item-card .card-icon{width:32px;height:32px;background:var(--bg2);border:var(--pixel) solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;margin-bottom:6px}
.item-card .card-name{font-size:11px;font-weight:600;margin-bottom:2px}
.item-card .card-meta{font-size:9px;color:var(--text-dim);display:flex;gap:6px;align-items:center}

/* CHANGES TAB */
.changes-list{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px}
.change-card{padding:10px 14px;background:var(--surface);border:var(--pixel) solid var(--border);font-size:11px}
.change-card .change-title{font-weight:600;color:var(--gold);margin-bottom:2px}
.change-card .change-meta{font-size:9px;color:var(--text-dim)}
.change-tag{display:inline-block;padding:1px 5px;font-size:8px;border:1px solid var(--border);margin-right:4px;text-transform:uppercase}

/* MODAL */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;align-items:center;justify-content:center}
.modal-overlay.active{display:flex}
.modal{background:var(--surface);border:var(--pixel) solid var(--border);max-width:520px;width:90%;max-height:80vh;overflow-y:auto;padding:20px}
.modal h2{font-size:14px;margin-bottom:8px;letter-spacing:1px}
.modal h2 span{color:var(--gold)}
.modal .close{float:right;cursor:pointer;font-size:16px;color:var(--text-dim);border:none;background:none;font-family:inherit}
.modal .close:hover{color:var(--red)}
.modal table{width:100%;font-size:11px;margin-top:8px}
.modal table td{padding:4px 6px;border-bottom:1px solid var(--border)}
.modal table td:first-child{color:var(--text-dim);width:100px}
.modal .drops{margin-top:8px;font-size:11px}
.modal .drops span{display:inline-block;padding:2px 6px;background:var(--surface2);border:var(--pixel) solid var(--border);margin:2px;font-size:9px}
.modal .passive{background:var(--bg2);border:var(--pixel) solid var(--border);padding:8px;margin-top:6px;font-size:10px;color:var(--gold)}
</style>
</head>
<body>
<div class="app">
<header>
<div class="header-sword">+</div>
<h1>Pixel <span>Quest</span> AI</h1>
<div class="stats-bar" id="stats-bar">
<span class="stat"><b id="stat-items">0</b> items</span>
<span class="stat"><b id="stat-types">0</b> tipos</span>
<span class="stat"><b id="stat-tiers">0</b> tiers</span>
</div>
</header>

<div class="tabs">
<button class="tab active" data-tab="chat">[ Chat ]</button>
<button class="tab" data-tab="browse">[ Items ]</button>
<button class="tab" data-tab="changes">[ Cambios ]</button>
</div>

<div class="main">
<!-- CHAT TAB -->
<div class="tab-content active" id="tab-chat">
<div class="chat-area">
<div class="chat-messages" id="messages">
<div class="msg assistant">
<div class="label">Pixel Quest AI</div>
<div class="bubble">
> Sistema listo. 401 items cargados.<br>
> Escribe tu consulta o prueba los ejemplos.
</div>
</div>
</div>
<div class="examples" id="examples">
<span class="chip" data-q="Que armas recomiendas para nivel 20?">nivel 20</span>
<span class="chip" data-q="Mejores dagas para principiantes">dagas</span>
<span class="chip" data-q="Objetos con Multi-Shot">multi-shot</span>
<span class="chip" data-q="Donde farmeo Armageddon?">armageddon</span>
<span class="chip" data-q="Build para Overworld">build overworld</span>
</div>
<div class="chat-input">
<textarea id="chat-input" placeholder="Escribe tu consulta..." rows="1"></textarea>
<button id="chat-send" class="pixel-btn primary">Enviar</button>
</div>
</div>
</div>

<!-- BROWSE TAB -->
<div class="tab-content" id="tab-browse">
<div class="browser-sidebar">
<div class="browser-search">
<input type="text" id="browse-search" placeholder="Buscar items..." autocomplete="off">
</div>
<div class="browser-filters">
<select id="filter-tier"><option value="">TODOS TIER</option></select>
<select id="filter-type"><option value="">TODOS TIPO</option></select>
</div>
<div class="browser-count" id="browse-count">0 items</div>
<div class="browser-list" id="browse-list"></div>
</div>
<div class="browser-grid" id="browse-grid"></div>
</div>

<!-- CHANGES TAB -->
<div class="tab-content" id="tab-changes">
<div class="changes-list" id="changes-list">
<div class="change-card">
<div class="change-title">Cargando cambios...</div>
</div>
</div>
</div>
</div>
</div>

<!-- MODAL -->
<div class="modal-overlay" id="modal">
<div class="modal">
<button class="close" onclick="closeModal()">X</button>
<div id="modal-content"></div>
</div>
</div>

<script>
const API_BASE = '';
let allItems = [];
let tierFilter = '';
let typeFilter = '';
let searchQuery = '';

async function api(path, data) {
  const r = await fetch(API_BASE + path, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
  return r.json();
}

async function loadStats() {
  try {
    const r = await fetch(API_BASE + '/api/stats');
    const s = await r.json();
    document.getElementById('stat-items').textContent = s.items || 0;
    document.getElementById('stat-types').textContent = s.item_types || 0;
    document.getElementById('stat-tiers').textContent = (s.tiers||[]).length;
  } catch(e) {}
}
loadStats();

async function loadFilters() {
  try {
    const [tiers, types] = await Promise.all([
      fetch(API_BASE + '/api/tiers').then(r=>r.json()),
      fetch(API_BASE + '/api/types').then(r=>r.json())
    ]);
    const tierSel = document.getElementById('filter-tier');
    const typeSel = document.getElementById('filter-type');
    tierSel.innerHTML = '<option value="">TODOS TIER</option>' + tiers.map(t=>'<option value="'+t+'">'+t+'</option>').join('');
    typeSel.innerHTML = '<option value="">TODOS TIPO</option>' + types.map(t=>'<option value="'+t+'">'+t+'</option>').join('');
  } catch(e) {}
}
loadFilters();

async function loadItems() {
  try {
    const r = await fetch(API_BASE + '/api/items?limit=200');
    const data = await r.json();
    allItems = data.items || [];
    renderItems();
  } catch(e) {}
}
loadItems();

function getItemIcon(item) {
  const type = (item.item_type || item.weapon_type || '').toLowerCase();
  if (type.includes('sword')) return 'T';
  if (type.includes('bow')) return ')';
  if (type.includes('staff')) return '+';
  if (type.includes('dagger')) return '/';
  if (type.includes('axe')) return 'L';
  if (type.includes('armor')) return '#';
  if (type.includes('ring') || type.includes('accessory')) return 'o';
  return '.';
}

function tierClass(tier) {
  const map = {LG:'tier-LG',CORRUPTED:'tier-CORRUPTED'};
  for (let i=0;i<=8;i++) map['T'+i]='tier-T'+i;
  return map[tier] || '';
}

function renderItems() {
  let items = allItems;
  if (tierFilter) items = items.filter(i=>i.tier===tierFilter);
  if (typeFilter) items = items.filter(i=>i.item_type===typeFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(i=>i.name.toLowerCase().includes(q) || (i.passives||[]).join(' ').toLowerCase().includes(q));
  }
  document.getElementById('browse-count').textContent = items.length + ' items';
  
  const list = document.getElementById('browse-list');
  const grid = document.getElementById('browse-grid');
  
  list.innerHTML = items.slice(0,100).map(item => {
    const t = tierClass(item.tier);
    return '<div class="item-row" onclick="openModal('+"'"+item.name.replace(/'/g,"\\'")+"'"+')">'
      + '<div class="item-icon">' + getItemIcon(item) + '</div>'
      + '<div class="item-name">' + item.name + '</div>'
      + (item.tier ? '<span class="tier-badge '+t+'">'+item.tier+'</span>' : '')
      + '<div class="item-meta">' + (item.item_type||'') + '</div>'
      + '</div>';
  }).join('');
  
  grid.innerHTML = items.slice(0,50).map(item => {
    const t = tierClass(item.tier);
    return '<div class="item-card" onclick="openModal('+"'"+item.name.replace(/'/g,"\\'")+"'"+')">'
      + '<div class="card-icon">' + getItemIcon(item) + '</div>'
      + '<div class="card-name">' + item.name + '</div>'
      + '<div class="card-meta">'
      + (item.tier ? '<span class="tier-badge '+t+'">'+item.tier+'</span>' : '')
      + '<span>'+(item.item_type||'')+'</span>'
      + '</div></div>';
  }).join('');
}

document.getElementById('filter-tier').onchange = function() { tierFilter = this.value; renderItems(); };
document.getElementById('filter-type').onchange = function() { typeFilter = this.value; renderItems(); };
document.getElementById('browse-search').oninput = function() { searchQuery = this.value; renderItems(); };

/* Tab switching */
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = function() {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('tab-'+this.dataset.tab).classList.add('active');
    if (this.dataset.tab === 'changes') loadChanges();
    if (this.dataset.tab === 'browse') { if (!allItems.length) loadItems(); }
  };
});

/* Chat */
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const messages = document.getElementById('messages');

chatSend.onclick = sendMessage;
chatInput.onkeydown = function(e) { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); sendMessage(); } };

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  addMessage(text, 'user');
  chatSend.disabled = true;
  chatSend.textContent = '...';
  
  // Parse level/location from message
  const levelMatch = text.match(/nivel\s*(\d+)/i);
  const locMatch = text.match(/en\s+(\w+)/);
  
  addMessage('...', 'assistant', true);
  
  try {
    const data = await api('/api/ask', {
      query: text,
      level: levelMatch ? parseInt(levelMatch[1]) : 0,
      location: locMatch ? locMatch[1] : ''
    });
    document.querySelector('.loading')?.remove();
    if (data.response) {
      addMessage(formatResponse(data.response), 'assistant');
    } else {
      addMessage('Error al obtener respuesta.', 'assistant');
    }
  } catch(e) {
    document.querySelector('.loading')?.remove();
    addMessage('Error de conexion: ' + e.message, 'assistant');
  }
  chatSend.disabled = false;
  chatSend.textContent = 'Enviar';
}

function addMessage(text, cls, isLoading) {
  const div = document.createElement('div');
  div.className = 'msg ' + cls;
  div.innerHTML = isLoading
    ? '<div class="loading"><div class="spinner"></div>Pensando...</div>'
    : '<div class="label">'+(cls==='user'?'Tu':'Pixel Quest AI')+'</div><div class="bubble">'+text+'</div>';
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function formatResponse(text) {
  return text.replace(/##/g,'<b>').replace(/###/g,'<b>')
    .replace(/\\n/g,'<br>')
    .replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')
    .replace(/```(\w*)\\n?([\\s\\S]*?)```/g,'<pre style="background:var(--bg2);padding:8px;font-size:10px;margin:6px 0;border:1px solid var(--border);overflow-x:auto">$2</pre>');
}

/* Examples */
document.querySelectorAll('.chip').forEach(chip => {
  chip.onclick = function() {
    chatInput.value = this.dataset.q;
    sendMessage();
  };
});

/* Modal */
async function openModal(name) {
  const item = allItems.find(i=>i.name===name);
  if (!item) return;
  const t = tierClass(item.tier);
  const ws = item.weapon_stats || {};
  const passives = item.passives || [];
  const drops = item.dropped_by || [];
  
  let html = '<h2>'+item.name+' <span class="tier-badge '+t+'">'+(item.tier||'')+'</span></h2>';
  html += '<p style="font-size:11px;color:var(--text-dim);margin-bottom:8px">'+(item.item_type||'')+(item.weapon_type?' / '+item.weapon_type:'')+'</p>';
  if (item.description) html += '<p style="font-size:11px;font-style:italic;margin-bottom:8px;color:var(--text-dim)">"'+item.description+'"</p>';
  
  html += '<table>';
  if (ws.damage) html += '<tr><td>DMG</td><td>'+ws.damage+'</td></tr>';
  if (ws.range) html += '<tr><td>Range</td><td>'+ws.range+' tiles</td></tr>';
  if (ws.speed) html += '<tr><td>Speed</td><td>'+ws.speed+'</td></tr>';
  if (ws.rate_of_fire) html += '<tr><td>RoF</td><td>'+ws.rate_of_fire+' shots/s</td></tr>';
  if (ws.pattern) html += '<tr><td>Pattern</td><td>'+ws.pattern+'</td></tr>';
  html += '<tr><td>Tradable</td><td>'+(item.tradable?'Si':'No')+'</td></tr>';
  if (item.valor_bonus) html += '<tr><td>Valor Bonus</td><td style="color:var(--green)">+'+item.valor_bonus+'%</td></tr>';
  if (item.forge_valor) html += '<tr><td>Forge</td><td>'+item.forge_valor+' valor</td></tr>';
  html += '</table>';
  
  if (passives.length) html += '<div class="passive">'+passives.map(p=>'<div>'+p+'</div>').join('')+'</div>';
  if (drops.length) html += '<div class="drops"><b style="font-size:10px">DROP DE:</b><br>'+drops.map(d=>'<span>'+d+'</span>').join('')+'</div>';
  
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal').classList.add('active');
}

function closeModal() { document.getElementById('modal').classList.remove('active'); }
document.getElementById('modal').onclick = function(e) { if (e.target===this) closeModal(); };
document.onkeydown = function(e) { if (e.key==='Escape') closeModal(); };

/* Recent Changes */
async function loadChanges() {
  const list = document.getElementById('changes-list');
  try {
    const r = await fetch(API_BASE + '/api/changes');
    const data = await r.json();
    const changes = data.changes || [];
    list.innerHTML = changes.map(c =>
      '<div class="change-card">'
      + '<div class="change-title">' + c.title + '</div>'
      + '<div class="change-meta">' + (c.timestamp||'') + ' | ' + (c.type||'') + '</div>'
      + '</div>'
    ).join('');
    if (!changes.length) list.innerHTML = '<div class="change-card">No hay cambios recientes.</div>';
  } catch(e) {
    list.innerHTML = '<div class="change-card">Usa el servidor para ver cambios recientes del wiki.</div>';
  }
}
</script>
</body>
</html>"""

with open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Template written: {len(html)} bytes")
