"""Write the pixel-art HTML template."""
OUT = r"C:\Users\dean\Documents\deep\pixel-quest-ai\templates\index.html"

parts = {}
parts["head"] = '''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Pixel Quest AI</title>
<style>
@font-face {
  font-family: 'PixelFont';
  src: local('Courier New'), local('Lucida Console'), local('Consolas');
}
:root {
  --bg: #111118;
  --bg2: #1a1a25;
  --surface: #22223a;
  --surface2: #2e2e4a;
  --border: #3a3a5a;
  --text: #d0d0e0;
  --text-dim: #7a7a9a;
  --primary: #7c5cff;
  --primary-dim: #5a3ebb;
  --accent: #ff6b9d;
  --gold: #ffd700;
  --green: #44d9a0;
  --red: #ff4466;
  --blue: #4a9eff;
  --pixel: 2px;
}
* { margin: 0; padding: 0; box-sizing: border-box; image-rendering: pixelated; }
body {
  font-family: 'PixelFont', 'Courier New', monospace;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  font-size: 14px;
  line-height: 1.5;
}
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); }
::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }

/* Pixel borders */
.pixel-border {
  border: var(--pixel) solid var(--border);
  box-shadow: 
    inset calc(var(--pixel) * -1) calc(var(--pixel) * -1) 0 0 rgba(0,0,0,0.3),
    inset var(--pixel) var(--pixel) 0 0 rgba(255,255,255,0.05);
}
.pixel-btn {
  font-family: inherit;
  font-size: 12px;
  padding: 8px 16px;
  border: var(--pixel) solid var(--border);
  background: var(--surface2);
  color: var(--text);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.1s;
  box-shadow: 
    inset calc(var(--pixel) * -1) calc(var(--pixel) * -1) 0 0 rgba(0,0,0,0.3),
    inset var(--pixel) var(--pixel) 0 0 rgba(255,255,255,0.05);
}
.pixel-btn:hover {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary-dim);
}
.pixel-btn:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}
.pixel-btn.primary {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary-dim);
}
.pixel-btn.primary:hover { background: var(--primary-dim); }

/* Layout */
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1260px;
  margin: 0 auto;
}

/* Header */
header {
  padding: 12px 20px;
  background: var(--bg2);
  border-bottom: var(--pixel) solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.header-icon {
  width: 32px; height: 32px;
  background: var(--primary);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  color: #fff;
}
header h1 { font-size: 16px; font-weight: 400; letter-spacing: 2px; text-transform: uppercase; }
header h1 span { color: var(--gold); }
.stats-bar {
  display: flex; gap: 12px; font-size: 11px; color: var(--text-dim);
  margin-left: auto; letter-spacing: 0.5px;
}
.stats-bar .stat { white-space: nowrap; }
.stats-bar .stat b { color: var(--text); }

/* Tabs */
.tabs {
  display: flex;
  background: var(--bg2);
  border-bottom: var(--pixel) solid var(--border);
  flex-shrink: 0;
}
.tab {
  padding: 8px 20px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-family: inherit;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.tab:hover { color: var(--text); }
.tab.active { color: var(--gold); border-bottom-color: var(--gold); }

/* Main */
.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Browser tab */
.browser {
  display: none;
  flex: 1;
  overflow: hidden;
}
.browser.active { display: flex; }
.browser-sidebar {
  width: 280px;
  flex-shrink: 0;
  border-right: var(--pixel) solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--bg2);
}
.browser-search {
  padding: 10px;
  border-bottom: var(--pixel) solid var(--border);
}
.browser-search input {
  width: 100%;
  padding: 8px 10px;
  background: var(--surface);
  border: var(--pixel) solid var(--border);
  color: var(--text);
  font-family: inherit;
  font-size: 12px;
  outline: none;
}
.browser-search input:focus { border-color: var(--primary); }
.browser-filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: var(--pixel) solid var(--border);
}
.browser-filters select {
  padding: 4px 6px;
  background: var(--surface);
  border: var(--pixel) solid var(--border);
  color: var(--text);
  font-family: inherit;
  font-size: 10px;
  text-transform: uppercase;
  outline: none;
}
.browser-filters select:focus { border-color: var(--primary); }
.browser-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}
.browser-count {
  padding: 6px 10px;
  font-size: 10px;
  color: var(--text-dim);
  border-bottom: var(--pixel) solid var(--border);
  letter-spacing: 0.5px;
}
'''

# Rest of the template needs to be shorter chunks. Let me write the full thing via Python.
print(f"Part 1: {len(parts['head'])} chars written")
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(parts["head"])
print("Template started in file")
