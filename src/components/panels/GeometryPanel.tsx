import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { GeometryParams, GeometryType, VisualizationOptions, StyleOptions, GeometryProperties } from '@/types/geometry';
import RevolutionManager from '@/components/geometry/RevolutionManager';
import ArchimedeanManager from '@/components/geometry/ArchimedeanManager';

export interface PanelProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
  properties: GeometryProperties;
  onParamsChange: (params: GeometryParams) => void;
  onOptionsChange: (options: VisualizationOptions) => void;
  onStyleChange: (style: StyleOptions) => void;
}

export default function GeometryPanel({
  params,
  options,
  style,
  properties,
  onParamsChange,
  onOptionsChange,
  onStyleChange,
}: PanelProps) {
  const { t } = useTranslation();

  const handleTypeChange = (type: GeometryType) => {
    onOptionsChange({ ...options, showVertexSelection: false });
    onParamsChange({ ...params, type });
  };

  const handleParamChange = (key: keyof GeometryParams, value: number) => {
    onParamsChange({ ...params, [key]: value });
  };

  const geometryTypes: { value: GeometryType; label: string }[] = [
    { value: 'pyramid', label: t('geometry.pyramid') },
    { value: 'cylinder', label: t('geometry.cylinder') },
    { value: 'cone', label: t('geometry.cone') },
    { value: 'cube', label: t('geometry.cube') },
    { value: 'sphere', label: t('geometry.sphere') },
    { value: 'prism', label: t('geometry.prism') },
    { value: 'tetrahedron', label: t('geometry.tetrahedron_4_faces') },
    { value: 'octahedron', label: t('geometry.octahedron_8_faces') },
    { value: 'dodecahedron', label: t('geometry.dodecahedron_12_faces') },
    { value: 'icosahedron', label: t('geometry.icosahedron_20_faces') },
    { value: 'revolution-solids', label: 'Solidos de Revolucao' },
    { value: 'archimedean-solids', label: 'Solidos Arquimedianos' },
    { value: 'cone-frustum', label: 'Tronco de Cone' },
    { value: 'pyramid-frustum', label: 'Tronco de Piramide' },
  ];

  return (
    <div className="space-y-4">
      {/* Shape Selection */}
      <Card className="control-section">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">{t('geometry_form.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('geometry_form.type')}</Label>
            <Select value={params.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {geometryTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Solidos de Revolucao - Interface especifica */}
      {params.type === 'revolution-solids' && (
        <RevolutionManager
          params={params}
          onParamsChange={onParamsChange}
        />
      )}

      {/* Solidos Arquimedianos - Interface especifica */}
      {params.type === 'archimedean-solids' && (
        <ArchimedeanManager
          params={params}
          onParamsChange={onParamsChange}
        />
      )}

      {/* Troncos - Interface especifica */}
      {(params.type === 'cone-frustum' || params.type === 'pyramid-frustum') && (
        <Card className="control-section">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-primary">Controles do Tronco</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Altura do Corte */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Altura do Corte: {((params.frustumCutHeight || 0.5) * 100).toFixed(0)}%
              </Label>
              <Slider
                value={[params.frustumCutHeight || 0.5]}
                onValueChange={([value]) => onParamsChange({ ...params, frustumCutHeight: value })}
                min={0.1}
                max={0.9}
                step={0.05}
                className="w-full"
              />
            </div>

            {/* Raio do Cone/Piramide */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Raio da Base: {(params.radius || 2).toFixed(1)}
              </Label>
              <Slider
                value={[params.radius || 2]}
                onValueChange={([value]) => onParamsChange({ ...params, radius: value })}
                min={0.5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Altura Total */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Altura Total: {(params.height || 4).toFixed(1)}
              </Label>
              <Slider
                value={[params.height || 4]}
                onValueChange={([value]) => onParamsChange({ ...params, height: value })}
                min={1}
                max={8}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Numero de Lados da Base (apenas para piramide) */}
            {params.type === 'pyramid-frustum' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Lados da Base: {params.frustumBaseSides || 4}
                </Label>
                <Slider
                  value={[params.frustumBaseSides || 4]}
                  onValueChange={([value]) => onParamsChange({ ...params, frustumBaseSides: Math.round(value) })}
                  min={3}
                  max={12}
                  step={1}
                  className="w-full"
                />
              </div>
            )}

            {/* Cores Individuais */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cor da Parte Inferior</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={params.frustumBottomColor || '#3b82f6'}
                    onChange={(e) => onParamsChange({ ...params, frustumBottomColor: e.target.value })}
                    className="w-8 h-8 rounded border border-gray-300"
                  />
                  <span className="text-xs text-gray-500">
                    {params.frustumBottomColor || '#3b82f6'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Cor da Parte Superior</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={params.frustumTopColor || '#ef4444'}
                    onChange={(e) => onParamsChange({ ...params, frustumTopColor: e.target.value })}
                    className="w-8 h-8 rounded border border-gray-300"
                  />
                  <span className="text-xs text-gray-500">
                    {params.frustumTopColor || '#ef4444'}
                  </span>
                </div>
              </div>
            </div>

            {/* Opacidades Individuais */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Opacidade da Parte Inferior: {((params.frustumBottomOpacity || 0.8) * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[params.frustumBottomOpacity || 0.8]}
                  onValueChange={([value]) => onParamsChange({ ...params, frustumBottomOpacity: value })}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Opacidade da Parte Superior: {((params.frustumTopOpacity || 0.8) * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[params.frustumTopOpacity || 0.8]}
                  onValueChange={([value]) => onParamsChange({ ...params, frustumTopOpacity: value })}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  className="w-full"
                />
              </div>
            </div>

            {/* Alturas Individuais */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Altura da Parte Inferior: {(params.frustumBottomHeight || (params.height * (1 - (params.frustumCutHeight || 0.5)))).toFixed(1)}
                </Label>
                <Slider
                  value={[params.frustumBottomHeight || (params.height * (1 - (params.frustumCutHeight || 0.5)))]}
                  onValueChange={([value]) => onParamsChange({ ...params, frustumBottomHeight: value })}
                  min={0.5}
                  max={params.height * 0.9}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Altura da Parte Superior: {(params.frustumTopHeight || (params.height * (params.frustumCutHeight || 0.5))).toFixed(1)}
                </Label>
                <Slider
                  value={[params.frustumTopHeight || (params.height * (params.frustumCutHeight || 0.5))]}
                  onValueChange={([value]) => onParamsChange({ ...params, frustumTopHeight: value })}
                  min={0.5}
                  max={params.height * 0.9}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Controles de Visibilidade e Movimento */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Parte Superior Visivel</Label>
                <Switch
                  checked={params.frustumTopVisible !== false}
                  onCheckedChange={(checked) => onParamsChange({ ...params, frustumTopVisible: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Parte Superior Movel</Label>
                <Switch
                  checked={params.frustumTopMovable !== false}
                  onCheckedChange={(checked) => onParamsChange({ ...params, frustumTopMovable: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Partes Separaveis</Label>
                <Switch
                  checked={params.frustumSeparable !== false}
                  onCheckedChange={(checked) => onParamsChange({ ...params, frustumSeparable: checked })}
                />
              </div>
            </div>

            {/* Botao de Rotacao */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onParamsChange({ ...params, frustumRotating: !params.frustumRotating })}
                className="w-full"
              >
                {params.frustumRotating ? 'Parar Rotacao' : 'Iniciar Rotacao'}
              </Button>
            </div>

            {/* Segmentos de Altura */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Mostrar Segmentos de Altura</Label>
                <Switch
                  checked={params.frustumShowHeightSegments || false}
                  onCheckedChange={(checked) => onParamsChange({ ...params, frustumShowHeightSegments: checked })}
                />
              </div>

              {params.frustumShowHeightSegments && (
                <>
                  {/* Cor do Segmento do Tronco */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cor do Segmento do Tronco</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={params.frustumBottomSegmentColor || '#ffff00'}
                        onChange={(e) => onParamsChange({ ...params, frustumBottomSegmentColor: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-300"
                      />
                      <span className="text-xs text-gray-500">
                        {params.frustumBottomSegmentColor || '#ffff00'}
                      </span>
                    </div>
                  </div>

                  {/* Cor do Segmento da Parte Superior */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cor do Segmento da Parte Superior</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={params.frustumTopSegmentColor || '#ff00ff'}
                        onChange={(e) => onParamsChange({ ...params, frustumTopSegmentColor: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-300"
                      />
                      <span className="text-xs text-gray-500">
                        {params.frustumTopSegmentColor || '#ff00ff'}
                      </span>
                    </div>
                  </div>

                  {/* Espessura do Segmento do Tronco */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Espessura do Segmento do Tronco: {((params.frustumBottomSegmentThickness || 0.02) * 100).toFixed(1)}cm
                    </Label>
                    <Slider
                      value={[params.frustumBottomSegmentThickness || 0.02]}
                      onValueChange={([value]) => onParamsChange({ ...params, frustumBottomSegmentThickness: value })}
                      min={0.01}
                      max={0.1}
                      step={0.005}
                      className="w-full"
                    />
                  </div>

                  {/* Espessura do Segmento da Parte Superior */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Espessura do Segmento da Parte Superior: {((params.frustumTopSegmentThickness || 0.02) * 100).toFixed(1)}cm
                    </Label>
                    <Slider
                      value={[params.frustumTopSegmentThickness || 0.02]}
                      onValueChange={([value]) => onParamsChange({ ...params, frustumTopSegmentThickness: value })}
                      min={0.01}
                      max={0.1}
                      step={0.005}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parameters */}
      <Card className="control-section">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">{t('panel.parameters')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Height - for most shapes except sphere and tetrahedron */}
          {!['sphere', 'tetrahedron'].includes(params.type) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('params.height')}: {params.height?.toFixed(1)}
              </Label>
              <Slider
                value={[params.height || 4]}
                onValueChange={([value]) => handleParamChange('height', value)}
                min={0.5}
                max={10}
                step={0.1}
                className="w-full"
              />
            </div>
          )}

          {/* Radius - for cylinder, cone, sphere, tetrahedron */}
          {['cylinder', 'cone', 'sphere', 'tetrahedron'].includes(params.type) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Raio: {params.radius?.toFixed(1)}
              </Label>
              <Slider
                value={[params.radius || 2]}
                onValueChange={([value]) => handleParamChange('radius', value)}
                min={0.5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>
          )}

          {/* Side Length - for cube, tetrahedron, octahedron, dodecahedron, icosahedron */}
          {['cube', 'tetrahedron', 'octahedron', 'dodecahedron', 'icosahedron'].includes(params.type) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Aresta: {params.sideLength?.toFixed(1)}
              </Label>
              <Slider
                value={[params.sideLength || 2]}
                onValueChange={([value]) => handleParamChange('sideLength', value)}
                min={0.5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>
          )}

          {/* Base Edge Length and Sides - for pyramid and prism */}
          {['pyramid', 'prism'].includes(params.type) && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('params.sides')}: {params.numSides}
                </Label>
                <Slider
                  value={[params.numSides || 5]}
                  onValueChange={([value]) => handleParamChange('numSides', Math.round(value))}
                  min={3}
                  max={12}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('params.base_edge')}: {params.baseEdgeLength?.toFixed(1)}
                </Label>
                <Slider
                  value={[params.baseEdgeLength || 2]}
                  onValueChange={([value]) => handleParamChange('baseEdgeLength', value)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
