import React from 'react';
import { GeometryParams } from '@/types/geometry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GeometryCalculationsProps {
  params: GeometryParams;
}

export function GeometryCalculations({ params }: GeometryCalculationsProps) {
  const formatWithPi = (coefficient: number): string => {
    if (coefficient === 0) return '0';
    if (coefficient === 1) return 'π';
    if (coefficient === -1) return '-π';
    return `${coefficient}π`;
  };

  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  const renderCalculations = () => {
    switch (params.type) {
      case 'cylinder': {
        const { height = 4, radius = 2 } = params;
        const r = radius;
        const h = height;

        return (
          <div className="space-y-2 text-sm">
            <div><strong>Área da Base:</strong> {formatWithPi(r * r)} = {formatNumber(Math.PI * r * r)}</div>
            <div><strong>Área Lateral:</strong> {formatWithPi(2 * r * h)} = {formatNumber(2 * Math.PI * r * h)}</div>
            <div><strong>Área Total:</strong> {formatWithPi(2 * r * r + 2 * r * h)} = {formatNumber(2 * Math.PI * r * r + 2 * Math.PI * r * h)}</div>
            <div><strong>Volume:</strong> {formatWithPi(r * r)} × {h} = {formatNumber(Math.PI * r * r * h)}</div>
          </div>
        );
      }

      case 'cone': {
        const { height = 4, radius = 2 } = params;
        const r = radius;
        const h = height;
        const slantHeight = Math.sqrt(r * r + h * h);

        return (
          <div className="space-y-2 text-sm">
            <div><strong>Área da Base:</strong> {formatWithPi(r * r)} = {formatNumber(Math.PI * r * r)}</div>
            <div><strong>Área Lateral:</strong> {formatWithPi(r)} × {formatNumber(slantHeight)} = {formatNumber(Math.PI * r * slantHeight)}</div>
            <div><strong>Área Total:</strong> {formatWithPi(r * r + r)} × {formatNumber(slantHeight)} = {formatNumber(Math.PI * r * r + Math.PI * r * slantHeight)}</div>
            <div><strong>Volume:</strong> ({formatWithPi(r * r)} × {h})/3 = {formatNumber((Math.PI * r * r * h) / 3)}</div>
          </div>
        );
      }

      case 'pyramid': {
        const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
        const n = numSides;
        const s = baseEdgeLength;
        const h = height;

        const baseArea = (n * s * s) / (4 * Math.tan(Math.PI / n));
        const baseApothem = s / (2 * Math.tan(Math.PI / n));
        const lateralApothem = Math.sqrt(h * h + baseApothem * baseApothem);
        const perimeter = n * s;
        const lateralArea = (perimeter * lateralApothem) / 2;
        const totalArea = baseArea + lateralArea;
        const volume = (baseArea * h) / 3;

        return (
          <div className="space-y-2 text-sm">
            <div><strong>Área da Base:</strong> {formatNumber(baseArea)}</div>
            <div><strong>Área Lateral:</strong> {formatNumber(lateralArea)}</div>
            <div><strong>Área Total:</strong> {formatNumber(totalArea)}</div>
            <div><strong>Volume:</strong> {formatNumber(volume)}</div>
          </div>
        );
      }

      case 'cube': {
        const { sideLength = 2 } = params;
        const s = sideLength;
        const inscribedRadius = s / 2; // Raio da esfera inscrita (centro ao centro da face)

        return (
          <div className="space-y-2 text-sm">
            <div><strong>Área da Face:</strong> {formatNumber(s * s)}</div>
            <div><strong>Área Lateral:</strong> 4 × {formatNumber(s * s)} = {formatNumber(4 * s * s)}</div>
            <div><strong>Área Total:</strong> 6 × {formatNumber(s * s)} = {formatNumber(6 * s * s)}</div>
            <div><strong>Volume:</strong> {formatNumber(s * s * s)}</div>
            <div><strong>Raio Inscrito:</strong> {formatNumber(inscribedRadius)} (centro ao centro da face)</div>
          </div>
        );
      }

      case 'tetrahedron': {
        const { sideLength = 2 } = params;
        const a = sideLength;
        
        const height = a * Math.sqrt(2/3);
        const baseArea = (Math.sqrt(3) / 4) * a * a;
        const lateralArea = 3 * baseArea;
        const totalArea = 4 * baseArea;
        const volume = (baseArea * height) / 3;

        return (
          <div className="space-y-2 text-sm">
            <div><strong>Área da Base:</strong> {formatNumber(baseArea)}</div>
            <div><strong>Área Lateral:</strong> {formatNumber(lateralArea)}</div>
            <div><strong>Área Total:</strong> {formatNumber(totalArea)}</div>
            <div><strong>Volume:</strong> {formatNumber(volume)}</div>
          </div>
        );
      }

      case 'prism': {
        const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
        const n = numSides;
        const s = baseEdgeLength;
        const h = height;

        const baseArea = (n * s * s) / (4 * Math.tan(Math.PI / n));
        const lateralArea = n * s * h;
        const totalArea = 2 * baseArea + lateralArea;
        const volume = baseArea * h;
        const apothem = s / (2 * Math.tan(Math.PI / n)); // Apótema da base (raio inscrito)

        return (
          <div className="space-y-2 text-sm">
            <div><strong>Área da Base:</strong> {formatNumber(baseArea)}</div>
            <div><strong>Área Lateral:</strong> {formatNumber(lateralArea)}</div>
            <div><strong>Área Total:</strong> {formatNumber(totalArea)}</div>
            <div><strong>Volume:</strong> {formatNumber(volume)}</div>
            <div><strong>Raio Inscrito (Apótema):</strong> {formatNumber(apothem)} (centro ao meio da aresta)</div>
          </div>
        );
      }

      default:
        return <div className="text-sm text-muted-foreground">Cálculos não disponíveis para esta geometria.</div>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Cálculos Geométricos</CardTitle>
      </CardHeader>
      <CardContent>
        {renderCalculations()}
      </CardContent>
    </Card>
  );
}