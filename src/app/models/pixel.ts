export interface Layer { id: string; name: string; visible: boolean; opacity: number; pixels: string[][]; blendMode: BlendMode; }
export interface Color { hex: string; }
export type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper' | 'select' | 'pan' | 'rectangle';
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';
