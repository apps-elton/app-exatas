export type DrawingTool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line';

export interface DrawingOptions {
  tool: DrawingTool;
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface PenPreset {
  name: string;
  strokeWidth: number;
  opacity: number;
  color: string;
  icon: string;
}

export const PEN_PRESETS: PenPreset[] = [
  {
    name: 'Caneta Fina',
    strokeWidth: 2,
    opacity: 1,
    color: '#000000',
    icon: '✒️'
  },
  {
    name: 'Caneta Média',
    strokeWidth: 4,
    opacity: 1,
    color: '#000000',
    icon: '🖊️'
  },
  {
    name: 'Caneta Grossa',
    strokeWidth: 8,
    opacity: 1,
    color: '#000000',
    icon: '🖍️'
  },
  {
    name: 'Marcador',
    strokeWidth: 12,
    opacity: 0.6,
    color: '#ffeb3b',
    icon: '🖍️'
  },
  {
    name: 'Pincel',
    strokeWidth: 16,
    opacity: 0.8,
    color: '#2196f3',
    icon: '🖌️'
  }
];

export const DRAWING_COLORS = [
  '#000000', // Preto
  '#ff0000', // Vermelho
  '#00ff00', // Verde
  '#0000ff', // Azul
  '#ffff00', // Amarelo
  '#ff8000', // Laranja
  '#8000ff', // Roxo
  '#00ffff', // Ciano
  '#ff00ff', // Magenta
  '#808080', // Cinza
  '#ffffff'  // Branco
];