"""Build complete Pixel Quest AI template - one shot."""
import os

OUT = r"C:\Users\dean\Documents\deep\pixel-quest-ai\templates\index.html"

html = r'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Pixel Quest AI</title>
<style>
@font-face{font-family:'PixelFont';src:local('Courier New'),local('Lucida Console'),local('Consolas')}
:root{
--bg:#1a1410;--bg2:#231c16;--surface:#2d241d;--surface2:#3d3228;--border:#4a3d31;
--text:#d4c5a9;--text-dim:#8a7a6a;--primary:#6b8f5e;--primary-dim:#4d6b42;
--accent:#c49a5c;--gold:#e8c87a;--green:#7bab6a;--red:#c4554a;--blue:#6a8fb5;
--pixel:3px;--shadow:#0d0a08;
}
*{margin:0;padding:0;box-sizing:border-box;image-rendering:pixelated}
body{font-family:'PixelFont','Courier New',monospace;background:var(--bg);color:var(--text);min-height:100vh;font-size:13px}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:var(--shadow)}
::-webkit-scrollbar-thumb{background:var(--border)}
.pixel-btn{font-family:inherit;font-size:11px;padding:6px 14px;border:var(--pixel) solid var(--shadow);background:var(--surface2);color:var(--text);cursor:pointer;text-transform:uppercase;letter-spacing:1px;box-shadow:3px 3px 0 0 var(--shadow)}
.pixel-btn:hover{background:var(--primary);color:#fff;transform:translate(1px,1px);box-shadow:2px 2px 0 0 var(--shadow)}
.pixel-btn.primary{background:var(--primary);color:#fff;border-color:var(--shadow)}
.pixel-btn.primary:hover{background:var(--primary-dim)}
.pixel-btn:active{transform:translate(3px,3px);box-shadow:none}
.app{display:flex;flex-direction:column;height:100vh;max-width:1260px;margin:0 auto}
header{padding:10px 16px;background:var(--bg2);border-bottom:var(--pixel) solid var(--border);display:flex;align-items:center;gap:10px;flex-shrink:0;box-shadow:0 3px 0 0 var(--shadow)}
.header-icon{width:28px;height:28px;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;border:var(--pixel) solid var(--shadow)}
header h1{font-size:14px;font-weight:400;letter-spacing:2px;text-transform:uppercase}
header h1 span{color:var(--gold)}
.stats-bar{display:flex;gap:10px;font-size:10px;color:var(--text-dim);margin-left:auto}
.stats-bar b{color:var(--text)}
.tabs{display:flex;background:var(--bg2);border-bottom:var(--pixel) solid var(--border);flex-shrink:0}
.tab{padding:7px 18px;font-size:10px;text-transform:uppercase;letter-spacing:2px;cursor:pointer;border:none;background:transparent;color:var(--text-dim);font-family:inherit;border-bottom:3px solid transparent;transition:all .1s;box-shadow:none}
.tab:hover{color:var(--gold);background:var(--surface)}
.tab.active{color:var(--gold);border-bottom-color:var(--gold);background:var(--surface)}
.main{display:flex;flex:1;overflow:hidden}
.tab-content{display:none;flex:1;overflow:hidden}
.tab-content.active{display:flex}
.tab-content#tab-browse.active,.tab-content#tab-changes.active{display:flex}

/* CHAT */
.chat-wrap{display:flex;flex:1;overflow:hidden}
.chat-history{width:180px;flex-shrink:0;border-right:var(--pixel) solid var(--border);display:flex;flex-direction:column;background:var(--bg2)}
.chat-history-header{padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);border-bottom:var(--pixel) solid var(--border);display:flex;justify-content:space-between;align-items:center}
.chat-history-header .hist-btn{background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:10px;font-family:inherit;padding:2px 6px}
.chat-history-header .hist-btn:hover{color:var(--red)}
.chat-history-list{flex:1;overflow-y:auto;padding:4px}
.history-item{padding:6px 8px;font-size:10px;cursor:pointer;border-bottom:1px solid var(--surface2);border-left:3px solid transparent}
.history-item:hover{background:var(--surface)}
.history-item.active{border-left-color:var(--gold);background:var(--surface2)}
.history-item .h-title{color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.history-item .h-meta{font-size:9px;color:var(--text-dim);margin-top:2px}
.chat-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.msg{max-width:88%;animation:fadeIn .2s}
.msg.user{margin-left:auto}
.msg .label{font-size:9px;color:var(--text-dim);margin-bottom:3px;padding-left:4px;text-transform:uppercase;letter-spacing:1px}
.msg .bubble{padding:10px 14px;border:var(--pixel) solid var(--border);line-height:1.6;font-size:12px;background:var(--surface);box-shadow:3px 3px 0 0 var(--shadow)}
.msg.user .bubble{background:var(--primary-dim);color:#f0e8d0;border-color:var(--shadow)}
.msg.assistant .bubble code{background:var(--bg);padding:1px 4px;font-size:11px;border:1px solid var(--border)}
.msg.assistant .bubble pre{background:var(--bg2);padding:10px;margin:6px 0;font-size:11px;overflow-x:auto;border:var(--pixel) solid var(--border);line-height:1.4}
.msg.assistant .bubble pre code{background:none;border:none;padding:0}
.msg.assistant .bubble table{border-collapse:collapse;margin:6px 0;font-size:11px;width:100%}
.msg.assistant .bubble table td,.msg.assistant .bubble table th{border:var(--pixel) solid var(--border);padding:4px 8px;text-align:left}
.msg.assistant .bubble table th{background:var(--bg2);text-transform:uppercase;font-size:10px}
.msg.assistant .bubble ul,.msg.assistant .bubble ol{margin:4px 0;padding-left:20px}
.msg.assistant .bubble li{margin:2px 0}
.msg.assistant .bubble h3{font-size:13px;margin:10px 0 4px;color:var(--gold);text-transform:uppercase;letter-spacing:1px}
.msg.assistant .bubble h4{font-size:12px;margin:8px 0 3px;color:var(--accent)}
.msg.assistant .bubble hr{border:none;border-top:var(--pixel) solid var(--border);margin:8px 0}
.msg.assistant .bubble strong{color:#f0e8d0}
.examples{display:flex;flex-wrap:wrap;gap:6px;padding:8px 16px;border-top:var(--pixel) solid var(--border);flex-shrink:0}
.chip{padding:4px 10px;font-size:10px;border:var(--pixel) solid var(--border);cursor:pointer;background:var(--surface);color:var(--text-dim);font-family:inherit;text-transform:uppercase;box-shadow:2px 2px 0 0 var(--shadow)}
.chip:hover{background:var(--primary);color:#fff;transform:translate(1px,1px);box-shadow:1px 1px 0 0 var(--shadow)}
.chat-input{display:flex;gap:8px;padding:10px 16px;border-top:var(--pixel) solid var(--border);flex-shrink:0;background:var(--bg2)}
.chat-input textarea{flex:1;padding:8px 10px;background:var(--surface);border:var(--pixel) solid var(--border);color:var(--text);font-family:inherit;font-size:12px;resize:none;min-height:36px;max-height:100px;outline:none;box-shadow:inset 2px 2px 0 0 var(--shadow)}
.chat-input textarea:focus{border-color:var(--accent)}
.chat-input button{flex-shrink:0}
.loading{display:flex;align-items:center;gap:8px;padding:8px 14px;color:var(--text-dim);font-size:11px}
.loading .spinner{width:12px;height:12px;border:2px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

/* BROWSE */
.browser-sidebar{width:260px;flex-shrink:0;border-right:var(--pixel) solid var(--border);display:flex;flex-direction:column;background:var(--bg2)}
.browser-search{padding:8px;border-bottom:var(--pixel) solid var(--border)}
.browser-search input{width:100%;padding:6px 8px;background:var(--surface);border:var(--pixel) solid var(--border);color:var(--text);font-family:inherit;font-size:11px;outline:none}
.browser-search input:focus{border-color:var(--accent)}
.browser-filters{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:6px 8px;border-bottom:var(--pixel) solid var(--border)}
.browser-filters select{padding:3px 4px;background:var(--surface);border:var(--pixel) solid var(--border);color:var(--text);font-family:inherit;font-size:10px;text-transform:uppercase;outline:none}
.browser-filters select:focus{border-color:var(--accent)}
.browser-count{padding:4px 8px;font-size:10px;color:var(--text-dim);border-bottom:var(--pixel) solid var(--border)}
.browser-list{flex:1;overflow-y:auto;padding:4px}
.browser-grid{flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:4px}
.item-row{padding:6px 10px;border:var(--pixel) solid var(--border);cursor:pointer;background:var(--surface);font-size:11px;display:flex;justify-content:space-between;align-items:center;box-shadow:2px 2px 0 0 var(--shadow)}
.item-row:hover{background:var(--surface2);transform:translate(1px,1px);box-shadow:1px 1px 0 0 var(--shadow)}
.item-row .i-name{font-weight:600}
.item-row .i-meta{font-size:10px;color:var(--text-dim)}
.tier-badge{display:inline-block;font-size:9px;padding:1px 6px;text-transform:uppercase;letter-spacing:0.5px;border:var(--pixel) solid var(--shadow)}
.tier-LG{background:linear-gradient(135deg,#c49a5c,#e8c87a);color:#1a1410}
.tier-CORRUPTED{background:linear-gradient(135deg,#6b5e8f,#c45c8a);color:#fff}
.tier-T0{background:#4a3d31;color:#d4c5a9}
.tier-T1{background:#5a7a4a;color:#fff}
.tier-T2{background:#4a7a6a;color:#fff}
.tier-T3{background:#4a6a8a;color:#fff}
.tier-T4{background:#6b5e8f;color:#fff}
.tier-T5{background:#8a5a4a;color:#fff}
.tier-T6{background:#8a4a4a;color:#fff}
.tier-T7{background:#8a4a6a;color:#fff}
.tier-T8{background:#6a3a4a;color:#fff}

/* MODAL */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(10,8,6,.8);z-index:100;align-items:center;justify-content:center}
.modal-overlay.active{display:flex}
.modal{background:var(--surface);border:var(--pixel) solid var(--border);padding:20px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:6px 6px 0 0 var(--shadow)}
.modal .close{float:right;background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:16px;font-family:inherit}
.modal .close:hover{color:var(--red)}
.modal h2{font-size:14px;margin-bottom:4px;font-weight:400}
.modal table{width:100%;font-size:11px;margin-top:8px}
.modal table td{padding:4px 6px;border-bottom:1px solid var(--surface2)}
.modal table td:first-child{color:var(--text-dim);width:100px}
.modal .passive{margin-top:8px;padding:6px;background:var(--bg2);border:var(--pixel) solid var(--border);font-size:10px}
.modal .drops{margin-top:8px;font-size:10px;color:var(--text-dim)}

/* CHANGES */
.changes-list{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px}
.change-card{padding:8px 12px;border:var(--pixel) solid var(--border);background:var(--surface);font-size:11px;box-shadow:2px 2px 0 0 var(--shadow)}
.change-title{color:var(--text);font-weight:600}
.change-meta{font-size:9px;color:var(--text-dim);margin-top:2px}
</style>
</head>
<body>
<div class="app">
<header>
<div class="header-icon">+</div>
<h1>Pixel<span>Quest</span> AI</h1>
<div class="stats-bar">
<span class="stat">Items: <b id="stat-items">-</b></span>
<span class="stat">Tipos: <b id="stat-types">-</b></span>
<span class="stat">Tiers: <b id="stat-tiers">-</b></span>
</div>
</header>

<div class="tabs">
<button class="tab active" data-tab="chat">[ Chat ]</button>
<button class="tab" data-tab="browse">[ Items ]</button>
<button class="tab" data-tab="changes">[ Cambios ]</button>
</div>

<div class="main">
<!-- CHAT -->
<div class="tab-content active" id="tab-chat">
<div class="chat-wrap">
<div class="chat-history" id="chat-history">
<div class="chat-history-header">
<span>Historial</span>
<button class="hist-btn" onclick="clearHistory()">x</button>
</div>
<div class="chat-history-list" id="history-list"></div>
</div>
<div class="chat-main">
<div class="chat-messages" id="messages">
<div class="msg assistant">
<div class="label">Pixel Quest AI</div>
<div class="bubble">> Sistema listo. 401 items cargados.<br>> Escribe o prueba los ejemplos.</div>
</div>
</div>
<div class="examples">
<span class="chip" data-q="Que armas para nivel 20?">nivel 20</span>
<span class="chip" data-q="Mejores dagas para principiantes">dagas</span>
<span class="chip" data-q="Donde farmeo Armageddon?">armageddon</span>
<span class="chip" data-q="Build para Overworld">overworld</span>
</div>
<div class="chat-input">
<textarea id="chat-input" placeholder="Escribe..." rows="1"></textarea>
<button id="chat-send" class="pixel-btn primary">>></button>
</div>
</div>
</div>
</div>

<!-- BROWSE -->
<div class="tab-content" id="tab-browse">
<div class="browser-sidebar">
<div class="browser-search"><input type="text" id="browse-search" placeholder="Buscar..." autocomplete="off"></div>
<div class="browser-filters">
<select id="filter-tier"><option value="">TODOS</option></select>
<select id="filter-type"><option value="">TODOS</option></select>
</div>
<div class="browser-count" id="browse-count">-</div>
<div class="browser-list" id="browse-list"></div>
</div>
<div class="browser-grid" id="browse-grid"></div>
</div>

<!-- CHANGES -->
<div class="tab-content" id="tab-changes">
<div class="changes-list" id="changes-list">
<div class="change-card">Cargando cambios del wiki...</div>
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
let chatHistory = JSON.parse(localStorage.getItem('pq_history') || '[]');
let currentHistoryId = null;

async function api(path, data) {
  const r = await fetch(API_BASE + path, {
    method: data ? 'POST' : 'GET',
    headers: data ? {'Content-Type':'application/json'} : {},
    body: data ? JSON.stringify(data) : undefined
  });
  return r.json();
}

/* Tab switching */
document.querySelectorAll('.tab').forEach(function(tab) {
  tab.onclick = function() {
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
    this.classList.add('active');
    var id = 'tab-' + this.dataset.tab;
    document.getElementById(id).classList.add('active');
    if (this.dataset.tab === 'changes') loadChanges();
    if (this.dataset.tab === 'browse' && !allItems.length) loadItems();
  };
});

/* Stats */
async function loadStats() {
  try {
    var s = await api('/api/stats');
    document.getElementById('stat-items').textContent = s.items || 0;
    document.getElementById('stat-types').textContent = s.item_types || 0;
    document.getElementById('stat-tiers').textContent = (s.tiers||[]).length;
  } catch(e) {}
}
loadStats();

/* History */
function renderHistory() {
  var list = document.getElementById('history-list');
  if (!list) return;
  if (!chatHistory.length) {
    list.innerHTML = '<div style="padding:8px;font-size:10px;color:var(--text-dim)">Vacio</div>';
    return;
  }
  var html = '';
  for (var i = 0; i < chatHistory.length; i++) {
    var h = chatHistory[i];
    var title = (h.msgs && h.msgs.length) ? h.msgs[0].text.slice(0,28) + (h.msgs[0].text.length>28?'..':'') : 'Nueva';
    var time = new Date(h.ts).toLocaleDateString();
    var active = (currentHistoryId === h.id) ? ' active' : '';
    html += '<div class="history-item' + active + '" onclick="loadHistory(\'' + h.id + '\')">'
      + '<div class="h-title">' + title + '</div>'
      + '<div class="h-meta">' + (h.msgs?h.msgs.length:0) + ' msgs | ' + time + '</div></div>';
  }
  list.innerHTML = html;
}

function saveHistory() {
  localStorage.setItem('pq_history', JSON.stringify(chatHistory));
  renderHistory();
}

function newConversation() {
  currentHistoryId = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  chatHistory.unshift({id:currentHistoryId, ts:Date.now(), msgs:[]});
  saveHistory();
  document.getElementById('messages').innerHTML = '';
}

function loadHistory(id) {
  var conv = null;
  for (var i = 0; i < chatHistory.length; i++) {
    if (chatHistory[i].id === id) { conv = chatHistory[i]; break; }
  }
  if (!conv) return;
  currentHistoryId = id;
  var container = document.getElementById('messages');
  container.innerHTML = '';
  if (conv.msgs) {
    for (var j = 0; j < conv.msgs.length; j++) {
      var m = conv.msgs[j];
      var div = document.createElement('div');
      div.className = 'msg ' + m.role;
      div.innerHTML = '<div class="label">' + (m.role==='user'?'Tu':'Pixel Quest AI') + '</div><div class="bubble">' + m.html + '</div>';
      container.appendChild(div);
    }
  }
  container.scrollTop = container.scrollHeight;
  renderHistory();
}

function addToHistory(text, role, htmlContent) {
  for (var i = 0; i < chatHistory.length; i++) {
    if (chatHistory[i].id === currentHistoryId) {
      chatHistory[i].msgs.push({text:text, role:role, html:htmlContent, ts:Date.now()});
      chatHistory[i].ts = Date.now();
      saveHistory();
      return;
    }
  }
}

function clearHistory() {
  if (!confirm('Limpiar historial?')) return;
  chatHistory = []; currentHistoryId = null;
  localStorage.removeItem('pq_history');
  document.getElementById('messages').innerHTML = ''
    + '<div class="msg assistant"><div class="label">Pixel Quest AI</div><div class="bubble">Historial limpiado.</div></div>';
  renderHistory();
}

function formatResponse(text) {
  if (!text) return '';
  text = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  text = text.replace(/\`\`\`(\w*)\n?([\s\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>');
  text = text.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/^### (.*$)/gm, '<h4>$1</h4>');
  text = text.replace(/^## (.*$)/gm, '<h3>$1</h3>');
  text = text.replace(/^[\s]*[-*] (.*$)/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  text = text.replace(/^[\s]*\d+\.\s+(.*$)/gm, '<li>$1</li>');
  text = text.replace(/^---$/gm, '<hr>');
  text = text.replace(/\n/g, '<br>');
  text = text.replace(/<li><br>/g, '<li>');
  text = text.replace(/<\/li>\n?<br>/g, '</li>');
  text = text.replace(/<br><\/ul>/g, '</ul>');
  return text;
}

function addMessage(text, role, isLoading) {
  var container = document.getElementById('messages');
  var div = document.createElement('div');
  div.className = 'msg ' + role;
  if (isLoading) {
    div.innerHTML = '<div class="loading"><div class="spinner"></div>Pensando...</div>';
  } else {
    div.innerHTML = '<div class="label">' + (role==='user'?'Tu':'Pixel Quest AI') + '</div><div class="bubble">' + text + '</div>';
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

/* Chat */
var chatInput = document.getElementById('chat-input');
var chatSend = document.getElementById('chat-send');

chatSend.onclick = function() { sendMessage(); };
chatInput.onkeydown = function(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
};

async function sendMessage() {
  var text = chatInput.value.trim();
  if (!text) return;
  if (!currentHistoryId) { newConversation(); }
  chatInput.value = '';
  addMessage(text, 'user');
  addToHistory(text, 'user', text);
  chatSend.disabled = true; chatSend.textContent = '..';
  var lv = text.match(/nivel\s*(\d+)/i);
  var lc = text.match(/en\s+(\w+)/);
  addMessage('', 'assistant', true);
  try {
    var data = await api('/api/ask', {
      query: text, level: lv ? parseInt(lv[1]) : 0, location: lc ? lc[1] : ''
    });
    document.querySelector('.loading').remove();
    if (data && data.response) {
      var fmt = formatResponse(data.response);
      addMessage(fmt, 'assistant');
      addToHistory(data.response, 'assistant', fmt);
    } else {
      addMessage('Sin respuesta.', 'assistant');
    }
  } catch(e) {
    document.querySelector('.loading').remove();
    addMessage('Error: ' + e.message, 'assistant');
  }
  chatSend.disabled = false; chatSend.textContent = '>>';
}

/* Examples */
document.querySelectorAll('.chip').forEach(function(chip) {
  chip.onclick = function() { chatInput.value = this.dataset.q; sendMessage(); };
});

/* Items */
async function loadItems() {
  try {
    var data = await api('/api/items?limit=400');
    allItems = data.items || [];
    renderItems();
    var tiers = await api('/api/tiers');
    var types = await api('/api/types');
    var tierSel = document.getElementById('filter-tier');
    var typeSel = document.getElementById('filter-type');
    if (tiers.length) tierSel.innerHTML = '<option value="">TIER</option>' + tiers.map(function(t){return '<option value="'+t+'">'+t+'</option>';}).join('');
    if (types.length) typeSel.innerHTML = '<option value="">TIPO</option>' + types.map(function(t){return '<option value="'+t+'">'+t+'</option>';}).join('');
  } catch(e) {}
}

var searchQuery = '', tierFilter = '', typeFilter = '';
function renderItems() {
  var items = allItems;
  if (searchQuery) {
    var q = searchQuery.toLowerCase();
    items = items.filter(function(i){ return i.name.toLowerCase().indexOf(q) >= 0 || (i.item_type||'').toLowerCase().indexOf(q) >= 0; });
  }
  if (tierFilter) items = items.filter(function(i){ return i.tier === tierFilter; });
  if (typeFilter) items = items.filter(function(i){ return i.item_type === typeFilter; });
  document.getElementById('browse-count').textContent = items.length + ' items';
  var list = document.getElementById('browse-list');
  var grid = document.getElementById('browse-grid');
  if (items.length > 100) items = items.slice(0,100);
  list.innerHTML = items.map(function(item){
    var t = item.tier ? 'tier-' + item.tier.replace(/[^A-Za-z0-9]/g,'') : '';
    var safeName = item.name.replace(/'/g,"\\'");
    return '<div class="item-row" onclick="openModal(\'' + safeName + '\')">'
      + '<div class="i-name">' + item.name + '</div>'
      + '<div class="i-meta"><span class="tier-badge ' + t + '">' + (item.tier||'') + '</span> ' + (item.item_type||'') + '</div></div>';
  }).join('');
  grid.innerHTML = '';
}

document.getElementById('filter-tier').onchange = function(){ tierFilter = this.value; renderItems(); };
document.getElementById('filter-type').onchange = function(){ typeFilter = this.value; renderItems(); };
document.getElementById('browse-search').oninput = function(){ searchQuery = this.value; renderItems(); };

/* Modal */
function openModal(name) {
  var item = null;
  for (var i = 0; i < allItems.length; i++) { if (allItems[i].name === name) { item = allItems[i]; break; } }
  if (!item) return;
  var t = item.tier ? 'tier-' + item.tier.replace(/[^A-Za-z0-9]/g,'') : '';
  var ws = item.weapon_stats || {};
  var html = '<h2>' + item.name + ' <span class="tier-badge ' + t + '">' + (item.tier||'') + '</span></h2>';
  html += '<p style="font-size:11px;color:var(--text-dim);margin-bottom:6px">' + (item.item_type||'') + (item.weapon_type?' / '+item.weapon_type:'') + '</p>';
  if (item.description) html += '<p style="font-size:10px;font-style:italic;margin-bottom:6px;color:var(--text-dim)">"' + item.description + '"</p>';
  html += '<table>';
  if (ws.damage) html += '<tr><td>Dano</td><td>' + ws.damage + '</td></tr>';
  if (ws.range) html += '<tr><td>Alcance</td><td>' + ws.range + '</td></tr>';
  if (ws.speed) html += '<tr><td>Velocidad</td><td>' + ws.speed + '</td></tr>';
  if (ws.rate_of_fire) html += '<tr><td>Cadencia</td><td>' + ws.rate_of_fire + '</td></tr>';
  if (item.valor_bonus) html += '<tr><td>Valor Bonus</td><td>+' + item.valor_bonus + '%</td></tr>';
  if (item.forge_valor) html += '<tr><td>Forge Valor</td><td>' + item.forge_valor + '</td></tr>';
  html += '</table>';
  var passives = item.passives || [];
  if (passives.length) html += '<div class="passive">' + passives.map(function(p){return '<div>> ' + p + '</div>';}).join('') + '</div>';
  var drops = item.dropped_by || [];
  if (drops.length) html += '<div class="drops">Drop de: ' + drops.join(', ') + '</div>';
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal').classList.add('active');
}

function closeModal() { document.getElementById('modal').classList.remove('active'); }
document.getElementById('modal').onclick = function(e) { if (e.target === this) closeModal(); };

/* Changes */
async function loadChanges() {
  var list = document.getElementById('changes-list');
  try {
    var data = await api('/api/changes?limit=30');
    if (data.changes && data.changes.length) {
      list.innerHTML = data.changes.map(function(c){
        return '<div class="change-card"><div class="change-title">' + c.title + '</div><div class="change-meta">' + (c.timestamp||'') + ' | ' + (c.type||'') + '</div></div>';
      }).join('');
    } else {
      list.innerHTML = '<div class="change-card">Sin cambios recientes.</div>';
    }
  } catch(e) {
    list.innerHTML = '<div class="change-card">Error al cargar cambios.</div>';
  }
}

/* Init */
renderHistory();
if (chatHistory.length) loadHistory(chatHistory[0].id);
</script>
</body>
</html>'''

with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Template written: {len(html)} bytes, {html.count(chr(10))} lines")
print(f"Features: tab-switch={html.count('tab.onclick')}, sendMessage={html.count('sendMessage')}, history={html.count('loadHistory')}")
