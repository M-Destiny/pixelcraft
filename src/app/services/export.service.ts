import { Injectable } from '@angular/core';
import { PixelArt, Layer } from '../models/pixel';

export interface ExportData {
  width: number;
  height: number;
  layers: Layer[];
  activeLayerId: string;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportPNG(data: ExportData, scale = 4): string {
    const canvas = document.createElement('canvas');
    canvas.width = data.width * scale;
    canvas.height = data.height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
   
    // Merge layers
    const merged = Array(data.height).fill(null).map(() => Array(data.width).fill('transparent'));
    for (const layer of data.layers) {
      if (!layer.visible) continue;
      const opacity = layer.opacity ?? 1;
      for (let y = 0; y < data.height; y++) {
        for (let x = 0; x < data.width; x++) {
          const color = layer.pixels[y][x];
          if (color !== 'transparent') {
            if (opacity < 1) {
              // Apply opacity by blending
              const existing = merged[y][x];
              if (existing !== 'transparent') {
                merged[y][x] = this.blendColors(existing, color, opacity);
              } else {
                merged[y][x] = this.applyOpacity(color, opacity);
              }
            } else {
              merged[y][x] = color;
            }
          }
        }
      }
    }
   
    merged.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color !== 'transparent') { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
      });
    });
    return canvas.toDataURL('image/png');
  }
 
  exportSVG(data: ExportData): string {
    const { width, height, layers } = data;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">`;
    
    // Add transparent background as checkerboard pattern (optional, usually not needed for SVG)
    // We'll just render the visible layers
    
    for (const layer of layers) {
      if (!layer.visible) continue;
      const opacity = layer.opacity ?? 1;
      
      // Group for layer opacity
      if (opacity < 1) {
        svg += `<g opacity="${opacity}">`;
      }
      
      // Render each pixel as a rect
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const color = layer.pixels[y][x];
          if (color !== 'transparent') {
            // Optimize: combine adjacent same-color pixels into larger rects
            let w = 1;
            while (x + w < width && layer.pixels[y][x + w] === color) w++;
            svg += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${color}"/>`;
            x += w - 1;
          }
        }
      }
      
      if (opacity < 1) {
        svg += `</g>`;
      }
    }
    
    svg += `</svg>`;
    return svg;
  }
  
  private blendColors(base: string, overlay: string, opacity: number): string {
    const baseRgb = this.hexToRgb(base);
    const overlayRgb = this.hexToRgb(overlay);
    if (!baseRgb || !overlayRgb) return overlay;
    const r = Math.round(baseRgb.r * (1 - opacity) + overlayRgb.r * opacity);
    const g = Math.round(baseRgb.g * (1 - opacity) + overlayRgb.g * opacity);
    const b = Math.round(baseRgb.b * (1 - opacity) + overlayRgb.b * opacity);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  private applyOpacity(color: string, opacity: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;
    const r = Math.round(rgb.r * opacity);
    const g = Math.round(rgb.g * opacity);
    const b = Math.round(rgb.b * opacity);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}
