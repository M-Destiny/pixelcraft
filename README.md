# PixelCraft — Browser-Based Pixel Art Editor

A lightweight, self-hosted pixel art editor built with Angular 17. Draw on a configurable grid, manage layers, and export your artwork to PNG or SVG — all in the browser.

**Live Demo:** [pixelcraft.app](https://pixelcraft.app) *(self-host or deploy via the guides below)*

---

## Features

| Tool | Description |
|---|---|
| ✏️ **Pencil** | Draw single pixels on the active layer |
| 🧹 **Eraser** | Erase pixels (set to transparent) |
| 🪣 **Fill** | Flood-fill a region with the selected color |
| 💧 **Eyedropper** | Pick a color from the canvas |
| ⬚ **Select** | Rectangular selection tool |
| ✋ **Pan** | Pan/scroll around the canvas |
| 🔍 **Zoom** | Zoom in/out (1x–32x) |

### Layer Management
- Add, delete, and reorder layers
- Toggle layer visibility
- Adjust per-layer opacity
- Active layer indicator

### Export
- PNG export at 1x, 2x, 4x, 8x, 16x scale
- SVG export (vector, infinite scale)
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
| `Z` | Zoom in |
| `X` | Zoom out |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+E` | Export PNG |
| `Ctrl+S` | Save project |
| `Delete` | Clear active layer |
| `+/-` | Increase/decrease brush size |
| `G` | Toggle grid overlay |
| `Ctrl+0` | Reset zoom to 100% |
| `Escape` | Deselect / cancel |

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
