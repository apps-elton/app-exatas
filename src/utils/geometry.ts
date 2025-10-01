// ==========================================
// utils/geometry.ts - Funções puras
// ==========================================

import { Point } from '../types/drawing';
import { PRESSURE, PERFORMANCE } from '../constants/drawing';

export const calculateDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const normalizePressure = (rawPressure: number): number => {
  return Math.max(PRESSURE.MIN, Math.min(PRESSURE.MAX, rawPressure));
};

export const shouldAddPoint = (lastPoint: Point, newPoint: Point): boolean => {
  return calculateDistance(lastPoint, newPoint) >= PERFORMANCE.MIN_POINT_DISTANCE;
};

