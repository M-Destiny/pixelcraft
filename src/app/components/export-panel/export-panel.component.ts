import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PixelArtService } from '../../services/pixel-art.service';
import { ExportService, ExportData, ExportPreset } from '../../services/export.service';

@Component({
  selector: 'app-export-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-2">
      <p class="text-xs text-gray-400 mb-1 font-medium">Export</p>
      \n      <!-- Preview thumbnail -->
      <div class="mb-2">
        <p class="text-xs text-gray-500 mb-1">Preview</p>
        <div class="relative w-full aspect-square bg-checkerboard rounded border border-gray-600 overflow-hidden">
          <img [src]="previewUrl()" alt="Preview" class="w-full h-full object-contain" />
        </div>
      </div>

      <!-- Built-in and custom presets -->
      <div class="space-y-1">
        <p class="text-xs text-gray-500">Presets</p>
        <div class="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
          @for (preset of presets(); track preset.name; let i = $index) {
            <button (click)="applyPreset(preset)"
                    class="px-2 py-1 text-xs rounded bg-[#0f3460] hover:bg-blue-600 hover:text-white transition-colors text-left w-full">
              {{ preset.name }}{{ preset.scale ? ' (' + preset.scale + 'x)' : '' }}
            </button>
          }
        </div>
      </div>

      <!-- Custom preset creator -->
      <div class="pt-2 border-t border-[#0f3460] space-y-1">
        <p class="text-xs text-gray-500">Create Custom Preset</p>
        <div class="flex gap-1">
          <input type="text" [(ngModel)]="customPresetName" placeholder="Preset name" class="flex-1 text-xs px-2 py-1 bg-[#1a1a2e] border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
          <select [(ngModel)]="customPresetFormat" class="text-xs bg-[#1a1a2e] border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="png">PNG</option>
            <option value="svg">SVG</option>
          </select>
        </div>
        <div class="flex gap-1" *ngIf="customPresetFormat === 'png'">
          <input type="number" [(ngModel)]="customPresetScale" min="1" max="16" step="1" class="flex-1 text-xs px-2 py-1 bg-[#1a1a2e] border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Scale (1-16)" />
          <button (click)="saveCustomPreset()" class="px-2 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white transition-colors">Save</button>
        </div>
        <button (click)="saveCustomPreset()" *ngIf="customPresetFormat === 'svg'" class="px-2 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white transition-colors w-full">Save SVG Preset</button>
      </div>

      <!-- Quick export buttons (legacy) -->
      <div class="pt-2 border-t border-[#0f3460]">
        <p class="text-xs text-gray-500 mb-1">Quick Export</p>
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
        <div class="pt-2">
          <button (click)="downloadSVG()"
                  class="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors">
            Download SVG
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ExportPanelComponent {
  svc = inject(PixelArtService);
  exporter = inject(ExportService);
  scales = [1, 2, 4, 8, 16];
  
  customPresetName = '';
  customPresetFormat: 'png' | 'svg' = 'png';
  customPresetScale = 4;

  presets = computed(() => this.exporter.getAllPresets());

  previewUrl = computed(() => {
    const data: ExportData = this.svc.getExportData() as ExportData;
    return this.exporter.exportPNG(data, 1);
  });

  applyPreset(preset: ExportPreset) {
    const data: ExportData = this.svc.getExportData() as ExportData;
    if (preset.format === 'png') {
      this.downloadPNG(preset.scale || 1);
    } else {
      this.downloadSVG();
    }
  }

  saveCustomPreset() {
    if (!this.customPresetName.trim()) return;
    const preset: ExportPreset = {
      name: this.customPresetName.trim(),
      format: this.customPresetFormat,
      scale: this.customPresetFormat === 'png' ? this.customPresetScale : undefined,
    };
    this.exporter.addPreset(preset);
    this.customPresetName = '';
    this.customPresetScale = 4;
  }

  downloadPNG(scale: number) {
    const data: ExportData = this.svc.getExportData() as ExportData;
    const url = this.exporter.exportPNG(data, scale);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `pixel-art-${scale}x.png`; 
    a.click();
  }

  downloadSVG() {
    const data: ExportData = this.svc.getExportData() as ExportData;
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
