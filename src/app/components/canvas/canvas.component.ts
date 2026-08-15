import { Component, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PixelArtService } from '../../services/pixel-art.service';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative" [style.transform]="'scale(' + svc.zoom() + ')'" [style.transform-origin]="'center'">
      <canvas
        #canvas
        [width]="svc.art().width"
        [height]="svc.art().height"
        (mousedown)="onMouseDown($event)"
        (mousemove)="onMouseMove($event)"
        (mouseup)="onMouseUp()"
        class="cursor-crosshair border border-gray-600 bg-checkerboard"
        style="image-rendering: pixelated;"
      ></canvas>
    </div>
  `,
})
export class CanvasComponent {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  svc = inject(PixelArtService);
  drawing = false;

  ngAfterViewInit() { this.redraw(); }

  onMouseDown(e: MouseEvent) {
    this.drawing = true;
    this.paint(e);
  }
  onMouseMove(e: MouseEvent) { if (this.drawing) this.paint(e); }
  onMouseUp() { this.drawing = false; }

  private paint(e: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.svc.zoom());
    const y = Math.floor((e.clientY - rect.top) / this.svc.zoom());
    const art = this.svc.art();
    if (x < 0 || y < 0 || x >= art.width || y >= art.height) return;
    const color = this.svc.activeTool() === 'eraser' ? 'transparent' : this.svc.activeColor();
    art.pixels[y][x] = color;
    this.svc.art.set({ ...art });
    this.redraw();
  }

  private redraw() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const art = this.svc.art();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    art.pixels.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      });
    });
  }
}
