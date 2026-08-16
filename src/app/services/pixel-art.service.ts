import { Injectable, signal, computed, effect } from '@angular/core';
import { PixelArt, Layer, Tool } from '../models/pixel';

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
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = layer.pixels[y][x];
        if (color !== 'transparent') {
          merged[y][x] = color;
        }
      }
    }
  }
  return merged;
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
  activeColor = signal<string>('#ffffff');

  // View
  zoom = signal<number>(10);
  pan = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  showGrid = signal<boolean>(false);

  // History
  private undoStack: CanvasSnapshot[] = [];
  private redoStack: CanvasSnapshot[] = [];
  private maxHistorySize = 50;
  private isRestoring = false;

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
}