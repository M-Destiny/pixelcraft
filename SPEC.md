# PixelCraft — Specification

> **Spec Kit: graphify + ponytail development approach**

## 1. Concept & Vision

PixelCraft is a browser-based pixel art editor built with Angular 17. Draw pixel art on a configurable grid, pick colors from a palette, manage layers, and export to PNG. Designed for game developers and digital artists who want a lightweight, self-hosted tool.

## 2. Architecture

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                         PIXELCRAFT FULL ARCHITECTURE                               ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║  ┌────────────────────────────────────────────────────────────────────────────┐   ║
║  │                           ToolbarComponent                                 │   ║
║  │  [✏️ Pencil] [🧹 Eraser] [🪣 Fill] [💧 Eyedropper] [▭ Rect] [⬚ Select] [✋ Pan]  │   ║
║  └──────────────────────────────────┬─────────────────────────────────────────┘   ║
║                                    │                                               ║
║                                    ▼                                               ║
║  ┌──────────────────┐    ┌──────────────────────────────────────────────────┐    ║
║  │  ColorPalette    │───▶│                   CanvasComponent                  │    ║
║  │  (16 / 256 cols) │    │  ┌────────┐  ┌─────────┐  ┌─────────────────┐   │    ║
║  │                  │    │  │ Grid   │  │ Zoom    │  │ Layer Compositor│   │    ║
║  ├──────────────────┤    │  │ Renderer│  │ Controller│  │ (merged output) │   │    ║
║  │  LayerPanel      │    │  └────────┘  └─────────┘  └────────┬────────┘   │    ║
║  │  (add/del/reorder│    └──────────────────────────────────┼─────────────┘    ║
║  │   visibility)    │                                       │                   ║
║  └────────┬─────────┘                                       ▼                   ║
║           │                                     ┌───────────────────────┐        ║
║           │                                     │    ExportPanel        │        ║
║           │                                     │  [PNG 1x-16x] [SVG]  │        ║
║           │                                     └───────────────────────┘        ║
║           │                                                                   ║
║  ═════════╪══════════════════════════════════════════════════════════════════════║
║           │                    DATA FLOW ARROWS                                  ║
║           ▼                                                                   ║
║  ┌────────────────────────────────────────────────────────────────────────────┐  ║
║  │                    pixel-art.service.ts (Angular Signals)                  │  ║
║  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  ║
║  │  │ToolSignal│  │ColorSignal│ │GridSignal│  │LayerSignal│ │ExportSignal│    │  ║
║  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │  ║
║  │       │             │             │             │             │             │  ║
║  │       ▼             ▼             ▼             ▼             ▼             │  ║
║  │  [PencilTool]  [ColorPicker]  [GridSize]  [LayerStack]  [ExportService]    │  ║
║  └────────────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

### Data Flow Summary

```
User Action
    │
    ▼
ToolbarComponent (tool selection) ──▶ ToolSignal ──▶ CanvasComponent (drawing mode)
    │                                                                  │
    ▼                                                                  ▼
ColorPaletteComponent ──▶ ColorSignal ──▶ Grid Renderer + Layer Compositor
    │                                                                  │
    ▼                                                                  ▼
LayerPanelComponent ──▶ LayerSignal ──────────────────▶ Merged Canvas Output
                                                                │
                                                                ▼
                                                         ExportPanelComponent
                                                                │
                                                                ▼
                                                         export.service.ts ──▶ PNG/SVG
```

## 3. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Angular | 17.x |
| Language | TypeScript | 5.4.x |
| Styling | SCSS | — |
| State | Angular Signals | 17.x |
| Canvas | HTML5 Canvas API | — |
| Build | Angular CLI | 17.3.x |
| Renderer | Canvas 2D Context | — |

## 4. Ponytail — Full Task Breakdown

### Phase 1: Project Setup
- [x] `package.json` — Angular 17 dependencies, scripts
- [x] `angular.json` — build configuration, assets
- [x] `tsconfig.json` — TypeScript compiler options
- [x] `tsconfig.app.json` — app-specific TypeScript config
- [x] `src/main.ts` — standalone bootstrap
- [x] `src/styles.scss` — global SCSS styles
- [x] `src/index.html` — app shell

### Phase 2: Core Application
- [x] `src/app/app.component.ts` — root component, toolbar + canvas layout
- [x] `src/app/app.config.ts` — standalone app providers
- [x] `src/app/app.routes.ts` — routing (if needed)
- [x] `src/app/models/pixel.ts` — `PixelArt`, `Layer`, `Color` interfaces

