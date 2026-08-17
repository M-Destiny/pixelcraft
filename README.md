# PixelCraft — Browser-Based Pixel Art Editor

A lightweight, self-hosted pixel art editor built with Angular 17. Draw on a configurable grid, manage layers, and export your artwork to PNG or SVG — all in the browser.

**Live Demo:** [pixelcraft.app](https://pixelcraft.app) *(self-host or deploy via the guides below)*

---

## Features

| Tool | Description |
|---|---|
| ✏️ **Pencil** | Draw pixels on the active layer (1/3/5 px brush) |
| 🧹 **Eraser** | Erase pixels (set to transparent) |
| 🪣 **Fill** | Flood-fill a region with the selected color |
| 💧 **Eyedropper** | Pick a color from the canvas |
| ⬚ **Select** | Rectangular selection tool (move, copy, cut, paste, flip) |
| ▭ **Rectangle** | Hollow (default) or filled (Alt+drag) rectangle, Shift = square |
| ✋ **Pan** | Pan/scroll around the canvas |
| 🔍 **Zoom** | Zoom in/out (1x–32x) |

### Color Palette
- 16-color default palette
- 256-color extended palette mode
- Custom color picker (hex + color wheel)
- **Color history/swatches** — recently used colors for quick access

### Layer Management
- Add, delete, and reorder layers
- Toggle layer visibility
- Adjust per-layer opacity
- **Layer blend modes** — 12 modes: Normal, Multiply, Screen, Overlay, Darken, Lighten, Color Dodge, Color Burn, Hard Light, Soft Light, Difference, Exclusion
- Active layer indicator
- Merge down
- Duplicate layer

### Export
- PNG export at 1x, 2x, 4x, 8x, 16x scale
- SVG export (vector, infinite scale)
- **Export presets** — built-in and custom presets saved to localStorage
- Project save/load to JSON (full layer state round-trip)
- Direct browser download

---

## Architecture

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                         PIXELCRAFT ARCHITECTURE                                  ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ┌──────────────────────────────────────────────────────────────────────────┐    ║
║  │                          ToolbarComponent                               │    ║
║  │  [✏️ Pencil] [🧹 Eraser] [🪣 Fill] [💧 Eyedropper] [⬚ Select] [✋ Pan]   │    ║
║  └─────────────────────────────────┬───────────────────────────────────────┘    ║
║                                    │                                              ║
║  ┌─────────────────┐               ▼         ┌─────────────────────────────────┐   ║
║  │  ColorPalette   │──▶ ColorSignal ───────▶│         CanvasComponent         │   ║
║  │  (16 / 256)     │                       │  ┌──────┐ ┌────────┐ ┌─────────┐ │   ║
║  ├─────────────────┤                       │  │ Grid │ │  Zoom  │ │ Compos- │ │   ║
║  │  LayerPanel     │──▶ LayerSignal ──────▶│  │Render│ │ Ctrl   │ │  itor  │ │   ║
║  │  (stack ops)    │                       │  └──────┘ └────────┘ └────┬────┘ │   ║
║  └─────────────────┘                       └───────────────────────────┼──────┘   ║
║                                                                     │           ║
║                                    ┌─────────────────────────────────▼─────────┐  ║
║                                    │          ExportPanel (PNG/SVG)          │  ║
║                                    │          export.service.ts              │  ║
║                                    └───────────────────────────────────────────┘  ║
║                                                                                  ║
║  ═══════════════════════════ SIGNALS STATE ═════════════════════════════════════  ║
║  pixel-art.service.ts ──▶ ToolSignal · ColorSignal · GridSignal · LayerSignal   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `P` | Pencil tool |
| `E` | Eraser tool |
| `F` | Fill (bucket) tool |
| `I` | Eyedropper (pick color) |
| `S` | Selection tool |
| `H` | Pan/hand tool |
| `R` | Rectangle tool (hollow). **Alt+drag** = filled |
| `B` | Cycle brush size: 1 → 3 → 5 px |
| `Z` | Zoom in |
| `X` | Zoom out |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Ctrl+C` / `Ctrl+X` / `Ctrl+V` | Copy / Cut / Paste selection |
| `Ctrl+S` | Save project as JSON |
| `Ctrl+O` | Load project from JSON |
| `Ctrl+R` | Resize canvas |
| `Delete` | Clear active layer (or delete selection contents) |
| `Arrow keys` | Move selection by 1px |
| `M` | Flip selection horizontally |
| `Shift+M` | Flip selection vertically |
| `G` | Toggle grid overlay |
| `Ctrl+0` | Reset zoom to 100% |
| `Shift` (in pencil/rect) | Straight line / square constraint |
| `Alt` (in rectangle) | Filled rectangle |
| `Space` | Temporary pan tool |
| `Escape` | Deselect / cancel |
| `?` (Shift+/) | Open keyboard shortcuts help |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/M-Destiny/pixelcraft.git
cd pixelcraft

# Install dependencies
npm install

# Start the development server
npm start
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 17 (standalone components) |
| Language | TypeScript 5.4 |
| Styling | SCSS |
| State | Angular Signals |
| Canvas | HTML5 Canvas 2D API |
| Build | Angular CLI 17.3 |

---

## Deployment

### Fly.io

```bash
fly launch
fly deploy
```

### Railway

```bash
railway login
railway init
railway up
```

### Render

```bash
render deploy
```

> Or use the pre-configured `render.yaml` / `railway.json` / `fly.toml` files included in the repo.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with 💜 by [M-Destiny](https://github.com/M-Destiny)
