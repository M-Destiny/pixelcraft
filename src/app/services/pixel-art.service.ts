import { Injectable, signal, computed, effect } from '@angular/core';
import { Layer, Tool, BlendMode } from '../models/pixel';

interface CanvasSnapshot {
  layers: Layer[];
  activeLayerId: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function createEmptyLayer(width: number, height: number, name: string): Layer {
  return {
    id: generateId(),
    name,
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    pixels: Array(height).fill(null).map(() => Array(width).fill('transparent')),
  };
}

function cloneLayer(layer: Layer): Layer {
  return {
    ...layer,
    pixels: layer.pixels.map(row => [...row]),
  };
}

function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map(cloneLayer);
}

function mergeLayers(layers: Layer[], width: number, height: number): string[][] {
  const merged = Array(height).fill(null).map(() => Array(width).fill('transparent'));
  for (const layer of layers) {
    if (!layer.visible) continue;
    const opacity = layer.opacity ?? 1;
    const blendMode = layer.blendMode ?? 'normal';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = layer.pixels[y][x];
        if (color !== 'transparent') {
          const existing = merged[y][x];
          if (existing !== 'transparent') {
            merged[y][x] = blendColors(existing, color, opacity, blendMode);
          } else {
            merged[y][x] = applyOpacity(color, opacity);
          }
        }
      }
    }
  }
  return merged;
}

// Blend mode functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

function applyOpacity(color: string, opacity: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  return rgbToHex(rgb.r * opacity, rgb.g * opacity, rgb.b * opacity);
}

function blendColors(base: string, overlay: string, opacity: number, blendMode: BlendMode): string {
  const baseRgb = hexToRgb(base);
  const overlayRgb = hexToRgb(overlay);
  if (!baseRgb || !overlayRgb) return overlay;
  
  let r = baseRgb.r;
  let g = baseRgb.g;
  let b = baseRgb.b;
  
  const or = overlayRgb.r;
  const og = overlayRgb.g;
  const ob = overlayRgb.b;
  
  switch (blendMode) {
    case 'multiply':
      r = (r * or) / 255;
      g = (g * og) / 255;
      b = (b * ob) / 255;
      break;
    case 'screen':
      r = 255 - ((255 - r) * (255 - or)) / 255;
      g = 255 - ((255 - g) * (255 - og)) / 255;
      b = 255 - ((255 - b) * (255 - ob)) / 255;
      break;
    case 'overlay':
      r = r < 128 ? (2 * r * or) / 255 : 255 - (2 * (255 - r) * (255 - or)) / 255;
      g = g < 128 ? (2 * g * og) / 255 : 255 - (2 * (255 - g) * (255 - og)) / 255;
      b = b < 128 ? (2 * b * ob) / 255 : 255 - (2 * (255 - b) * (255 - ob)) / 255;
      break;
    case 'darken':
      r = Math.min(r, or);
      g = Math.min(g, og);
      b = Math.min(b, ob);
      break;
    case 'lighten':
      r = Math.max(r, or);
      g = Math.max(g, og);
      b = Math.max(b, ob);
      break;
    case 'color-dodge':
      r = or === 255 ? 255 : Math.min(255, (r * 255) / (255 - or));
      g = og === 255 ? 255 : Math.min(255, (g * 255) / (255 - og));
      b = ob === 255 ? 255 : Math.min(255, (b * 255) / (255 - ob));
      break;
    case 'color-burn':
      r = or === 0 ? 0 : Math.max(0, 255 - ((255 - r) * 255) / or);
      g = og === 0 ? 0 : Math.max(0, 255 - ((255 - g) * 255) / og);
      b = ob === 0 ? 0 : Math.max(0, 255 - ((255 - b) * 255) / ob);
      break;
    case 'hard-light':
      r = or < 128 ? (2 * r * or) / 255 : 255 - (2 * (255 - r) * (255 - or)) / 255;
      g = og < 128 ? (2 * g * og) / 255 : 255 - (2 * (255 - g) * (255 - og)) / 255;
      b = ob < 128 ? (2 * b * ob) / 255 : 255 - (2 * (255 - b) * (255 - ob)) / 255;
      break;
    case 'soft-light':
      r = or < 128 ? 2 * ((r / 255) * (or / 255) + (r / 255) * (1 - or / 255)) * 255 : 255 - 2 * (1 - r / 255) * (1 - or / 255) * 255;
      g = og < 128 ? 2 * ((g / 255) * (og / 255) + (g / 255) * (1 - og / 255)) * 255 : 255 - 2 * (1 - g / 255) * (1 - og / 255) * 255;
      b = ob < 128 ? 2 * ((b / 255) * (ob / 255) + (b / 255) * (1 - ob / 255)) * 255 : 255 - 2 * (1 - b / 255) * (1 - ob / 255) * 255;
      break;
    case 'difference':
      r = Math.abs(r - or);
      g = Math.abs(g - og);
      b = Math.abs(b - ob);
      break;
    case 'exclusion':
      r = r + or - (2 * r * or) / 255;
      g = g + og - (2 * g * og) / 255;
      b = b + ob - (2 * b * ob) / 255;
      break;
    case 'normal':
    default:
      r = or;
      g = og;
      b = ob;
      break;
  }
  
  // Apply opacity
  r = baseRgb.r * (1 - opacity) + r * opacity;
  g = baseRgb.g * (1 - opacity) + g * opacity;
  b = baseRgb.b * (1 - opacity) + b * opacity;
  
  return rgbToHex(r, g, b);
}

