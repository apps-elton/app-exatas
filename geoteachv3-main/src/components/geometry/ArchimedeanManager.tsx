import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { GeometryParams } from '@/types/geometry';
import { formatNumber } from '@/lib/geometry-calculations';

interface ArchimedeanManagerProps {
  params: GeometryParams;
  onParamsChange: (params: GeometryParams) => void;
}

const archimedeanSolids = [
  { 
    value: 'truncated-tetrahedron', 
    label: 'Tetraedro Truncado', 
    description: '8 faces (4 triângulos, 4 hexágonos)',
    faces: 8,
    vertices: 12
  },
  { 
    value: 'cuboctahedron', 
    label: 'Cuboctaedro', 
    description: '14 faces (8 triângulos, 6 quadrados)',
    faces: 14,
    vertices: 12
  },
  { 
    value: 'truncated-cube', 
    label: 'Cubo Truncado', 
    description: '14 faces (8 triângulos, 6 octógonos)',
    faces: 14,
    vertices: 24
  },
  { 
    value: 'truncated-octahedron', 
    label: 'Octaedro Truncado', 
    description: '14 faces (6 quadrados, 8 hexágonos)',
    faces: 14,
    vertices: 24
  },
  { 
    value: 'rhombicuboctahedron', 
    label: 'Rombicuboctaedro', 
    description: '26 faces (8 triângulos, 18 quadrados)',
    faces: 26,
    vertices: 24
  },
  { 
    value: 'icosidodecahedron', 
    label: 'Icosidodecaedro', 
    description: '32 faces (20 triângulos, 12 pentágonos)',
    faces: 32,
    vertices: 30
  },
  { 
    value: 'truncated-dodecahedron', 
    label: 'Dodecaedro Truncado', 
    description: '32 faces (20 triângulos, 12 decágonos)',
    faces: 32,
    vertices: 60
  },
  { 
    value: 'truncated-icosahedron', 
    label: 'Icosaedro Truncado (Futebol)', 
    description: '32 faces (12 pentágonos, 20 hexágonos)',
    faces: 32,
    vertices: 60
  },
  { 
    value: 'snub-cube', 
    label: 'Cubo Snub', 
    description: '38 faces (32 triângulos, 6 quadrados)',
    faces: 38,
    vertices: 24
  },
  { 
    value: 'snub-dodecahedron', 
    label: 'Dodecaedro Snub', 
    description: '92 faces (80 triângulos, 12 pentágonos)',
    faces: 92,
    vertices: 60
  }
];

const colors = [
  { value: '#ffffff', label: 'Branco' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#84cc16', label: 'Lima' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6b7280', label: 'Cinza' },
  { value: '#1f2937', label: 'Preto' }
];

export default function ArchimedeanManager({ params, onParamsChange }: ArchimedeanManagerProps) {
  const selectedSolid = archimedeanSolids.find(solid => solid.value === params.archimedeanType) || archimedeanSolids[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Sólidos Arquimedianos</CardTitle>
        <p className="text-sm text-muted-foreground">
          {selectedSolid.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="archimedean-type">Tipo de Sólido</Label>
          <Select
            value={params.archimedeanType || 'truncated-tetrahedron'}
            onValueChange={(value) => onParamsChange({ ...params, archimedeanType: value as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um sólido" />
            </SelectTrigger>
            <SelectContent>
              {archimedeanSolids.map((solid) => (
                <SelectItem key={solid.value} value={solid.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{solid.label}</span>
                    <span className="text-xs text-muted-foreground">{solid.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{selectedSolid.faces}</div>
            <div className="text-xs text-muted-foreground">Faces</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{selectedSolid.vertices}</div>
            <div className="text-xs text-muted-foreground">Vértices</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="archimedean-size">Tamanho</Label>
          <div className="px-3">
            <Slider
              id="archimedean-size"
              min={0.5}
              max={5}
              step={0.1}
              value={[params.archimedeanSize || 2]}
              onValueChange={(value) => onParamsChange({ ...params, archimedeanSize: value[0] })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0.5</span>
              <span>{formatNumber(params.archimedeanSize || 2)}</span>
              <span>5.0</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="archimedean-opacity">Opacidade</Label>
          <div className="px-3">
            <Slider
              id="archimedean-opacity"
              min={0.1}
              max={1}
              step={0.1}
              value={[params.archimedeanOpacity || 0.8]}
              onValueChange={(value) => onParamsChange({ ...params, archimedeanOpacity: value[0] })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0.1</span>
              <span>{formatNumber((params.archimedeanOpacity || 0.8) * 100)}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="archimedean-wireframe">Mostrar Arestas</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="archimedean-wireframe"
              checked={params.archimedeanWireframe || false}
              onCheckedChange={(checked) => onParamsChange({ ...params, archimedeanWireframe: checked })}
            />
            <Label htmlFor="archimedean-wireframe" className="text-sm">
              {params.archimedeanWireframe ? 'Ativado' : 'Desativado'}
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="archimedean-color">Cor do Sólido</Label>
          <Select
            value={params.archimedeanColor || '#3b82f6'}
            onValueChange={(value) => onParamsChange({ ...params, archimedeanColor: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colors.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full border" 
                      style={{ backgroundColor: color.value }}
                    />
                    <span>{color.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="archimedean-edge-color">Cor das Arestas</Label>
          <Select
            value={params.archimedeanEdgeColor || '#000000'}
            onValueChange={(value) => onParamsChange({ ...params, archimedeanEdgeColor: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colors.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full border" 
                      style={{ backgroundColor: color.value }}
                    />
                    <span>{color.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}