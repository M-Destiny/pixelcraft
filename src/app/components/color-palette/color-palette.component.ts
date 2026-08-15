import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PixelArtService } from '../../services/pixel-art.service';

@Component({
  selector: 'app-color-palette',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-1">
      <p class="text-xs text-gray-400 mb-1">Colors</p>
      @for (color of colors; track color) {
        <button
          (click)="svc.activeColor.set(color)"
          [style.background]="color"
          [class.ring-2]="svc.activeColor() === color"
          class="w-8 h-8 rounded border border-gray-600 hover:scale-110 transition-transform"
        ></button>
      }
    </div>
  `,
})
export class ColorPaletteComponent {
  svc = inject(PixelArtService);
  colors = ['#ffffff','#000000','#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff','#ff8800','#88ff00','#0088ff','#ff0088','#888888','#444444','#cccccc','#884400'];
}
