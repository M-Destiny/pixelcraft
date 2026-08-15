import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PixelArtService } from '../../services/pixel-art.service';
import { Tool } from '../../models/pixel';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2 px-4 py-2 bg-[#16213e] border-b border-[#0f3460]">
      <span class="font-bold text-lg text-blue-400 mr-4">PixelCraft</span>
      @for (tool of tools; track tool.id) {
        <button
          (click)="svc.activeTool.set(tool.id)"
          [class.bg-blue-600]="svc.activeTool() === tool.id"
          class="px-3 py-1.5 rounded text-sm font-medium hover:bg-[#0f3460] transition-colors">
          {{ tool.label }}
        </button>
      }
      <div class="ml-auto flex items-center gap-2">
        <span class="text-sm text-gray-400">Zoom:</span>
        <input type="range" min="4" max="20" [value]="svc.zoom()"
          (input)="svc.zoom.set(+$any($event.target).value)"
          class="w-24 accent-blue-500" />
        <span class="text-sm">{{ svc.zoom() }}x</span>
      </div>
    </div>
  `,
})
export class ToolbarComponent {
  svc = inject(PixelArtService);
  tools: { id: Tool; label: string }[] = [
    { id: 'pencil', label: 'Pencil' },
    { id: 'eraser', label: 'Eraser' },
    { id: 'fill', label: 'Fill' },
    { id: 'eyedropper', label: 'Pick' },
    { id: 'select', label: 'Select' },
  ];
}
