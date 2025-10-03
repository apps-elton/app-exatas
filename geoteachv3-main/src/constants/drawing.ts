// ==========================================
// constants.ts - Configurações centralizadas
// ==========================================

import { ToolType, ToolConfig } from '../types/drawing';

const PERFORMANCE = {
  TARGET_FPS: 60,
  FRAME_TIME: 1000 / 60, // ~16ms
  MIN_POINT_DISTANCE: 2,
  MAX_POINTS_PER_STROKE: 10000,
  RENDER_THROTTLE: 16, // ~60fps
  MIN_DISTANCE: 2,
  FRAME_TIME: 16
} as const;

export const TOOLS: Record<ToolType, ToolConfig> = {
  pen: { opacity: 1.0, thickness: 1.0, texture: 'smooth' },
  pencil: { opacity: 0.75, thickness: 1.0, texture: 'rough' },
  highlighter: { opacity: 0.3, thickness: 5.0, texture: 'marker' },
  eraser: { opacity: 1.0, thickness: 3.0, texture: 'smooth' }
} as const;

export const PRESSURE = {
  MIN: 0.3,
  MAX: 1.0,
  DEFAULT: 0.5
} as const;

// Constantes para mesa digitalizadora
export const TABLET = {
  MIN_DISTANCE: 2,
  FRAME_TIME: 16,
  SMOOTHING_FACTOR: 0.8,
  PRESSURE_SENSITIVITY: 1.5,
  TEXTURE_OFFSET: 1
} as const;

export { PERFORMANCE };

