// ==========================================
// utils/smoothing.ts - Algoritmo de suavização
// ==========================================

import { Point } from '../types/drawing';

export const smoothPoints = (points: Point[], factor: number): Point[] => {
  if (points.length < 3 || factor === 0) return points;
  
  const result: Point[] = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    result.push({
      x: curr.x * (1 - factor) + (prev.x + next.x) * 0.5 * factor,
      y: curr.y * (1 - factor) + (prev.y + next.y) * 0.5 * factor,
      pressure: curr.pressure,
      timestamp: curr.timestamp
    });
  }
  
  result.push(points[points.length - 1]);
  return result;
};