@Injectable({ providedIn: 'root' })
export class PixelArtService {
  // Canvas dimensions
  width = signal(32);
  height = signal(32);

  // Layer management
  layers = signal<Layer[]>([]);
  activeLayerId = signal<string>('');

  // Tool & color
  activeTool = signal<Tool>('pencil');
  private _activeColor = signal<string>('#ffffff');
  
  get activeColor() {
    return this._activeColor;
  }
  
  setActiveColor(color: string) {
    this._activeColor.set(color);
    this.addToColorHistory(color);
  }

  // View
  zoom = signal<number>(10);
  pan = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  showGrid = signal<boolean>(false);

  // Brush size (1, 3, or 5) — applies to pencil/eraser/rectangle outline
  brushSize = signal<number>(1);

  // History
  private undoStack: CanvasSnapshot[] = [];
  private redoStack: CanvasSnapshot[] = [];
  private maxHistorySize = 50;
  private isRestoring = false;

  // Selection clipboard
  private clipboard: { pixels: string[][]; width: number; height: number } | null = null;

  // Computed
  activeLayer = computed(() => {
    const id = this.activeLayerId();
    return this.layers().find(l => l.id === id) || null;
  });

  mergedPixels = computed(() => {
    return mergeLayers(this.layers(), this.width(), this.height());
  });

  canUndo = computed(() => this.undoStack.length > 0);
  canRedo = computed(() => this.redoStack.length > 0);

  constructor() {
    this.initializeCanvas();
    effect(() => {
      if (!this.isRestoring && this.layers().length > 0) {
        this.saveSnapshot();
      }
    });
  }

  private initializeCanvas() {
    const initialLayer = createEmptyLayer(this.width(), this.height(), 'Layer 1');
    this.layers.set([initialLayer]);
    this.activeLayerId.set(initialLayer.id);
  }

  // Canvas size management
  setCanvasSize(width: number, height: number) {
    this.saveSnapshot();
    const newLayers = this.layers().map(layer => ({
      ...layer,
      pixels: Array(height).fill(null).map((_, y) =>
        Array(width).fill(null).map((_, x) =>
          layer.pixels[y]?.[x] ?? 'transparent'
        )
      ),
    }));
    this.layers.set(newLayers);
    this.width.set(width);
    this.height.set(height);
  }

  // Layer management
  addLayer(name?: string) {
    this.saveSnapshot();
    const newLayer = createEmptyLayer(this.width(), this.height(), name || `Layer ${this.layers().length + 1}`);
    this.layers.update(layers => [...layers, newLayer]);
    this.activeLayerId.set(newLayer.id);
  }

  deleteLayer(id: string) {
    if (this.layers().length <= 1) return; // Prevent deleting last layer
    this.saveSnapshot();
    const layers = this.layers().filter(l => l.id !== id);
    this.layers.set(layers);
    if (this.activeLayerId() === id) {
      this.activeLayerId.set(layers[layers.length - 1]?.id || '');
    }
  }

