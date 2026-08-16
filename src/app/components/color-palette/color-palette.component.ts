import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PixelArtService } from '../../services/pixel-art.service';

@Component({
  selector: 'app-color-palette',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <p class="text-xs text-gray-400 font-medium">Colors</p>
        <button (click)="useExtended.set(!useExtended())"
                class="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                [title]="useExtended() ? 'Show default palette (16 colors)' : 'Show extended palette (256 colors)'">
          {{ useExtended() ? '16' : '256' }}
        </button>
      </div>
      <div class="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
        @for (color of displayedColors(); track color) {
          <button
            (click)="svc.activeColor.set(color)"
            [style.background]="color"
            [class.ring-2]="svc.activeColor() === color"
            [class.ring-blue-400]="svc.activeColor() === color"
            class="w-8 h-8 rounded border border-gray-600 hover:scale-110 transition-transform"
            [title]="color"
          ></button>
        }
      </div>
    </div>
  `,
})
export class ColorPaletteComponent {
  svc = inject(PixelArtService);
  useExtended = signal(false);
  
  displayedColors = computed(() => 
    this.useExtended() ? this.svc.generateExtendedPalette() : this.svc.defaultColors
  );
}
