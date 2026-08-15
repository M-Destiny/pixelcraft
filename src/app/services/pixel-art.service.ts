import { Injectable, signal } from '@angular/core';
import { PixelArt, Layer, Tool } from '../models/pixel';

@Injectable({ providedIn: 'root' })
export class PixelArtService {
  art = signal<PixelArt>({ width: 32, height: 32, pixels: Array(32).fill(null).map(() => Array(32).fill('transparent')), layers: [] });
  activeTool = signal<Tool>('pencil');
  activeColor = signal<string>('#ffffff');
  activeLayerId = signal<string>('');
  zoom = signal<number>(10);
}
