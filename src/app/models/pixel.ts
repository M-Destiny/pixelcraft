export interface PixelArt { width: number; height: number; pixels: string[][]; layers: Layer[]; }
export interface Layer { id: string; name: string; visible: boolean; opacity: number; pixels: string[][]; }
export interface Color { hex: string; }
export type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper' | 'select' | 'pan' | 'rectangle';
