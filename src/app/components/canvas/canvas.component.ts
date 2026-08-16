import { Component, inject, ElementRef, ViewChild, HostListener, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PixelArtService } from '../../services/pixel-art.service';
import { Tool } from '../../models/pixel';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative" [style.transform]="'translate(' + svc.pan().x + 'px, ' + svc.pan().y + 'px) scale(' + svc.zoom() / 10 + ')'">
      <canvas
        #canvas
        [width]="svc.width()"
        [height]="svc.height()"
        (mousedown)="onMouseDown($event)"
        (mousemove)="onMouseMove($event)"
        (mouseup)="onMouseUp()"
        (mouseleave)="onMouseUp()"
        (wheel)="onWheel($event)"
        (touchstart)="onTouchStart($event)"
        (touchmove)="onTouchMove($event)"
        (touchend)="onTouchEnd($event)"
        (touchcancel)="onTouchEnd($event)"
        [style.cursor]="cursorStyle()"
        class="border border-gray-600 bg-checkerboard"
        style="image-rendering: pixelated; touch-action: none;"
      ></canvas>
      @if (svc.showGrid()) {
        <div class="absolute inset-0 pointer-events-none bg-grid-pattern"></div>
      }
      @if (selectionBox()) {
        <div
          class="absolute border-2 border-blue-400 bg-blue-400/10 pointer-events-none"
          [style.left.px]="selectionBox()!.x"
          [style.top.px]="selectionBox()!.y"
          [style.width.px]="selectionBox()!.width"
          [style.height.px]="selectionBox()!.height"
        ></div>
      }
      @if (lineAnchor() && linePreview()) {
        <div class="absolute pointer-events-none"
             [style.left.px]="lineAnchor()!.x"
             [style.top.px]="lineAnchor()!.y"
             [style.width.px]="linePreview()!.x - lineAnchor()!.x"
             [style.height.px]="linePreview()!.y - lineAnchor()!.y"
             class="border border-blue-400 border-dashed opacity-50"></div>
      }
      @if (rectAnchor && rectPreview()) {
        <div class="absolute pointer-events-none border border-blue-400 border-dashed opacity-50"
             [style.left.px]="rectAnchor.x"
             [style.top.px]="rectAnchor.y"
             [style.width.px]="rectPreview()!.x - rectAnchor.x"
             [style.height.px]="rectPreview()!.y - rectAnchor.y"></div>
      }
    </div>
  `,
})
export class CanvasComponent {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  svc = inject(PixelArtService);

  drawing = false;
  panning = false;
  selecting = false;
  lastPanPoint = { x: 0, y: 0 };
  selectionStart = { x: 0, y: 0 };
  selectionBox = signal<{ x: number; y: number; width: number; height: number } | null>(null);

  // Line tool: preview the line from the last anchor to current pointer
  lineAnchor = signal<{ x: number; y: number } | null>(null);
  linePreview = signal<{ x: number; y: number } | null>(null);

  // Rectangle tool: anchor + live preview
  rectAnchor: { x: number; y: number } | null = null;
  rectPreview = signal<{ x: number; y: number } | null>(null);

  cursorStyle = signal<string>('crosshair');

  constructor() {
    // Auto-redraw whenever the merged pixel grid or pan/zoom changes
    effect(() => {
      this.svc.mergedPixels();
      this.svc.pan();
      this.svc.zoom();
      this.svc.showGrid();
      this.redraw();
    });
  }

  ngAfterViewInit() {
    this.redraw();
    this.updateCursor();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement) return;

    // Check for modifier keys first
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    switch (e.key.toLowerCase()) {
      case 'p': this.svc.activeTool.set('pencil'); break;
      case 'e': this.svc.activeTool.set('eraser'); break;
      case 'f': this.svc.activeTool.set('fill'); break;
      case 'i': this.svc.activeTool.set('eyedropper'); break;
      case 'r':
        // R toggles rectangle tool (avoid conflict with resizeCanvasPrompt)
        if (!isCtrlOrMeta) this.svc.activeTool.set('rectangle');
        else this.svc.resizeCanvasPrompt();
        break;
      case 's': this.svc.activeTool.set('select'); break;
      case 'h': this.svc.activeTool.set('pan'); break;
      case 'v':
        if (isCtrlOrMeta) this.svc.pasteSelection(this.selectionBox());
        else this.svc.activeTool.set('select');
        break;
      case 'z':
        if (isCtrlOrMeta) {
          if (e.shiftKey) this.svc.redo();
          else this.svc.undo();
        } else {
          this.svc.zoomIn();
        }
        break;
      case 'y':
        if (isCtrlOrMeta) this.svc.redo();
        break;
      case 'x':
        if (isCtrlOrMeta) this.svc.cutSelection(this.selectionBox());
        else this.svc.zoomOut();
        break;
      case '0': if (isCtrlOrMeta) this.svc.resetZoom(); break;
      case '+': case '=': this.svc.zoomIn(); break;
      case '-': this.svc.zoomOut(); break;
      case 'escape': this.clearSelection(); break;
      case 'delete':
        if (this.selectionBox()) this.svc.deleteSelection(this.selectionBox());
        else this.svc.clearCanvas();
        break;
      case 'arrowup':
        if (this.selectionBox()) this.svc.moveSelection(this.selectionBox(), 0, -1);
        break;
      case 'arrowdown':
        if (this.selectionBox()) this.svc.moveSelection(this.selectionBox(), 0, 1);
        break;
      case 'arrowleft':
        if (this.selectionBox()) this.svc.moveSelection(this.selectionBox(), -1, 0);
        break;
      case 'arrowright':
        if (this.selectionBox()) this.svc.moveSelection(this.selectionBox(), 1, 0);
        break;
      case ' ':
        if (this.svc.activeTool() !== 'pan') {
          this.svc.activeTool.set('pan');
        }
        break;
    }
    this.updateCursor();
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent) {
    if (e.key === ' ' && this.svc.activeTool() === 'pan') {
      // Could restore previous tool here, but keep pan for now
      this.updateCursor();
    }
  }

  private updateCursor() {
    const tool = this.svc.activeTool();
    const cursors: Record<Tool, string> = {
      pencil: 'crosshair',
      eraser: 'cell',
      fill: 'copy',
      eyedropper: 'copy',
      select: 'crosshair',
      pan: 'grab',
      rectangle: 'crosshair',
    };
    this.cursorStyle.set(cursors[tool] || 'crosshair');
  }

  onMouseDown(e: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - this.svc.pan().x) / (this.svc.zoom() / 10));
    const y = Math.floor((e.clientY - rect.top - this.svc.pan().y) / (this.svc.zoom() / 10));

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      this.panning = true;
      this.lastPanPoint = { x: e.clientX, y: e.clientY };
      this.cursorStyle.set('grabbing');
      return;
    }

    if (e.button !== 0) return;

    const tool = this.svc.activeTool();

    switch (tool) {
      case 'pencil':
      case 'eraser':
        // Shift+drag draws a straight line from anchor to release point
        if (e.shiftKey) {
          this.lineAnchor.set({ x, y });
          this.linePreview.set({ x, y });
        } else {
          this.drawing = true;
          this.paint(e);
        }
        break;
      case 'fill':
        this.floodFill(x, y);
        break;
      case 'eyedropper':
        this.pickColor(x, y);
        break;
      case 'rectangle':
        this.rectAnchor = { x, y };
        this.rectPreview.set({ x, y });
        break;
      case 'select':
        this.selecting = true;
        this.selectionStart = { x, y };
        this.selectionBox.set({ x, y, width: 0, height: 0 });
        break;
      case 'pan':
        this.panning = true;
        this.lastPanPoint = { x: e.clientX, y: e.clientY };
        this.cursorStyle.set('grabbing');
        break;
    }
  }

  onMouseMove(e: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - this.svc.pan().x) / (this.svc.zoom() / 10));
    const y = Math.floor((e.clientY - rect.top - this.svc.pan().y) / (this.svc.zoom() / 10));

    if (this.panning) {
      const dx = e.clientX - this.lastPanPoint.x;
      const dy = e.clientY - this.lastPanPoint.y;
      this.svc.panBy(dx, dy);
      this.lastPanPoint = { x: e.clientX, y: e.clientY };
      return;
    }

    // Live preview of the line while Shift is held
    if (this.lineAnchor() && e.shiftKey) {
      this.linePreview.set({ x, y });
      return;
    }

    if (this.rectAnchor) {
      this.rectPreview.set({ x, y });
      return;
    }

    if (this.selecting) {
      const minX = Math.min(this.selectionStart.x, x);
      const minY = Math.min(this.selectionStart.y, y);
      const maxX = Math.max(this.selectionStart.x, x);
      const maxY = Math.max(this.selectionStart.y, y);
      this.selectionBox.set({
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      });
      return;
    }

    if (this.drawing && (this.svc.activeTool() === 'pencil' || this.svc.activeTool() === 'eraser')) {
      this.paint(e);
    }
  }

  onMouseUp(e?: MouseEvent) {
    // Commit the line tool if we had a shift+drag
    if (this.lineAnchor() && e && e.shiftKey) {
      const canvas = this.canvasRef.nativeElement;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left - this.svc.pan().x) / (this.svc.zoom() / 10));
      const y = Math.floor((e.clientY - rect.top - this.svc.pan().y) / (this.svc.zoom() / 10));
      const anchor = this.lineAnchor()!;
      const color = this.svc.activeTool() === 'eraser' ? 'transparent' : this.svc.activeColor();
      this.svc.drawLine(anchor.x, anchor.y, x, y, color);
    }
    this.lineAnchor.set(null);
    this.linePreview.set(null);

    // Commit the rectangle tool on mouse-up
    if (this.rectAnchor && e) {
      const canvas = this.canvasRef.nativeElement;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left - this.svc.pan().x) / (this.svc.zoom() / 10));
      const y = Math.floor((e.clientY - rect.top - this.svc.pan().y) / (this.svc.zoom() / 10));
      let { x: ax, y: ay } = this.rectAnchor;
      let { x: bx, y: by } = this.rectPreview() ?? { x: ax, y: ay };
      // Hold Shift to constrain to a square
      if (e.shiftKey) {
        const size = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
        const sx = bx >= ax ? 1 : -1;
        const sy = by >= ay ? 1 : -1;
        bx = ax + sx * size;
        by = ay + sy * size;
      }
      const color = this.svc.activeColor();
      this.svc.drawRectangle(ax, ay, bx, by, color, false);
    }
    this.rectAnchor = null;
    this.rectPreview.set(null);

    this.drawing = false;
    this.panning = false;
    this.selecting = false;
    this.clearSelection();
    this.updateCursor();
  }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      if (e.deltaY < 0) this.svc.zoomIn();
      else this.svc.zoomOut();
    } else {
      this.svc.panBy(-e.deltaX, -e.deltaY);
    }
  }

  // Touch handlers — mirrors mouse logic for tablets/phones
  private getTouchPoint(e: TouchEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    const x = Math.floor((touch.clientX - rect.left - this.svc.pan().x) / (this.svc.zoom() / 10));
    const y = Math.floor((touch.clientY - rect.top - this.svc.pan().y) / (this.svc.zoom() / 10));
    return { x, y, clientX: touch.clientX, clientY: touch.clientY };
  }

  onTouchStart(e: TouchEvent) {
    e.preventDefault();
    const tool = this.svc.activeTool();
    const point = this.getTouchPoint(e);

    if (e.touches.length === 2) {
      // Pinch-zoom: store initial distance
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      this.lastPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      return;
    }

    switch (tool) {
      case 'pencil':
      case 'eraser':
        this.drawing = true;
        this.paintTouch(point);
        break;
      case 'fill':
        this.floodFill(point.x, point.y);
        break;
      case 'eyedropper':
        this.pickColor(point.x, point.y);
        break;
      case 'select':
        this.selecting = true;
        this.selectionStart = { x: point.x, y: point.y };
        this.selectionBox.set({ x: point.x, y: point.y, width: 0, height: 0 });
        break;
      case 'pan':
        this.panning = true;
        this.lastPanPoint = { x: point.clientX, y: point.clientY };
        this.cursorStyle.set('grabbing');
        break;
    }
  }

  onTouchMove(e: TouchEvent) {
    e.preventDefault();
    const point = this.getTouchPoint(e);

    if (e.touches.length === 2 && this.lastPinchDist !== null) {
      // Pinch zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / this.lastPinchDist;
      if (ratio > 1.05) this.svc.zoomIn();
      else if (ratio < 0.95) this.svc.zoomOut();
      this.lastPinchDist = dist;
      return;
    }

    if (this.panning) {
      const dx = point.clientX - this.lastPanPoint.x;
      const dy = point.clientY - this.lastPanPoint.y;
      this.svc.panBy(dx, dy);
      this.lastPanPoint = { x: point.clientX, y: point.clientY };
      return;
    }

    if (this.selecting) {
      const minX = Math.min(this.selectionStart.x, point.x);
      const minY = Math.min(this.selectionStart.y, point.y);
      const maxX = Math.max(this.selectionStart.x, point.x);
      const maxY = Math.max(this.selectionStart.y, point.y);
      this.selectionBox.set({ x: minX, y: minY, width: maxX - minX, height: maxY - minY });
      return;
    }

    if (this.drawing && (this.svc.activeTool() === 'pencil' || this.svc.activeTool() === 'eraser')) {
      this.paintTouch(point);
    }
  }

  onTouchEnd(e: TouchEvent) {
    e.preventDefault();
    this.drawing = false;
    this.panning = false;
    this.selecting = false;
    this.lastPinchDist = null;
    this.clearSelection();
    this.updateCursor();
  }

  private lastPinchDist: number | null = null;

  private paintTouch(point: { x: number; y: number }) {
    const color = this.svc.activeTool() === 'eraser' ? 'transparent' : this.svc.activeColor();
    this.svc.drawPixel(point.x, point.y, color);
    this.redraw();
  }

  private paint(e: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - this.svc.pan().x) / (this.svc.zoom() / 10));
    const y = Math.floor((e.clientY - rect.top - this.svc.pan().y) / (this.svc.zoom() / 10));

    const color = this.svc.activeTool() === 'eraser' ? 'transparent' : this.svc.activeColor();
    this.svc.drawPixel(x, y, color);
    this.redraw();
  }

  private floodFill(x: number, y: number) {
    const color = this.svc.activeColor();
    this.svc.floodFill(x, y, color);
    this.redraw();
  }

  private pickColor(x: number, y: number) {
    const color = this.svc.pickColor(x, y);
    if (color && color !== 'transparent') {
      this.svc.activeColor.set(color);
      // Switch back to pencil after picking
      this.svc.activeTool.set('pencil');
      this.updateCursor();
    }
  }

  private clearSelection() {
    this.selectionBox.set(null);
  }

  private redraw() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const pixels = this.svc.mergedPixels();
    const width = this.svc.width();
    const height = this.svc.height();

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Draw checkerboard for transparency
    const patternSize = 8;
    for (let y = 0; y < height; y += patternSize) {
      for (let x = 0; x < width; x += patternSize) {
        const isEven = ((x / patternSize) + (y / patternSize)) % 2 === 0;
        ctx.fillStyle = isEven ? '#888888' : '#666666';
        ctx.fillRect(x, y, patternSize, patternSize);
      }
    }

    // Draw pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = pixels[y][x];
        if (color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }
}