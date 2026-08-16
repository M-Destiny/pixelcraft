import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PixelArtService } from '../../services/pixel-art.service';

@Component({
  selector: 'app-layer-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <p class="text-xs text-gray-400 font-medium">Layers</p>
        <button (click)="addLayer()" class="text-xs text-blue-400 hover:text-blue-300">+ Add</button>
      </div>
      <div class="space-y-1 max-h-64 overflow-y-auto">
        @for (layer of svc.layers(); track layer.id; let i = $index) {
          <div class="flex items-center gap-2 px-2 py-1.5 rounded bg-[#0f3460] text-sm"
               [class.ring-2]="svc.activeLayerId() === layer.id"
               [class.ring-blue-400]="svc.activeLayerId() === layer.id">
            <input type="checkbox"
                   [checked]="layer.visible"
                   (change)="svc.toggleLayerVisibility(layer.id)"
                   class="w-4 h-4 accent-blue-500" />
            <input type="text"
                   [value]="layer.name"
                   (blur)="renameLayer(layer.id, $any($event.target).value)"
                   (keydown.enter)="renameLayer(layer.id, $any($event.target).value)"
                   class="flex-1 bg-transparent border-none text-white text-sm focus:outline-none"
                   title="Layer name" />
            <span class="text-xs text-gray-500 w-10 text-right">{{ Math.round(layer.opacity * 100) }}%</span>
            <input type="range" min="0" max="100" step="5"
                   [value]="layer.opacity * 100"
                   (input)="svc.setLayerOpacity(layer.id, $any($event.target).value / 100)"
                   class="w-16 accent-blue-500" />
            <button (click)="svc.deleteLayer(layer.id)"
                    class="text-gray-400 hover:text-red-400 text-xs p-1"
                    title="Delete layer">✕</button>
            <button (click)="svc.duplicateLayer(layer.id)"
                    class="text-gray-400 hover:text-green-400 text-xs p-1"
                    title="Duplicate layer">⎘</button>
            <button (click)="mergeDown(layer.id)"
                    [disabled]="i === 0"
                    class="text-gray-400 hover:text-blue-300 text-xs p-1 disabled:opacity-30"
                    title="Merge down into layer below">⇩</button>
            <div class="flex gap-0.5 ml-1">
              <button (click)="moveLayerUp(i)"
                      [disabled]="i === 0"
                      class="text-gray-400 hover:text-blue-300 text-xs p-1 disabled:opacity-30"
                      title="Move up">▲</button>
              <button (click)="moveLayerDown(i)"
                      [disabled]="i === svc.layers().length - 1"
                      class="text-gray-400 hover:text-blue-300 text-xs p-1 disabled:opacity-30"
                      title="Move down">▼</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class LayerPanelComponent {
  svc = inject(PixelArtService);
  Math = Math;

  addLayer() {
    this.svc.addLayer();
  }

  renameLayer(id: string, name: string) {
    // The service doesn't have renameLayer yet, but we can update via layers signal
    this.svc.layers.update(layers =>
      layers.map(l => l.id === id ? { ...l, name: name || 'Unnamed' } : l)
    );
  }

  moveLayerUp(index: number) {
    if (index > 0) this.svc.reorderLayer(index, index - 1);
  }

  moveLayerDown(index: number) {
    if (index < this.svc.layers().length - 1) this.svc.reorderLayer(index, index + 1);
  }

  mergeDown(id: string) {
    this.svc.mergeLayerDown(id);
  }
}
