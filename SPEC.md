# PixelCraft — Specification

> **Spec Kit: graphify + ponytail development approach**

## 1. Concept & Vision

PixelCraft is a browser-based pixel art editor built with Angular 17. Draw pixel art on a configurable grid, pick colors from a palette, use layer management, and export to PNG. Designed for game developers and digital artists who want a lightweight, self-hosted tool.

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PIXELCRAFT ARCHITECTURE                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    ToolbarComponent                       │   │
│  │  Pencil │ Eraser │ Fill │ Eyedropper │ Select │ Pan     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────┐  ┌───────────────────────────────────────┐  │
│  │ ColorPalette │  │           CanvasComponent                │  │
│  │ (16/256)     │  │  Grid-based pixel editor               │  │
│  │              │  │  Supports zoom + pan                     │  │
│  ├──────────────┤  └───────────────────────────────────────┘  │
│  │ LayerPanel   │                                              │
│  │ (add/del/reorder)│                                         │
│  └──────────────┘  ┌───────────────────────────────────────┐  │
│                    │         ExportPanel                      │  │
│                    │  PNG/SVG export, scale 1x-16x            │  │
│                    └───────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 17 (standalone components) |
| Language | TypeScript 5 |
| Styling | SCSS |
| State | Angular Signals |
| Canvas | HTML5 Canvas API |

## 4. Ponytail — Task Breakdown

### Phase 1: Setup
1. `package.json`, `angular.json`, `tsconfig.json`, `tsconfig.app.json`
2. `src/main.ts`, `src/styles.scss`, `src/index.html`

### Phase 2: Core
3. `src/app/app.component.ts` — root with toolbar + canvas layout
4. `src/app/app.config.ts` — standalone app config
5. `src/app/models/pixel.ts` — PixelArt, Layer, Color interfaces

### Phase 3: Components
6. `src/app/components/toolbar/toolbar.component.ts` — tool buttons
7. `src/app/components/color-palette/color-palette.component.ts` — 16/256 color grid
8. `src/app/components/layer-panel/layer-panel.component.ts` — layer list
9. `src/app/components/canvas/canvas.component.ts` — pixel grid renderer
10. `src/app/components/export-panel/export-panel.component.ts` — PNG/SVG export

### Phase 4: Services
11. `src/app/services/pixel-art.service.ts` — state management with Signals
12. `src/app/services/export.service.ts` — canvas → PNG/SVG

### Phase 5: Deploy
13. `fly.toml`, `railway.json`, `render.yaml`

## 5. Milestones

- [x] Phase 1-2: Setup + core (this build)
- [ ] Phase 3: All components
- [ ] Phase 4: Services + export
- [ ] Phase 5: Deployment
