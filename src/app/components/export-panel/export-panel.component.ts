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
      <button (click)="download()" class="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors">
        Download PNG
      </button>
    </div>
  `,
})
export class ExportPanelComponent {
  svc = inject(PixelArtService);
  exporter = inject(ExportService);

  download() {
    const url = this.exporter.exportPNG(this.svc.art());
    const a = document.createElement('a');
    a.href = url; a.download = 'pixel-art.png'; a.click();
  }
}