### Phase 3: Components
- [x] `src/app/components/toolbar/toolbar.component.ts` — tool buttons
  - [x] Pencil tool
  - [x] Eraser tool
  - [x] Fill (bucket) tool
  - [x] Eyedropper (color picker) tool
  - [x] Selection tool
  - [x] Rectangle tool (hollow + filled, Shift modifier; **R** shortcut, **Alt+drag** = filled)
  - [x] Pan/hand tool
  - [x] Undo/redo
  - [x] Clear canvas
  - [x] Brush size cycle (1→3→5, **B** shortcut)
  - [x] Save/Load project (Ctrl+S / Ctrl+O, JSON)
- [x] `src/app/components/color-palette/color-palette.component.ts`
  - [x] 16-color default palette
  - [x] 256-color palette mode
  - [x] Active color indicator
  - [x] Custom color input
- [x] `src/app/components/layer-panel/layer-panel.component.ts`
  - [x] Add layer
  - [x] Delete layer
  - [x] Reorder layers (drag or buttons)
  - [x] Toggle layer visibility
  - [x] Layer opacity
  - [x] Active layer indicator
  - [x] Merge down
  - [x] Duplicate layer
- [x] `src/app/components/canvas/canvas.component.ts`
  - [x] Grid-based pixel renderer
  - [x] Mouse/touch drawing
  - [x] Brush-size-aware stamping (1/3/5)
  - [x] Zoom controls (1x–32x)
  - [x] Pan/scroll support
  - [x] Grid overlay toggle
  - [x] Checkerboard background for transparency
  - [x] Selection flip H/V (**M** / **Shift+M**)
  - [x] Filled + hollow rectangle with Shift-square constraint
- [x] `src/app/components/export-panel/export-panel.component.ts`
  - [x] PNG export at 1x, 2x, 4x, 8x, 16x scale
  - [x] SVG export
  - [x] Preview thumbnail
  - [x] Download trigger

### Phase 4: Services
- [x] `src/app/services/pixel-art.service.ts` — Signal-based state
  - [x] `toolSignal` — current active tool
  - [x] `colorSignal` — current selected color
  - [x] `gridSignal` — canvas width/height in pixels
  - [x] `layersSignal` — ordered layer stack
  - [x] `zoomSignal` — current zoom level
  - [x] `undoStack` / `redoStack`
  - [x] `brushSize` — 1/3/5 square brush
  - [x] `flipSelection(H|V)` — mirror selection in place
  - [x] `saveProjectToJSON` / `loadProjectFromJSON` — round-trip project state
- [x] `src/app/services/export.service.ts`
  - [x] `canvasToPNG(scale)` — rasterized export
  - [x] `canvasToSVG()` — vector export
  - [x] `downloadBlob()` — file download helper

### Phase 5: Deployment
- [x] `fly.toml` — Fly.io deployment config
- [x] `railway.json` — Railway deployment config
- [x] `render.yaml` — Render deployment config
- [ ] Docker container (optional)

## 5. Milestones

| Milestone | Status | Notes |
|---|---|---|
| Phase 1: Setup | ✅ Complete | Angular 17, SCSS, TypeScript 5 |
| Phase 2: Core | ✅ Complete | App root, models, config |
| Phase 3: Components | ✅ Complete | Toolbar, ColorPalette, Canvas, LayerPanel, ExportPanel |
| Phase 4: Services | ✅ Complete | PixelArtService (Signals), ExportService |
| Phase 5: Deployment | ✅ Complete | Fly.io, Railway, Render configs |
| **v0.1.0** | **Released** | Pencil, Eraser, Fill, Eyedropper, Select, Pan, Layers, PNG/SVG Export |
| **v0.2.0** | In progress | Rectangle tool (R), Merge-Down (⇩), Shift-straight line, touch/pinch-zoom, clipboard ops, 16↔256 palette, resize canvas |
| **v0.3.0** | In progress | Filled rectangle (Alt+drag), brush size (B cycles 1/3/5), flip selection H/V (M / Shift+M), project save/load JSON (Ctrl+S / Ctrl+O) |

## 6. File Structure

```
pixelcraft/
├── SPEC.md
├── README.md
├── package.json
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── fly.toml
├── railway.json
├── render.yaml
└── src/
    ├── main.ts
    ├── index.html
    ├── styles.scss
    └── app/
        ├── app.component.ts
        ├── app.config.ts
        ├── app.routes.ts
        ├── models/
        │   └── pixel.ts
        ├── components/
        │   ├── toolbar/
        │   ├── color-palette/
        │   ├── canvas/
        │   ├── layer-panel/
        │   └── export-panel/
        └── services/
            ├── pixel-art.service.ts
            └── export.service.ts
```
