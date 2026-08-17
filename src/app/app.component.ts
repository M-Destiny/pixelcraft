import { Component } from '@angular/core';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ColorPaletteComponent } from './components/color-palette/color-palette.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { LayerPanelComponent } from './components/layer-panel/layer-panel.component';
import { ExportPanelComponent } from './components/export-panel/export-panel.component';
import { HelpModalComponent } from './components/help-modal/help-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ToolbarComponent, ColorPaletteComponent, CanvasComponent, LayerPanelComponent, ExportPanelComponent, HelpModalComponent],
  template: `
    <div class="flex flex-col h-screen bg-[#1a1a2e]">
      <app-toolbar class="flex-shrink-0" />
      <div class="flex flex-1 overflow-hidden">
        <div class="w-16 bg-[#16213e] border-r border-[#0f3460] p-2 flex flex-col gap-2">
          <app-color-palette />
        </div>
        <div class="flex-1 flex items-center justify-center overflow-auto p-4">
          <app-canvas />
        </div>
        <div class="w-56 bg-[#16213e] border-l border-[#0f3460] p-3 flex flex-col gap-3">
          <app-layer-panel />
          <app-export-panel />
        </div>
      </div>
      <app-help-modal />
    </div>
  `,
})
export class AppComponent {}
