import { describe, it, expect } from 'vitest';
import { GeometryCalculator } from '@/lib/geometry-calculations';

describe('GeometryCalculator', () => {
  describe('calculateProperties', () => {
    it('returns zero volume for unknown geometry type', () => {
      const result = GeometryCalculator.calculateProperties({
        type: 'unknown-shape' as any,
      });
      expect(result.volume).toBe(0);
    });

    describe('cube', () => {
      it('calculates volume for unit cube', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'cube',
          sideLength: 1,
        });
        expect(result.volume).toBeCloseTo(1);
      });

      it('calculates volume for cube with side 3', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'cube',
          sideLength: 3,
        });
        expect(result.volume).toBeCloseTo(27);
      });

      it('calculates surface area for unit cube', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'cube',
          sideLength: 1,
        });
        expect(result.totalArea).toBeCloseTo(6);
      });
    });

    describe('sphere', () => {
      it('calculates volume for unit sphere', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'sphere',
          radius: 1,
        });
        expect(result.volume).toBeCloseTo((4 / 3) * Math.PI);
      });

      it('calculates surface area for unit sphere', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'sphere',
          radius: 1,
        });
        expect(result.surfaceArea).toBeCloseTo(4 * Math.PI);
      });
    });

    describe('cylinder', () => {
      it('calculates volume for r=1 h=1', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'cylinder',
          radius: 1,
          height: 1,
        });
        expect(result.volume).toBeCloseTo(Math.PI);
      });

      it('calculates lateral area for r=1 h=1', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'cylinder',
          radius: 1,
          height: 1,
        });
        expect(result.lateralArea).toBeCloseTo(2 * Math.PI);
      });
    });

    describe('cone', () => {
      it('calculates volume for r=1 h=3', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'cone',
          radius: 1,
          height: 3,
        });
        expect(result.volume).toBeCloseTo(Math.PI);
      });
    });

    describe('pyramid', () => {
      it('calculates volume for square pyramid h=3 base=2', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'pyramid',
          height: 3,
          baseEdgeLength: 2,
          numSides: 4,
        });
        // V = (base_area * h) / 3 = (4 * 3) / 3 = 4
        expect(result.volume).toBeCloseTo(4);
      });
    });
  });
});