  setActiveLayer(id: string) {
    this.activeLayerId.set(id);
  }

  reorderLayer(fromIndex: number, toIndex: number) {
    this.saveSnapshot();
    const layers = [...this.layers()];
    const [removed] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, removed);
    this.layers.set(layers);
  }

  toggleLayerVisibility(id: string) {
    this.saveSnapshot();
    this.layers.update(layers =>
      layers.map(l => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  }

  setLayerOpacity(id: string, opacity: number) {
    this.saveSnapshot();
    this.layers.update(layers =>
      layers.map(l => (l.id === id ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l))
    );
  }

  setLayerBlendMode(id: string, blendMode: BlendMode) {
    this.saveSnapshot();
    this.layers.update(layers =>
      layers.map(l => (l.id === id ? { ...l, blendMode } : l))
    );
  }

  duplicateLayer(id: string) {
    this.saveSnapshot();
    const layer = this.layers().find(l => l.id === id);
    if (!layer) return;
    const newLayer = cloneLayer(layer);
    newLayer.id = generateId();
    newLayer.name = `${layer.name} copy`;
    const index = this.layers().findIndex(l => l.id === id);
    this.layers.update(layers => {
      const newLayers = [...layers];
      newLayers.splice(index + 1, 0, newLayer);
      return newLayers;
    });
    this.activeLayerId.set(newLayer.id);
  }

  clearActiveLayer() {
    const activeLayer = this.activeLayer();
    if (!activeLayer) return;
    this.saveSnapshot();
    this.layers.update(layers =>
      layers.map(l =>
        l.id === activeLayer.id
          ? { ...l, pixels: Array(this.height()).fill(null).map(() => Array(this.width()).fill('transparent')) }
          : l
      )
    );
  }

  // Tool operations
  private saveSnapshot() {
    if (this.isRestoring) return;
    this.undoStack.push({
      layers: cloneLayers(this.layers()),
      activeLayerId: this.activeLayerId(),
    });
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  clearCanvas() {
    this.saveSnapshot();
    this.layers.update(layers =>
      layers.map(l => ({
        ...l,
        pixels: Array(this.height()).fill(null).map(() => Array(this.width()).fill('transparent'))
      }))
    );
  }

  undo() {
    if (this.undoStack.length === 0) return;
    this.isRestoring = true;
    const snapshot = this.undoStack.pop()!;
    this.redoStack.push({
      layers: cloneLayers(this.layers()),
      activeLayerId: this.activeLayerId(),
    });
    this.layers.set(snapshot.layers);
    this.activeLayerId.set(snapshot.activeLayerId);
    this.isRestoring = false;
  }

  redo() {
    if (this.redoStack.length === 0) return;
    this.isRestoring = true;
    const snapshot = this.redoStack.pop()!;
    this.undoStack.push({
      layers: cloneLayers(this.layers()),
      activeLayerId: this.activeLayerId(),
    });
    this.layers.set(snapshot.layers);
    this.activeLayerId.set(snapshot.activeLayerId);
    this.isRestoring = false;
  }

  // Drawing operations
  drawPixel(x: number, y: number, color: string) {
    const layer = this.activeLayer();
    if (!layer || !layer.visible) return;
    if (x < 0 || y < 0 || x >= this.width() || y >= this.height()) return;
    this.saveSnapshot();
    this.layers.update(layers =>
      layers.map(l =>
        l.id === layer.id
          ? { ...l, pixels: l.pixels.map((row, ry) => (ry === y ? row.map((c, rx) => (rx === x ? color : c)) : row)) }
          : l
      )
    );
  }

  erasePixel(x: number, y: number) {
    this.drawPixel(x, y, 'transparent');
  }

  // Stamp a square brush of side `size` centered on (x, y). Used by pencil/eraser.
  drawBrush(x: number, y: number, size: number, color: string) {
    if (size <= 1) {
      this.drawPixel(x, y, color);
      return;
    }
    const half = Math.floor(size / 2);
    const w = this.width();
    const h = this.height();
    const layer = this.activeLayer();
    if (!layer || !layer.visible) return;
    this.saveSnapshot();
    const startX = Math.max(0, x - half);
    const startY = Math.max(0, y - half);
    const endX = Math.min(w - 1, x + (size - 1 - half));
    const endY = Math.min(h - 1, y + (size - 1 - half));
    this.layers.update(layers =>
      layers.map(l => {
        if (l.id !== layer.id) return l;
        const pixels: string[][] = l.pixels.map((row: string[]) => [...row]);
        for (let yy = startY; yy <= endY; yy++) {
          for (let xx = startX; xx <= endX; xx++) {
            pixels[yy][xx] = color;
          }
        }
        return { ...l, pixels };
      })
    );
  }

  // Bresenham line — draws a straight line from (x0,y0) to (x1,y1)
  drawLine(x0: number, y0: number, x1: number, y1: number, color: string) {
    const layer = this.activeLayer();
    if (!layer || !layer.visible) return;
    const w = this.width();
    const h = this.height();
    if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h) return;
    this.saveSnapshot();

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;

    this.layers.update(layers => {
      const newLayers = layers.map(l => {
        if (l.id !== layer.id) return l;
        // Deep clone the pixels grid so we can mutate safely
        const pixels = l.pixels.map(row => [...row]);
        while (true) {
          if (x >= 0 && y >= 0 && x < w && y < h) {
            pixels[y][x] = color;
          }
          if (x === x1 && y === y1) break;
          const e2 = 2 * err;
          if (e2 > -dy) { err -= dy; x += sx; }
          if (e2 < dx) { err += dx; y += sy; }
        }
        return { ...l, pixels };
      });
      return newLayers;
    });
  }

  // Hollow rectangle outline (Bresenham); filled when filled=true
  drawRectangle(x0: number, y0: number, x1: number, y1: number, color: string, filled = false) {
    const layer = this.activeLayer();
    if (!layer || !layer.visible) return;
    const w = this.width();
    const h = this.height();
    if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h) return;
    this.saveSnapshot();

    const minX = Math.max(0, Math.min(x0, x1));
    const maxX = Math.min(w - 1, Math.max(x0, x1));
    const minY = Math.max(0, Math.min(y0, y1));
    const maxY = Math.min(h - 1, Math.max(y0, y1));

    this.layers.update(layers => {
      const newLayers = layers.map(l => {
        if (l.id !== layer.id) return l;
        const pixels = l.pixels.map(row => [...row]);
        if (filled) {
          for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
              pixels[y][x] = color;
            }
          }
        } else {
          // Hollow outline using Bresenham for each edge
          const drawLineLocal = (ax: number, ay: number, bx: number, by: number) => {
            const dx = Math.abs(bx - ax);
            const dy = Math.abs(by - ay);
            const sx = ax < bx ? 1 : -1;
            const sy = ay < by ? 1 : -1;
            let err = dx - dy;
            let x = ax;
            let y = ay;
            while (true) {
              if (x >= 0 && y >= 0 && x < w && y < h) pixels[y][x] = color;
              if (x === bx && y === by) break;
              const e2 = 2 * err;
              if (e2 > -dy) { err -= dy; x += sx; }
              if (e2 < dx) { err += dx; y += sy; }
            }
          };
          drawLineLocal(minX, minY, maxX, minY);
          drawLineLocal(maxX, minY, maxX, maxY);
          drawLineLocal(maxX, maxY, minX, maxY);
          drawLineLocal(minX, maxY, minX, minY);
        }
        return { ...l, pixels };
      });
      return newLayers;
    });
  }

  // Merge layer B into layer A in-place (A is below B). Result sits at A's index.
  mergeLayerDown(targetId: string) {
    const layers = this.layers();
    const index = layers.findIndex(l => l.id === targetId);
    if (index <= 0) return; // need a layer below to merge into
    const below = layers[index - 1];
    const above = layers[index];
    if (!below || !above) return;
    this.saveSnapshot();
    const w = this.width();
    const h = this.height();
    const mergedPixels = below.pixels.map((row, y) =>
      row.map((c, x) => (above.pixels[y]?.[x] && above.pixels[y][x] !== 'transparent' ? above.pixels[y][x] : c))
    );
    const newLayers = layers
      .map((l, i) => (i === index - 1 ? { ...l, pixels: mergedPixels, name: below.name + '+' + above.name } : l))
      .filter((_, i) => i !== index);
    this.layers.set(newLayers);
    this.activeLayerId.set(below.id);
  }

  // Flood fill
  floodFill(startX: number, startY: number, fillColor: string) {
    const layer = this.activeLayer();
    if (!layer || !layer.visible) return;
    if (startX < 0 || startY < 0 || startX >= this.width() || startY >= this.height()) return;

    const targetColor = layer.pixels[startY][startX];
    if (targetColor === fillColor) return;

    this.saveSnapshot();

    const visited = new Set<string>();
    const stack = [{ x: startX, y: startY }];
    const newPixels = layer.pixels.map(row => [...row]);

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (x < 0 || y < 0 || x >= this.width() || y >= this.height()) continue;
      if (newPixels[y][x] !== targetColor) continue;

      newPixels[y][x] = fillColor;

      stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
    }

    this.layers.update(layers =>
      layers.map(l => (l.id === layer.id ? { ...l, pixels: newPixels } : l))
    );
  }

  // Eyedropper
  pickColor(x: number, y: number): string | null {
    if (x < 0 || y < 0 || x >= this.width() || y >= this.height()) return null;
    return this.mergedPixels()[y][x] || null;
  }

  // View operations
  setZoom(zoom: number) {
    this.zoom.set(Math.max(1, Math.min(32, zoom)));
  }

  zoomIn() {
    this.setZoom(this.zoom() + 1);
  }

  zoomOut() {
    this.setZoom(this.zoom() - 1);
  }

  resetZoom() {
    this.setZoom(10);
  }

  setPan(pan: { x: number; y: number }) {
    this.pan.set(pan);
  }

  panBy(dx: number, dy: number) {
    this.pan.update(p => ({ x: p.x + dx, y: p.y + dy }));
  }

  resetPan() {
    this.pan.set({ x: 0, y: 0 });
  }

  toggleGrid() {
    this.showGrid.update(v => !v);
  }

  // Color palette
  defaultColors = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#ff8800', '#88ff00', '#0088ff', '#ff0088', '#888888', '#444444', '#cccccc', '#884400',
  ];

  extendedColors: string[] = [];

  // Color history (recently used colors)
  private colorHistory: string[] = [];
  private maxColorHistorySize = 20;

  // Signal for reactive color history display
  colorHistorySignal = signal<string[]>([]);

  generateExtendedPalette() {
    if (this.extendedColors.length > 0) return this.extendedColors;
    const colors: string[] = [];
    for (let r = 0; r < 6; r++) {
      for (let g = 0; g < 6; g++) {
        for (let b = 0; b < 6; b++) {
          const hex = '#' +
            (r * 51).toString(16).padStart(2, '0') +
            (g * 51).toString(16).padStart(2, '0') +
            (b * 51).toString(16).padStart(2, '0');
          colors.push(hex);
        }
      }
    }
    // Add grayscale
    for (let i = 0; i < 256; i += 10) {
      const hex = '#' + i.toString(16).padStart(2, '0').repeat(3);
      colors.push(hex);
    }
    this.extendedColors = [...new Set([...this.defaultColors, ...colors])];
    return this.extendedColors;
  }

  // Color history management
  private addToColorHistory(color: string) {
    if (!color || color === 'transparent') return;
    // Remove if already exists
    this.colorHistory = this.colorHistory.filter(c => c !== color);
    // Add to front
    this.colorHistory.unshift(color);
    // Trim to max size
    if (this.colorHistory.length > this.maxColorHistorySize) {
      this.colorHistory = this.colorHistory.slice(0, this.maxColorHistorySize);
    }
    // Update signal
    this.colorHistorySignal.set([...this.colorHistory]);
  }

  getColorHistory(): string[] {
    return this.colorHistorySignal();
  }

  // Export data
  getExportData() {
    return {
      width: this.width(),
      height: this.height(),
      layers: cloneLayers(this.layers()),
      activeLayerId: this.activeLayerId(),
    };
  }

  loadExportData(data: any) {
    this.width.set(data.width);
    this.height.set(data.height);
    this.layers.set(data.layers.map((l: any) => ({ ...l, pixels: l.pixels.map((row: any) => [...row]) })));
    this.activeLayerId.set(data.activeLayerId);
    this.undoStack = [];
    this.redoStack = [];
  }

  // Selection operations
  private getSelectionRect(selection: { x: number; y: number; width: number; height: number } | null) {
    if (!selection) return null;
    return {
      x: Math.max(0, Math.min(selection.x, this.width() - 1)),
      y: Math.max(0, Math.min(selection.y, this.height() - 1)),
      width: Math.max(0, Math.min(selection.width, this.width() - selection.x)),
      height: Math.max(0, Math.min(selection.height, this.height() - selection.y)),
    };
  }

  copySelection(selection: { x: number; y: number; width: number; height: number } | null) {
    const rect = this.getSelectionRect(selection);
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const layer = this.activeLayer();
    if (!layer) return;
    const pixels: string[][] = [];
    for (let y = 0; y < rect.height; y++) {
      const row: string[] = [];
      for (let x = 0; x < rect.width; x++) {
        row.push(layer.pixels[rect.y + y][rect.x + x]);
      }
      pixels.push(row);
    }
    this.clipboard = { pixels, width: rect.width, height: rect.height };
  }

  cutSelection(selection: { x: number; y: number; width: number; height: number } | null) {
    this.copySelection(selection);
    const rect = this.getSelectionRect(selection);
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const layer = this.activeLayer();
    if (!layer) return;
    this.saveSnapshot();
    const newPixels = layer.pixels.map((row, ry) =>
      row.map((c, rx) => (rx >= rect.x && rx < rect.x + rect.width && ry >= rect.y && ry < rect.y + rect.height ? 'transparent' : c))
    );
    this.layers.update(layers =>
      layers.map(l => (l.id === layer.id ? { ...l, pixels: newPixels } : l))
    );
  }

  pasteSelection(selection: { x: number; y: number; width: number; height: number } | null) {
    if (!this.clipboard) return;
    const layer = this.activeLayer();
    if (!layer || !layer.visible) return;
    const rect = this.getSelectionRect(selection);
    const pasteX = rect ? rect.x : 0;
    const pasteY = rect ? rect.y : 0;
    this.saveSnapshot();
    const newPixels = layer.pixels.map((row, ry) =>
      row.map((c, rx) => {
        const sy = ry - pasteY;
        const sx = rx - pasteX;
        if (sy >= 0 && sy < this.clipboard!.height && sx >= 0 && sx < this.clipboard!.width) {
          const clipColor = this.clipboard!.pixels[sy][sx];
          return clipColor !== 'transparent' ? clipColor : c;
        }
        return c;
      })
    );
    this.layers.update(layers =>
      layers.map(l => (l.id === layer.id ? { ...l, pixels: newPixels } : l))
    );
  }

  deleteSelection(selection: { x: number; y: number; width: number; height: number } | null) {
    const rect = this.getSelectionRect(selection);
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const layer = this.activeLayer();
    if (!layer) return;
    this.saveSnapshot();
    const newPixels = layer.pixels.map((row, ry) =>
      row.map((c, rx) => (rx >= rect.x && rx < rect.x + rect.width && ry >= rect.y && ry < rect.y + rect.height ? 'transparent' : c))
    );
    this.layers.update(layers =>
      layers.map(l => (l.id === layer.id ? { ...l, pixels: newPixels } : l))
    );
  }

  moveSelection(selection: { x: number; y: number; width: number; height: number } | null, dx: number, dy: number) {
    const rect = this.getSelectionRect(selection);
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const layer = this.activeLayer();
    if (!layer || !layer.visible) return;
    this.saveSnapshot();
    // Extract selection pixels
    const selectionPixels: string[][] = [];
    for (let y = 0; y < rect.height; y++) {
      const row: string[] = [];
      for (let x = 0; x < rect.width; x++) {
        row.push(layer.pixels[rect.y + y][rect.x + x]);
      }
      selectionPixels.push(row);
    }
    // Clear original area
    const clearedPixels = layer.pixels.map((row, ry) =>
      row.map((c, rx) => (rx >= rect.x && rx < rect.x + rect.width && ry >= rect.y && ry < rect.y + rect.height ? 'transparent' : c))
    );
    // Paste at new position
    const newPixels = clearedPixels.map((row, ry) =>
      row.map((c, rx) => {
        const sy = ry - (rect.y + dy);
        const sx = rx - (rect.x + dx);
        if (sy >= 0 && sy < rect.height && sx >= 0 && sx < rect.width) {
          const clipColor = selectionPixels[sy][sx];
          return clipColor !== 'transparent' ? clipColor : c;
        }
        return c;
      })
    );
    this.layers.update(layers =>
      layers.map(l => (l.id === layer.id ? { ...l, pixels: newPixels } : l))
    );
  }

  // Canvas resize
  resizeCanvas(newWidth: number, newHeight: number) {
    if (newWidth < 1 || newHeight < 1 || newWidth > 1024 || newHeight > 1024) return;
    this.saveSnapshot();
    this.width.set(newWidth);
    this.height.set(newHeight);
    this.layers.update(layers =>
      layers.map(l => ({
        ...l,
        pixels: Array(newHeight).fill(null).map((_, y) =>
          Array(newWidth).fill(null).map((_, x) =>
            l.pixels[y]?.[x] ?? 'transparent'
          )
        ),
      }))
    );
    this.redoStack = [];
  }

  resizeCanvasPrompt() {
    const w = prompt('Canvas width (1-1024):', this.width().toString());
    if (w === null) return;
    const h = prompt('Canvas height (1-1024):', this.height().toString());
    if (h === null) return;
    const width = parseInt(w, 10);
    const height = parseInt(h, 10);
    if (!isNaN(width) && !isNaN(height)) {
      this.resizeCanvas(width, height);
    }
  }

  // ----- Brush size -----
  setBrushSize(size: number) {
    // Snap to nearest supported size: 1, 3, 5
    const supported = [1, 3, 5];
    const nearest = supported.reduce((prev, curr) =>
      Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
    );
    this.brushSize.set(nearest);
  }

  cycleBrushSize() {
    const order = [1, 3, 5];
    const idx = order.indexOf(this.brushSize());
    this.brushSize.set(order[(idx + 1) % order.length]);
  }

  // ----- Flip selection (horizontal / vertical) -----
  flipSelectionHorizontal(selection: { x: number; y: number; width: number; height: number } | null) {
    this.flipSelection(selection, 'horizontal');
  }

  flipSelectionVertical(selection: { x: number; y: number; width: number; height: number } | null) {
    this.flipSelection(selection, 'vertical');
  }

  private flipSelection(
    selection: { x: number; y: number; width: number; height: number } | null,
    axis: 'horizontal' | 'vertical'
  ) {
    const rect = this.getSelectionRect(selection);
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const layer = this.activeLayer();
    if (!layer) return;
    this.saveSnapshot();
    const newPixels: string[][] = layer.pixels.map((row: string[]) => [...row]);
    for (let y = 0; y < rect.height; y++) {
      for (let x = 0; x < rect.width; x++) {
        const srcX = axis === 'horizontal' ? rect.width - 1 - x : x;
        const srcY = axis === 'vertical' ? rect.height - 1 - y : y;
        newPixels[rect.y + y][rect.x + x] = layer.pixels[rect.y + srcY][rect.x + srcX];
      }
    }
    this.layers.update(layers =>
      layers.map(l => (l.id === layer.id ? { ...l, pixels: newPixels } : l))
    );
  }

  // ----- Project save / load (JSON) -----
  saveProjectToJSON(): string {
    const data = {
      version: 1,
      width: this.width(),
      height: this.height(),
      layers: cloneLayers(this.layers()),
      activeLayerId: this.activeLayerId(),
    };
    return JSON.stringify(data);
  }

  loadProjectFromJSON(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (!data || typeof data.width !== 'number' || !Array.isArray(data.layers)) return false;
      this.width.set(data.width);
      this.height.set(data.height);
      this.layers.set(
        data.layers.map((l: any) => ({
          ...l,
          pixels: l.pixels.map((row: any) => [...row]),
        }))
      );
      this.activeLayerId.set(data.activeLayerId || data.layers[0]?.id || '');
      this.undoStack = [];
      this.redoStack = [];
      return true;
    } catch {
      return false;
    }
  }

  saveProjectPrompt() {
    const json = this.saveProjectToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixelcraft-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  loadProjectPrompt() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const ok = this.loadProjectFromJSON(reader.result as string);
        if (!ok) alert('Failed to load project: invalid JSON or schema.');
      };
      reader.readAsText(file);
    };
    input.click();
  }
}