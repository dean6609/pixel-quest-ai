"""Write the pixel-art HTML template in parts."""
import os

OUT = r"C:\Users\dean\Documents\deep\pixel-quest-ai\templates\index.html"

# Part 1: HTML head + CSS
part1 = r'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Pixel Quest AI - Wiki Assistant</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
:root {
  --bg: #0a0a0f;
  --surface: #1a1a24;
  --surface2: #242436;
  --surface3: #2e2e44;
  --border: #3a3a55;
  --primary: #ff6b35;
  --primary-dim: #cc5529;
  --accent: #ffd700;
  --cyan: #00d4ff;
  --pink: #ff4dae;
  --green: #00e676;
  --red: #ff1744;
  --text: #e8e8e8;
  --text-dim: #9090aa;
  --text-dark: #55556a;
  --pixel-font: 'Press Start 2P', monospace;
  --font: 'Courier New', monospace;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  image-rendering: pixelated;
}
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--surface); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 0; }
.app {
  display: flex; flex-direction: column; height: 100vh;
  max-width: 1400px; margin: 0 auto;
}
/* Pixel border utility */
.pixel-border {
  border: 2px solid var(--border);
  box-shadow: 2px 2px 0 var(--border), inset 1px 1px 0 rgba(255,255,255,0.05);
}
.pixel-btn {
  font-family: var(--pixel-font);
  font-size: 10px;
  padding: 8px 16px;
  border: 2px solid var(--border);
  background: var(--surface2);
  color: var(--text);
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.1s;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.4);
  letter-spacing: 0.5px;
}
.pixel-btn:hover {
  background: var(--primary);
  color: #000;
  border-color: var(--primary);
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 rgba(0,0,0,0.5);
}
.pixel-btn:active { transform: translate(0,0); box-shadow: 1px 1px 0 rgba(0,0,0,0.4); }
.pixel-btn.primary { background: var(--primary); color: #000; border-color: var(--primary); }
.pixel-btn.primary:hover { background: var(--accent); border-color: var(--accent); }
.pixel-input {
  font-family: var(--font);
  background: var(--surface);
  border: 2px solid var(--border);
  color: var(--text);
  padding: 8px 12px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}
.pixel-input:focus { border-color: var(--primary); }
.pixel-select {
  font-family: var(--font);
  background: var(--surface);
  border: 2px solid var(--border);
  color: var(--text);
  padding: 6px 8px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
}
.pixel-select:focus { border-color: var(--primary); }
/* Header */
header {
  padding: 10px 20px;
  border-bottom: 3px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  background: var(--surface);
}
header .logo {
  font-family: var(--pixel-font);
  font-size: 14px;
  color: var(--accent);
  text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
  letter-spacing: 1px;
}
header .logo span { color: var(--primary); }
header .subtitle {
  font-size: 10px;
  color: var(--text-dim);
  font-family: var(--pixel-font);
  letter-spacing: 0.5px;
}
.stats-bar {
  display: flex; gap: 20px; font-size: 10px;
  color: var(--text-dim); margin-left: auto;
  font-family: var(--pixel-font);
}
.stats-bar span { white-space: nowrap; }
.stats-bar .num { color: var(--accent); }
.main {
  display: flex; flex: 1; overflow: hidden;
}
/* Sidebar Navigation */
.sidebar {
  width: 280px;
  border-right: 3px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: var(--surface);
}
.sidebar-tabs {
  display: flex;
  border-bottom: 3px solid var(--border);
}
.sidebar-tab {
  flex: 1;
  padding: 8px 4px;
  text-align: center;
  font-family: var(--pixel-font);
  font-size: 8px;
  cursor: pointer;
  background: var(--surface2);
  color: var(--text-dim);
  border: none;
  border-right: 2px solid var(--border);
  transition: all 0.1s;
  letter-spacing: 0.3px;
}
.sidebar-tab:last-child { border-right: none; }
.sidebar-tab.active { background: var(--surface); color: var(--accent); box-shadow: inset 0 -2px 0 var(--accent); }
.sidebar-tab:hover { color: var(--text); }
.sidebar-content { flex: 1; overflow-y: auto; padding: 8px; }
/* Item grid */
.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 6px;
}
.item-cell {
  padding: 8px;
  background: var(--surface2);
  border: 2px solid var(--border);
  cursor: pointer;
  transition: all 0.1s;
  text-align: center;
}
.item-cell:hover { border-color: var(--primary); background: var(--surface3); }
.item-cell .icon {
  width: 32px; height: 32px;
  background: var(--surface3);
  margin: 0 auto 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border: 1px solid var(--border);
}
.item-cell .iname {
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-cell .imeta {
  font-size: 8px;
  color: var(--text-dim);
  margin-top: 2px;
  font-family: var(--pixel-font);
}
.tier-badge {
  display: inline-block;
  font-family: var(--pixel-font);
  font-size: 7px;
  padding: 1px 5px;
  letter-spacing: 0.5px;
  border: 1px solid;
}
.tier-LG { background: #b8860b; color: #ffd700; border-color: #ffd700; }
.tier-CORRUPTED { background: #4a0080; color: #ff4dae; border-color: #ff4dae; }
.tier-T0 { background: #333; color: #999; border-color: #666; }
.tier-T1 { background: #006644; color: var(--green); border-color: var(--green); }
.tier-T2 { background: #006060; color: var(--cyan); border-color: var(--cyan); }
.tier-T3 { background: #003d80; color: #4fc3ff; border-color: #4fc3ff; }
.tier-T4 { background: #2d0080; color: #b388ff; border-color: #b388ff; }
.tier-T5 { background: #803000; color: var(--primary); border-color: var(--primary); }
.tier-T6 { background: #800020; color: var(--red); border-color: var(--red); }
.tier-T7 { background: #800060; color: var(--pink); border-color: var(--pink); }
.tier-T8 { background: #600020; color: #ff6b8a; border-color: #ff6b8a; }
/* Filter bar */
.filter-bar {
  display: flex; gap: 6px; padding: 8px;
  border-bottom: 2px solid var(--border);
  flex-wrap: wrap;
}
.filter-bar .pixel-select { flex: 1; min-width: 80px; }
.filter-bar .pixel-input { flex: 2; min-width: 100px; }
/* Recent changes */
.change-item {
  padding: 6px 8px;
  border-bottom: 1px solid var(--border);
  font-size: 10px;
  line-height: 1.4;
}
.change-item:last-child { border-bottom: none; }
.change-item .time { color: var(--text-dim); font-size: 8px; font-family: var(--pixel-font); }
.change-item .title { color: var(--cyan); cursor: pointer; }
.change-item .title:hover { text-decoration: underline; }
/* Chat area */
.chat-area { flex: 1; display: flex; flex-direction: column; }
.chat-header {
  padding: 8px 16px;
  border-bottom: 3px solid var(--border);
  font-family: var(--pixel-font);
  font-size: 9px;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
}
.chat-header .dot { width: 8px; height: 8px; background: var(--green); border: 1px solid #000; }
.messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
}
.msg { max-width: 85%; animation: fadeIn 0.2s; }
.msg.user { margin-left: auto; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.msg .label {
  font-family: var(--pixel-font); font-size: 7px;
  color: var(--text-dim); margin-bottom: 4px; padding-left: 4px;
  letter-spacing: 0.5px;
}
.msg .bubble {
  padding: 10px 14px;
  border: 2px solid var(--border);
  line-height: 1.5;
  font-size: 13px;
}
.msg.user .bubble {
  background: var(--primary-dim);
  color: #fff;
  border-color: var(--primary);
}
.msg.assistant .bubble {
  background: var(--surface2);
  border-color: var(--border);
}
.msg.assistant .bubble h2 {
  font-family: var(--pixel-font);
  font-size: 10px;
  color: var(--accent);
  margin: 8px 0 4px;
  letter-spacing: 0.3px;
}
.msg.assistant .bubble h2:first-child { margin-top: 0; }
.msg.assistant .bubble h3 {
  font-size: 12px;
  color: var(--cyan);
  margin: 6px 0 3px;
}
.msg.assistant .bubble ul { margin: 4px 0; padding-left: 16px; }
.msg.assistant .bubble li { margin: 2px 0; }
.msg.assistant .bubble code {
  display: block;
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 6px 10px;
  margin: 6px 0;
  font-family: var(--font);
  font-size: 12px;
  color: var(--green);
  white-space: pre;
  overflow-x: auto;
}
.msg.assistant .bubble strong { color: var(--accent); }
.msg.assistant .bubble em { color: var(--text-dim); }
.examples {
  display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 16px;
}
.examples button {
  font-family: var(--pixel-font);
  font-size: 7px;
  padding: 4px 8px;
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.1s;
  letter-spacing: 0.3px;
}
.examples button:hover { border-color: var(--accent); color: var(--accent); background: var(--surface3); }
.input-area {
  padding: 10px 16px;
  border-top: 3px solid var(--border);
  display: flex; gap: 8px;
  flex-shrink: 0;
  background: var(--surface);
}
.input-area textarea {
  flex: 1;
  padding: 8px 12px;
  background: var(--surface2);
  border: 2px solid var(--border);
  color: var(--text);
  font-size: 13px;
  resize: none;
  min-height: 40px;
  max-height: 100px;
  font-family: var(--font);
  outline: none;
}
.input-area textarea:focus { border-color: var(--primary); }
.loading {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; color: var(--text-dim); font-size: 12px;
}
.loading .spinner {
  width: 12px; height: 12px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  animation: spin 0.6s steps(8) infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
/* Modal */
.modal-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.7); z-index: 100;
  align-items: center; justify-content: center;
}
.modal-overlay.active { display: flex; }
.modal {
  background: var(--surface);
  border: 3px solid var(--border);
  max-width: 500px; width: 90%;
  max-height: 80vh; overflow-y: auto;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.5);
}
.modal-header {
  padding: 10px 14px;
  border-bottom: 2px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
}
.modal-header h2 {
  font-family: var(--pixel-font); font-size: 10px;
  letter-spacing: 0.5px;
}
.modal-close {
  background: none; border: none; color: var(--text-dim);
  font-size: 18px; cursor: pointer; font-family: var(--font);
}
.modal-close:hover { color: var(--red); }
.modal-body { padding: 14px; font-size: 12px; line-height: 1.5; }
.modal-body table { width: 100%; border-collapse: collapse; margin: 6px 0; }
.modal-body th, .modal-body td {
  border: 1px solid var(--border);
  padding: 4px 8px; text-align: left;
  font-size: 11px;
}
.modal-body th { background: var(--surface2); color: var(--text-dim); font-family: var(--pixel-font); font-size: 8px; letter-spacing: 0.3px; }
/* Welcome screen */
.welcome {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 16px; padding: 40px 20px;
  text-align: center;
}
.welcome .title {
  font-family: var(--pixel-font); font-size: 18px;
  color: var(--accent); text-shadow: 3px 3px 0 rgba(0,0,0,0.5);
  letter-spacing: 1px;
}
.welcome .title span { color: var(--primary); }
.welcome .sub {
  font-size: 11px; color: var(--text-dim);
  max-width: 400px; line-height: 1.6;
}
.welcome .pixel-char {
  font-size: 48px; line-height: 1;
  image-rendering: pixelated;
  margin-bottom: 8px;
}
.welcome .hints { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.welcome .hint {
  font-family: var(--pixel-font); font-size: 7px;
  color: var(--text-dark); letter-spacing: 0.5px;
}
/* Responsive */
@media (max-width: 800px) {
  .sidebar { width: 200px; }
  .item-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
  .welcome .title { font-size: 14px; }
}
@media (max-width: 600px) {
  .sidebar { display: none; }
  .sidebar.show { display: flex; position: fixed; inset: 0; z-index: 50; width: 100%; }
}
</style>
</head>
<body>
<div class="app">
  <header>
    <div class="logo">[<span>P</span>Q] <span>AI</span></div>
    <div class="subtitle">WIKI ASSISTANT</div>
    <div class="stats-bar">
      <span>ITEMS: <span class="num" id="stat-items">-</span></span>
      <span>TIERS: <span class="num" id="stat-tiers">-</span></span>
      <span>TYPES: <span class="num" id="stat-types">-</span></span>
    </div>
  </header>
'''

with open(OUT, 'w', encoding='utf-8') as f:
    f.write(part1)

print(f"Part 1 written ({len(part1)} bytes)")
