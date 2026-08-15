import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layer-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <p class="text-xs text-gray-400 mb-2 font-medium">Layers</p>
      <div class="space-y-1">
        <div class="flex items-center gap-2 px-2 py-1.5 rounded bg-[#0f3460] text-sm">
          <span class="text-gray-400">Layer 1</span>
        </div>
      </div>
    </div>
  `,
})
export class LayerPanelComponent {}
