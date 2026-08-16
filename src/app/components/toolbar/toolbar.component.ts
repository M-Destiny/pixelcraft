import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PixelArtService } from '../../services/pixel-art.service';
import { Tool } from '../../models/pixel';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] border-b border-[#0f3460]">
      <span class="font-bold text-lg text-blue-400 mr-4">PixelCraft</span>
      @for (tool of tools; track tool.id) {
        <button
          (click)="svc.activeTool.set(tool.id)"
          [class.bg-blue-600]="svc.activeTool() === tool.id"
          class="px-3 py-1.5 rounded text-sm font-medium hover:bg-[#0f3460] transition-colors"
          [title]="tool.label + (tool.shortcut ? ' (' + tool.shortcut + ')' : '')">
          {{ tool.label }}<span class="ml-1 text-xs text-gray-400">{{ tool.shortcut ? '[' + tool.shortcut + ']' : '' }}</span>
        </button>
      }
      <div class="w-px h-6 bg-gray-600 mx-2"></div>
      <button (click)="clearCanvas()" class="px-3 py-1.5 rounded text-sm font-medium hover:bg-red-600 hover:text-white transition-colors" title="Clear canvas (Del)">
        Clear <span class="ml-1 text-xs text-gray-400">[Del]</span>
      </button>
      <div class="w-px h-6 bg-gray-600 mx-2"></div>
      <button (click)="resizeCanvas()" class="px-3 py-1.5 rounded text-sm font-medium hover:bg-[#0f3460] transition-colors" title="Resize canvas (R)">
        Resize <span class="ml-1 text-xs text-gray-400">[R]</span>
      </button>
      <div class="w-px h-6 bg-gray-600 mx-2"></div>
      <button (click)="resetZoom()" class="px-3 py-1.5 rounded text-sm font-medium hover:bg-[#0f3460] transition-colors" title="Reset zoom (Ctrl+0)">
        Reset Zoom <span class="ml-1 text-xs text-gray-400">[Ctrl+0]</span>
      </button>
      <div class="ml-auto flex items-center gap-2">
        <span class="text-sm text-gray-400">Zoom:</span>
        <input type="range" min="4" max="32" [value]="svc.zoom()" (input)="svc.setZoom($any($event.target).value)" class="w-32 accent-blue-500" />
        <span class="text-sm text-gray-300 w-10">{{ svc.zoom() }}x</span>
        <button (click)="svc.zoomOut()" class="px-2 py-1 rounded bg-[#0f3460] hover:bg-blue-600 text-sm transition-colors" title="Zoom out (-)">−</button>
        <button (click)="svc.zoomIn()" class="px-2 py-1 rounded bg-[#0f3460] hover:bg-blue-600 text-sm transition-colors" title="Zoom in (+)">+</button>
      </div>
    </div>
  `,
})
export class ToolbarComponent {
  svc = inject(PixelArtService);
  tools: { id: Tool; label: string; shortcut: string }[] = [
    { id: 'pencil', label: 'Pencil', shortcut: 'P' },
    { id: 'eraser', label: 'Eraser', shortcut: 'E' },
    { id: 'fill', label: 'Fill', shortcut: 'F' },
    { id: 'eyedropper', label: 'Pick', shortcut: 'I' },
    { id: 'rectangle', label: 'Rect', shortcut: 'R' },
    { id: 'select', label: 'Select', shortcut: 'S' },
    { id: 'pan', label: 'Pan', shortcut: 'H' },
  ];

  clearCanvas() {
    if (confirm('Clear all layers?')) {
      this.svc.clearCanvas();
    }
  }

  resizeCanvas() {
    const w = prompt('Canvas width (1-1024):', this.svc.width().toString());
    if (w === null) return;
    const h = prompt('Canvas height (1-1024):', this.svc.height().toString());
    if (h === null) return;
    const width = parseInt(w, 10);
    const height = parseInt(h, 10);
    if (!isNaN(width) && !isNaN(height)) {
      this.svc.resizeCanvas(width, height);
    }
  }

  resetZoom() {
    this.svc.resetZoom();
  }
}
