// ==========================================
// types.ts - Tipos bem definidos
// ==========================================

export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface ToolConfig {
  opacity: number;
  thickness: number;
  texture: 'smooth' | 'rough' | 'marker';
}

export type ToolType = 'pen' | 'pencil' | 'highlighter' | 'eraser';

export interface Stroke {
  id: string;
  tool: ToolType;
  points: Point[];
  color: string;
  baseThickness: number;
}

// Tipos para mesa digitalizadora com fluidez
export interface DrawingPoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface DrawingStroke {
  id: string;
  tool: string;
  points: DrawingPoint[];
  color: string;
  thickness: number;
  opacity: number;
}

export interface DrawingStyle {
  color: string;
  thickness: number;
  opacity: number;
  pressure: boolean;
  smoothing: number;
  fontFamily?: string;
}

// Cores disponíveis para desenho
export const DRAWING_COLORS = [
  '#000000', // Preto
  '#333333', // Cinza escuro
  '#ffffff', // Branco
  '#ff0000', // Vermelho
  '#00ff00', // Verde
  '#0000ff', // Azul
  '#ffff00', // Amarelo
  '#ff00ff', // Magenta
  '#00ffff', // Ciano
  '#ffa500', // Laranja
  '#800080', // Roxo
  '#8b4513', // Marrom
  '#808080', // Cinza
  '#ffc0cb', // Rosa
  '#90ee90', // Verde claro
  '#add8e6'  // Azul claro
];