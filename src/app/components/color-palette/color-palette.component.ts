import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PixelArtService } from '../../services/pixel-art.service';

@Component({
  selector: 'app-color-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
      
      <!-- Custom color input -->
      <div class="flex items-center gap-2">
        <input type="color" 
               [value]="svc.activeColor()" 
               (input)="svc.activeColor.set($any($event.target).value)"
               class="w-8 h-8 rounded border border-gray-600 cursor-pointer"
               title="Custom color picker" />
        <input type="text" 
               [value]="svc.activeColor()" 
               (input)="onHexInput($event)"
               (blur)="onHexBlur($event)"
               class="flex-1 text-xs px-2 py-1 bg-[#0f3460] border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
               placeholder="#rrggbb"
               title="Enter hex color" />
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

  onHexInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    // Allow partial input while typing
    if (/^#[0-9a-fA-F]{0,6}$/.test(value)) {
      // Don't update yet, wait for blur or complete input
    }
  }

  onHexBlur(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (/^#[0-9a-fA-F]{6}$/i.test(value)) {
      this.svc.activeColor.set(value.toLowerCase());
    } else {
      // Reset to current color if invalid
      (event.target as HTMLInputElement).value = this.svc.activeColor();
    }
  }
}
