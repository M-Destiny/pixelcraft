import { Injectable } from '@angular/core';
import { PixelArt } from '../models/pixel';

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportPNG(art: PixelArt, scale = 4): string {
    const canvas = document.createElement('canvas');
    canvas.width = art.width * scale;
    canvas.height = art.height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    art.pixels.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color !== 'transparent') { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
      });
    });
    return canvas.toDataURL('image/png');
  }
}
