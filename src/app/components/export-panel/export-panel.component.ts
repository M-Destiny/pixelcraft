import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PixelArtService } from '../../services/pixel-art.service';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-export-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      <p class="text-xs text-gray-400 mb-1 font-medium">Export</p>
      
      <div class="space-y-1">
        <p class="text-xs text-gray-500">PNG Scale</p>
        <div class="flex flex-wrap gap-1">
          @for (scale of scales; track scale) {
            <button (click)="downloadPNG(scale)"
                    class="px-2 py-1 text-xs rounded bg-[#0f3460] hover:bg-blue-600 hover:text-white transition-colors">
              {{ scale }}x
            </button>
          }
        </div>
      </div>
      
      <div class="pt-2 border-t border-[#0f3460]">
        <button (click)="downloadSVG()"
                class="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors">
          Download SVG
        </button>
      </div>
    </div>
  `,
})
export class ExportPanelComponent {
  svc = inject(PixelArtService);
  exporter = inject(ExportService);
  scales = [1, 2, 4, 8, 16];

  downloadPNG(scale: number) {
    const data = this.svc.getExportData();
    const url = this.exporter.exportPNG(data, scale);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `pixel-art-${scale}x.png`; 
    a.click();
  }

  downloadSVG() {
    const data = this.svc.getExportData();
    const svg = this.exporter.exportSVG(data);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = 'pixel-art.svg'; 
    a.click();
    URL.revokeObjectURL(url);
  }
}
