import React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { GeometryParams, GeometryType, VisualizationOptions, StyleOptions } from '@/types/geometry';
import { GeometryProperties } from '@/types/geometry';
import { formatNumber } from '@/lib/geometry-calculations';
import { RotateCcw, Download, Play, Pause, Hand } from 'lucide-react';
import { GeometryCalculations } from './GeometryCalculations';
import MultiplePlanesManager from './MultiplePlanesManager';
import { toast } from 'sonner';
import ImageDownloadMenu from './ImageDownloadMenu';
import DrawingTablet, { DrawingStroke, DrawingStyle, DrawingTool } from './DrawingTablet';
import DrawingOverlay3D from './DrawingOverlay3D';
import RevolutionManager from './geometry/RevolutionManager';
import ArchimedeanManager from './geometry/ArchimedeanManager';

interface ControlPanelProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
  properties: GeometryProperties;
  onParamsChange: (params: GeometryParams) => void;
  onOptionsChange: (options: VisualizationOptions) => void;
  onStyleChange: (style: StyleOptions) => void;
  onExportImage: (format?: 'png' | 'jpg', quality?: 'hd' | 'medium' | 'low') => void;
  onVertexSelect?: (vertexIndex: number) => void;
  // Props da mesa digitalizadora
  isTabletActive?: boolean;
  onTabletToggle?: (active: boolean) => void;
  drawingStrokes?: DrawingStroke[];
  onDrawingChange?: (strokes: DrawingStroke[]) => void;
  // Configurações da mesa digitalizadora
  tabletStyle?: DrawingStyle;
  tabletTool?: DrawingTool;
  onTabletStyleChange?: (style: DrawingStyle) => void;
  onTabletToolChange?: (tool: DrawingTool) => void;
}

export default function ControlPanel({
  params,
  options,
  style,
  properties,
  onParamsChange,
  onOptionsChange,
  onStyleChange,
  onExportImage,
  onVertexSelect,
  // Props da mesa digitalizadora
  isTabletActive = false,
  onTabletToggle,
  drawingStrokes = [],
  onDrawingChange,
  // Configurações da mesa digitalizadora
  tabletStyle,
  tabletTool,
  onTabletStyleChange,
  onTabletToolChange
}: ControlPanelProps) {
  const { t } = useTranslation();
  
  const handleTypeChange = (type: GeometryType) => {
    // Reset vertex connections when changing geometry type
    onOptionsChange({ ...options, showVertexSelection: false });
    onParamsChange({ ...params, type });
  };

  const handleParamChange = (key: keyof GeometryParams, value: number) => {
    onParamsChange({ ...params, [key]: value });
  };

  const handleOptionChange = (key: keyof VisualizationOptions, value: boolean | number) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const handleStyleChange = (key: keyof StyleOptions, value: string | number | number[]) => {
    onStyleChange({ ...style, [key]: value });
  };

  // Estado para controlar visibilidade de controles de cor e espessura
  const [colorSelectors, setColorSelectors] = useState<{[key: string]: boolean}>({});
  const [thicknessSelectors, setThicknessSelectors] = useState<{[key: string]: boolean}>({});

  // Função para renderizar um seletor de cor
  const renderColorPicker = (
    label: string, 
    colorKey: keyof StyleOptions, 
    showCondition: boolean = true,
    optionKey?: string
  ) => {
    if (!showCondition) return null;
    
    const selectorId = optionKey || colorKey;
    const isVisible = colorSelectors[selectorId] ?? false;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setColorSelectors(prev => ({ ...prev, [selectorId]: !isVisible }))}
            className="h-6 px-2 text-xs"
          >
            {isVisible ? '✓' : 'Cor'}
          </Button>
        </div>
        {isVisible && (
          <div className="flex gap-1 flex-wrap">
            {colors.map((color) => (
              <button
                key={color.value}
                className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                  style[colorKey] === color.value 
                    ? 'border-primary shadow-lg scale-110 ring-2 ring-primary/30' 
                    : 'border-border hover:border-accent'
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => {
                  handleStyleChange(colorKey, color.value);
                  setColorSelectors(prev => ({ ...prev, [selectorId]: false }));
                }}
                title={`${label} - ${color.label}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Função para renderizar controle de espessura
  const renderThicknessControl = (
    label: string,
    thicknessKey: keyof StyleOptions,
    showCondition: boolean = true,
    optionKey?: string,
    min: number = 0.5,
    max: number = 5,
    step: number = 0.1
  ) => {
    if (!showCondition) return null;
    
    const selectorId = optionKey || `${thicknessKey}_thickness`;
    const isVisible = thicknessSelectors[selectorId] ?? false;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setThicknessSelectors(prev => ({ ...prev, [selectorId]: !isVisible }))}
            className="h-6 px-2 text-xs"
          >
            {isVisible ? '✓' : 'Espessura'}
          </Button>
        </div>
        {isVisible && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {label}: {Number(style[thicknessKey]).toFixed(1)}
            </Label>
            <Slider
              value={[Number(style[thicknessKey])]}
              onValueChange={([value]) => {
                handleStyleChange(thicknessKey, value);
              }}
              min={min}
              max={max}
              step={step}
              className="w-full"
            />
          </div>
        )}
      </div>
    );
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
    { value: 'revolution-solids', label: 'Sólidos de Revolução' },
    { value: 'archimedean-solids', label: 'Sólidos Arquimedianos' },
    { value: 'cone-frustum', label: 'Tronco de Cone' },
    { value: 'pyramid-frustum', label: 'Tronco de Pirâmide' }
  ];

  const colors = [
    { value: '#ffffff', label: 'Branco' },
    { value: '#3b82f6', label: 'Azul' },
    { value: '#8b5cf6', label: 'Roxo' },
    { value: '#06b6d4', label: 'Ciano' },
    { value: '#10b981', label: 'Verde' },
    { value: '#f59e0b', label: 'Amarelo' },
    { value: '#ef4444', label: 'Vermelho' },
    { value: '#6b7280', label: 'Cinza' }
  ];

  return (
    <div className="w-80 h-full overflow-y-auto space-y-4 p-4 scrollbar-custom">
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

      {/* Sólidos de Revolução - Interface específica */}
      {params.type === 'revolution-solids' && (
        <RevolutionManager 
          params={params}
          onParamsChange={onParamsChange}
        />
      )}

      {/* Sólidos Arquimedianos - Interface específica */}
      {params.type === 'archimedean-solids' && (
        <ArchimedeanManager 
          params={params}
          onParamsChange={onParamsChange}
        />
      )}

      {/* Troncos - Interface específica */}
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


            {/* Raio do Cone/Pirâmide */}
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



            {/* Número de Lados da Base (apenas para pirâmide) */}
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
                <Label className="text-sm font-medium">Parte Superior Visível</Label>
                <Switch
                  checked={params.frustumTopVisible !== false}
                  onCheckedChange={(checked) => onParamsChange({ ...params, frustumTopVisible: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Parte Superior Móvel</Label>
                <Switch
                  checked={params.frustumTopMovable !== false}
                  onCheckedChange={(checked) => onParamsChange({ ...params, frustumTopMovable: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Partes Separáveis</Label>
                <Switch
                  checked={params.frustumSeparable !== false}
                  onCheckedChange={(checked) => onParamsChange({ ...params, frustumSeparable: checked })}
                />
              </div>
            </div>

            {/* Botão de Rotação */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onParamsChange({ ...params, frustumRotating: !params.frustumRotating })}
                className="w-full"
              >
                {params.frustumRotating ? 'Parar Rotação' : 'Iniciar Rotação'}
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

      {/* Visualization Options */}
      <Card className="control-section">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">{t('panel.visualization')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="edges" className="text-sm font-medium">{t('options.show_edges')}</Label>
            <Switch
              id="edges"
              checked={options.showEdges}
              onCheckedChange={(checked) => handleOptionChange('showEdges', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="vertices" className="text-sm font-medium">{t('options.show_vertices')}</Label>
            <Switch
              id="vertices"
              checked={options.showVertices}
              onCheckedChange={(checked) => handleOptionChange('showVertices', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="faces" className="text-sm font-medium">{t('options.show_faces')}</Label>
            <Switch
              id="faces"
              checked={options.fillFaces}
              onCheckedChange={(checked) => handleOptionChange('fillFaces', checked)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="height" className="text-sm font-medium">{t('options.show_height')}</Label>
              <Switch
                id="height"
                checked={options.showHeight}
                onCheckedChange={(checked) => handleOptionChange('showHeight', checked)}
              />
            </div>
            {options.showHeight && (
              <>
                {renderColorPicker("Cor da Altura", "heightLineColor", true, "height")}
                {renderThicknessControl("Espessura da Altura", "heightThickness", true, "heightThickness")}
              </>
            )}
          </div>
           <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="radius" className="text-sm font-medium">{t('options.show_base_radius')}</Label>
              <Switch
                id="radius"
                checked={options.showBaseRadius}
                onCheckedChange={(checked) => handleOptionChange('showBaseRadius', checked)}
                disabled={!['cylinder', 'cone', 'sphere'].includes(params.type)}
              />
            </div>
            {options.showBaseRadius && (
              <>
                {renderColorPicker("Cor do Raio da Base", "heightLineColor", true, "baseRadius")}
                {renderThicknessControl("Espessura do Raio", "baseRadiusThickness", true, "baseRadiusThickness")}
              </>
            )}
          </div>
          
          {/* Controles específicos para formas poligonais */}
          {['pyramid', 'prism', 'cube', 'tetrahedron', 'octahedron', 'dodecahedron', 'icosahedron'].includes(params.type) && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="inscribed" className="text-sm font-medium">{t('geometric.inscribed_radius')}</Label>
                  <Switch
                    id="inscribed"
                    checked={options.showInscribedRadius}
                    onCheckedChange={(checked) => handleOptionChange('showInscribedRadius', checked)}
                  />
                </div>
                {options.showInscribedRadius && (
                  <>
                    {renderColorPicker("Cor do Raio Inscrito", "inscribedRadiusColor", true, "inscribedRadius")}
                    {renderThicknessControl("Espessura do Raio Inscrito", "inscribedRadiusThickness", true, "inscribedRadiusThickness")}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="circumscribed" className="text-sm font-medium">{t('geometric.circumscribed_radius')}</Label>
                  <Switch
                    id="circumscribed"
                    checked={options.showCircumscribedRadius}
                    onCheckedChange={(checked) => handleOptionChange('showCircumscribedRadius', checked)}
                  />
                </div>
                {options.showCircumscribedRadius && (
                  <>
                    {renderColorPicker("Cor do Raio Circunscrito", "circumscribedCircleColor", true, "circumscribedRadius")}
                    {renderThicknessControl("Espessura do Raio Circunscrito", "circumscribedRadiusThickness", true, "circumscribedRadiusThickness")}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="inscribed-circle" className="text-sm font-medium">{t('geometric.inscribed_circumference')}</Label>
                  <Switch
                    id="inscribed-circle"
                    checked={options.showInscribedCircle}
                    onCheckedChange={(checked) => handleOptionChange('showInscribedCircle', checked)}
                  />
                </div>
                {options.showInscribedCircle && (
                  <>
                    {renderColorPicker("Cor da Circunferência Inscrita", "inscribedCircleColor", true, "inscribedCircle")}
                    {renderThicknessControl("Espessura da Circunferência Inscrita", "inscribedCircleThickness", true, "inscribedCircleThickness")}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="circumscribed-circle" className="text-sm font-medium">{t('geometric.circumscribed_circumference')}</Label>
                  <Switch
                    id="circumscribed-circle"
                    checked={options.showCircumscribedCircle}
                    onCheckedChange={(checked) => handleOptionChange('showCircumscribedCircle', checked)}
                  />
                </div>
                {options.showCircumscribedCircle && (
                  <>
                    {renderColorPicker("Cor da Circunferência Circunscrita", "circumscribedCircleColor", true, "circumscribedCircle")}
                    {renderThicknessControl("Espessura da Circunferência Circunscrita", "circumscribedCircleThickness", true, "circumscribedCircleThickness")}
                  </>
                )}
              </div>
            </>
          )}
          
          {/* Controles específicos para poliedros de Platão */}
          {['tetrahedron', 'octahedron'].includes(params.type) && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="tetrahedron-base-apothem" className="text-sm font-medium">Apótema da Base</Label>
                <Switch
                  id="tetrahedron-base-apothem"
                  checked={options.showBaseApothem}
                  onCheckedChange={(checked) => handleOptionChange('showBaseApothem', checked)}
                />
              </div>
            </>
          )}

          {/* Controles específicos para pirâmides */}
          {params.type === 'pyramid' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lateral-apothem" className="text-sm font-medium">Apótema da Pirâmide</Label>
                  <Switch
                    id="lateral-apothem"
                    checked={options.showLateralApothem}
                    onCheckedChange={(checked) => handleOptionChange('showLateralApothem', checked)}
                  />
                </div>
                {options.showLateralApothem && (
                  <>
                    {renderColorPicker("Cor do Apótema da Pirâmide", "lateralApothemColor", true, "lateralApothem")}
                    {renderThicknessControl("Espessura do Apótema da Pirâmide", "lateralApothemThickness", true, "lateralApothemThickness")}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="base-apothem" className="text-sm font-medium">Apótema da Base</Label>
                  <Switch
                    id="base-apothem"
                    checked={options.showBaseApothem}
                    onCheckedChange={(checked) => handleOptionChange('showBaseApothem', checked)}
                  />
                </div>
                {options.showBaseApothem && (
                  <>
                    {renderColorPicker("Cor do Apótema da Base", "baseApothemColor", true, "baseApothem")}
                    {renderThicknessControl("Espessura do Apótema da Base", "baseApothemThickness", true, "baseApothemThickness")}
                  </>
                )}
              </div>
            </>
          )}

          {/* Controles específicos para cones */}
          {params.type === 'cone' && (
            <div className="flex items-center justify-between">
              <Label htmlFor="generatrix" className="text-sm font-medium">Geratriz</Label>
              <Switch
                id="generatrix"
                checked={options.showGeneratrix}
                onCheckedChange={(checked) => handleOptionChange('showGeneratrix', checked)}
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label htmlFor="labels" className="text-sm font-medium">{t('geometric.labels')}</Label>
            <Switch
              id="labels"
              checked={options.showLabels}
              onCheckedChange={(checked) => handleOptionChange('showLabels', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="grid" className="text-sm font-medium">{t('geometric.mesh')}</Label>
            <Switch
              id="grid"
              checked={options.showGrid}
              onCheckedChange={(checked) => handleOptionChange('showGrid', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cross-section" className="text-sm font-medium">{t('visualization.cross_section')}</Label>
            <Switch
              id="cross-section"
              checked={options.showCrossSection}
              onCheckedChange={(checked) => handleOptionChange('showCrossSection', checked)}
            />
          </div>
          
          {/* Altura da Seção Transversal */}
          {options.showCrossSection && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('label.section_height')} {(options.crossSectionHeight * 100).toFixed(0)}%
              </Label>
              <Slider
                value={[options.crossSectionHeight]}
                onValueChange={([value]) => handleOptionChange('crossSectionHeight', value)}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label htmlFor="meridian-section" className="text-sm font-medium">{t('visualization.meridian_section')}</Label>
             <Switch
               id="meridian-section"
               checked={options.showMeridianSection}
               onCheckedChange={(checked) => {
                 handleOptionChange('showMeridianSection', checked);
                 if (checked && ['cylinder', 'cone', 'cube', 'prism', 'tetrahedron', 'octahedron', 'dodecahedron', 'icosahedron', 'pyramid', 'sphere'].includes(params.type)) {
                   // Ativar automaticamente o modo meridiano para geometrias suportadas
                   handleStyleChange('activeVertexMode', 'meridian');
                   // Limpar seleções de outros modos
                   handleStyleChange('selectedVerticesForGeneral', []);
                   handleStyleChange('selectedVerticesForPlane', []);
                   toast.info(t('message.meridian_mode_activated'));
                 } else if (!checked) {
                   // Desativar o modo quando desliga o switch
                   handleStyleChange('activeVertexMode', 'none');
                   handleStyleChange('selectedVerticesForMeridian', []);
                 }
               }}
               disabled={!['cylinder', 'cone', 'cube', 'prism', 'tetrahedron', 'octahedron', 'dodecahedron', 'icosahedron', 'pyramid', 'sphere'].includes(params.type)}
             />
          </div>
          
          {/* Seleção de vértices para seção meridiana em prismas, cubos, tetraedros, pirâmides, cilindros e cones */}
          {['prism', 'cube', 'tetrahedron', 'pyramid', 'cylinder', 'cone'].includes(params.type) && options.showMeridianSection && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="vertex-selection" className="text-sm font-medium">Selecionar Vértices</Label>
                <Switch
                  id="vertex-selection"
                  checked={options.showVertexSelection}
                  onCheckedChange={(checked) => handleOptionChange('showVertexSelection', checked)}
                />
              </div>
              {options.showVertexSelection && (
                <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-md border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
                      MODO SEÇÃO MERIDIANA ATIVO
                    </p>
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">
                    Selecione 2 vértices (laranja) para definir plano meridiano
                  </p>
                  {(style.selectedVerticesForMeridian?.length || 0) > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        Selecionados: {style.selectedVerticesForMeridian?.length || 0}/2
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStyleChange('selectedVerticesForMeridian', [])}
                        className="h-5 px-2 text-xs"
                      >
                        {t('button.clear')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {options.showVertexSelection && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Clique em dois vértices não consecutivos para definir a seção meridiana.
                  {style.selectedVerticesForMeridian.length > 0 && (
                    <div className="mt-1">
                      Vértices selecionados: {style.selectedVerticesForMeridian.join(', ')}
                    </div>
                  )}
                  {style.selectedVerticesForMeridian.length === 2 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => handleStyleChange('selectedVerticesForMeridian', [] as number[])}
                    >
                      {t('button.clear_selection')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Altura da Seção Meridiana */}
          {options.showMeridianSection && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('label.meridian_section_height')} {(options.meridianSectionHeight * 100).toFixed(0)}%
              </Label>
              <Slider
                value={[options.meridianSectionHeight]}
                onValueChange={([value]) => handleOptionChange('meridianSectionHeight', value)}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label htmlFor="dimensions" className="text-sm font-medium">{t('visualization.dimensions')}</Label>
            <Switch
              id="dimensions"
              checked={options.showDimensions}
              onCheckedChange={(checked) => handleOptionChange('showDimensions', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="shadow" className="text-sm font-medium">{t('options.show_shadow')}</Label>
            <Switch
              id="shadow"
              checked={options.showShadow}
              onCheckedChange={(checked) => handleOptionChange('showShadow', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="unfolded" className="text-sm font-medium">{t('visualization.unfolding')}</Label>
            <Switch
              id="unfolded"
              checked={options.showUnfolded}
              onCheckedChange={(checked) => handleOptionChange('showUnfolded', checked)}
            />
          </div>
          {/* Conectores de Vértices */}
          {(
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="vertex-connector" className="text-sm font-medium">{t('drawing.connect_vertices')}</Label>
                <Switch
                  id="vertex-connector"
                  checked={options.showVertexConnector}
                  onCheckedChange={(checked) => {
                    handleOptionChange('showVertexConnector', checked);
                    if (checked) {
                      // Ativar automaticamente o modo de conexão
                      handleStyleChange('activeVertexMode', 'connection');
                      // Limpar seleções de outros modos
                      handleStyleChange('selectedVerticesForMeridian', []);
                      handleStyleChange('selectedVerticesForPlane', []);
                      toast.info(t('message.connection_mode_activated'));
                    } else {
                      // Desativar o modo quando desliga o switch
                      handleStyleChange('activeVertexMode', 'none');
                    }
                  }}
                />
              </div>
              {options.showVertexConnector && (
                <div className="space-y-2">
                  <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                        CONECTAR VÉRTICES ATIVO
                      </p>
                    </div>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                      Clique em 2 vértices amarelos para criar uma conexão
                    </p>
                    {(style.connections?.length || 0) > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                        ✓ {style.connections?.length || 0} conexões criadas
                      </p>
                    )}
                    {(style.selectedVerticesForGeneral?.length || 0) > 0 && (
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          Conectados: {style.selectedVerticesForGeneral?.length || 0} vértices
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleStyleChange('selectedVerticesForGeneral', []);
                            handleStyleChange('intersectionPositions', []);
                          }}
                          className="h-5 px-2 text-xs"
                        >
                          {t('button.clear')}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Controles padronizados de Cor e Espessura */}
                  <div className="space-y-2 mt-3">
                    {renderColorPicker("Cor dos Segmentos", "segmentColor", true, "segmentColor")}
                    {renderThicknessControl("Espessura dos Segmentos", "segmentThickness", true, "segmentThickness", 0.5, 8, 0.5)}
                    {renderThicknessControl("Espessura das Arestas", "edgeThickness", true, "edgeThickness", 0.5, 5, 0.5)}
                  </div>
                  
                   <div className="space-y-2">
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <div>Clique nos vértices para conectá-los. Vértices já conectados podem ser reutilizados em novas conexões.</div>
                        {style.selectedVerticesForGeneral && style.selectedVerticesForGeneral.length > 0 && (
                          <div className="mt-1">
                            <strong>Vértices selecionados:</strong> {style.selectedVerticesForGeneral.join(', ')}
                          </div>
                        )}
                        {style.selectedVerticesForGeneral && style.selectedVerticesForGeneral.length >= 4 && (
                          <div className="mt-1 text-blue-600 dark:text-blue-400">
                            <strong>Pontos de intersecção:</strong> Os pontos magenta mostram onde os segmentos se cruzam
                          </div>
                        )}
                        {style.selectedVerticesForGeneral && style.selectedVerticesForGeneral.length >= 2 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => handleStyleChange('selectedVerticesForGeneral', [] as number[])}
                          >
                            {t('button.clear_selection')}
                          </Button>
                        )}
                      </div>
                     
                   </div>
                   
                    <div className="space-y-2">
                      {style.selectedVerticesForGeneral && style.selectedVerticesForGeneral.length > 0 && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            handleStyleChange('selectedVerticesForGeneral', []);
                            handleStyleChange('intersectionPositions', []);
                            handleStyleChange('connections', []);
                            toast.success('Todas as conexões foram limpas');
                          }}
                        >
                          Limpar Conexões
                        </Button>
                      )}
                      {style.selectedVerticesForGeneral && style.selectedVerticesForGeneral.length >= 2 && (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="w-full"
                          onClick={() => {
                            const current = style.selectedVerticesForGeneral || [];
                            if (current.length >= 2) {
                              // Remove o último par (últimos 2 elementos)
                              const newSelection = current.slice(0, -2);
                              handleStyleChange('selectedVerticesForGeneral', newSelection);
                            }
                          }}
                        >
                          Apagar Último
                        </Button>
                      )}
                    </div>
                </div>
              )}
            </div>
          )}

          {/* Controles de Modo de Seleção */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              🎯 {t('vertex_modes.title')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={style.activeVertexMode === 'meridian' ? 'default' : 'outline'}
                onClick={() => {
                  console.log('=== MODO MERIDIANA DEBUG ===');
                  console.log('Modo atual:', style.activeVertexMode);
                  console.log('Planos atuais:', style.planes);
                  console.log('Vértices selecionados:', style.selectedVerticesForMeridian);
                  
                  if (style.activeVertexMode === 'meridian') {
                    handleStyleChange('activeVertexMode', 'none');
                  } else {
                    // Limpar seleções de outros modos antes de ativar meridiana
                    handleStyleChange('selectedVerticesForGeneral', []);
                    handleStyleChange('selectedVerticesForPlane', []);
                    handleStyleChange('intersectionPositions', []);
                    handleStyleChange('activeVertexMode', 'meridian');
                  }
                }}
                className="text-xs"
              >
                🔶 {t('vertex_modes.meridian')}
              </Button>
              <Button
                size="sm"
                variant={style.activeVertexMode === 'plane' ? 'default' : 'outline'}
                onClick={() => {
                  console.log('=== MODO PLANO DEBUG ===');
                  console.log('Modo atual:', style.activeVertexMode);
                  console.log('Planos atuais:', style.planes);
                  console.log('Vértices selecionados:', style.selectedVerticesForPlane);
                  console.log('showPlaneDefinition:', options.showPlaneDefinition);
                  
                  if (style.activeVertexMode === 'plane') {
                    handleStyleChange('activeVertexMode', 'none');
                  } else {
                    // Limpar seleções de outros modos antes de ativar planos
                    handleStyleChange('selectedVerticesForGeneral', []);
                    handleStyleChange('selectedVerticesForMeridian', []);
                    handleStyleChange('intersectionPositions', []);
                    handleStyleChange('activeVertexMode', 'plane');
                    
                    // Ativar automaticamente o showPlaneDefinition se não estiver ativo
                    if (!options.showPlaneDefinition) {
                      handleOptionChange('showPlaneDefinition', true);
                      toast.info('🔶 Definição de Planos ativada');
                    }
                  }
                }}
                className="text-xs"
              >
                📐 {t('vertex_modes.planes')}
              </Button>
              <Button
                size="sm"
                variant={style.activeVertexMode === 'connection' ? 'default' : 'outline'}
                onClick={() => {
                  console.log('=== MODO CONEXÃO DEBUG ===');
                  console.log('Modo atual:', style.activeVertexMode);
                  console.log('Planos atuais:', style.planes);
                  console.log('Vértices selecionados:', style.selectedVerticesForGeneral);
                  console.log('Conexões existentes:', style.connections);
                  
                  if (style.activeVertexMode === 'connection') {
                    handleStyleChange('activeVertexMode', 'none');
                  } else {
                    // Limpar seleções de outros modos antes de ativar conexões
                    console.log('Mudando para modo conexão...');
                    handleStyleChange('selectedVerticesForMeridian', []);
                    handleStyleChange('selectedVerticesForPlane', []);
                    handleStyleChange('activeVertexMode', 'connection');
                    console.log('Modo alterado para connection');
                  }
                }}
                className="text-xs"
              >
                🔗 {t('vertex_modes.connections')}
              </Button>
              <Button
                size="sm"
                variant={style.activeVertexMode === 'construction' ? 'default' : 'outline'}
                onClick={() => {
                  if (style.activeVertexMode === 'construction') {
                    handleStyleChange('activeVertexMode', 'none');
                  } else {
                    handleStyleChange('activeVertexMode', 'construction');
                  }
                }}
                className="text-xs"
              >
                📏 {t('vertex_modes.constructions')}
              </Button>
            </div>
            {style.activeVertexMode !== 'none' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Modo ativo: <strong>{style.activeVertexMode}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Definição de Planos por 3 Vértices */}
          {['cube', 'prism', 'pyramid', 'tetrahedron', 'octahedron', 'dodecahedron', 'icosahedron', 'cylinder', 'cone'].includes(params.type) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="plane-definition" className="text-sm font-medium">{t('plane_definition.title')}</Label>
                <Switch
                  id="plane-definition"
                  checked={options.showPlaneDefinition}
                  onCheckedChange={(checked) => {
                    handleOptionChange('showPlaneDefinition', checked);
                    if (checked) {
                      // Ativar automaticamente o modo de planos
                      handleStyleChange('activeVertexMode', 'plane');
                      // Limpar seleções de outros modos
                      handleStyleChange('selectedVerticesForMeridian', []);
                      handleStyleChange('selectedVerticesForGeneral', []);
                      toast.info(t('message.click_create_plane'));
                    } else {
                      // Desativar o modo quando desliga o switch
                      handleStyleChange('activeVertexMode', 'none');
                      handleStyleChange('selectedVerticesForPlane', []);
                    }
                  }}
                />
              </div>
              {options.showPlaneDefinition && (
                <div className="space-y-4">
                  {/* Indicador de Modo Ativo */}
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        MODO CRIAÇÃO DE PLANOS ATIVO
                      </p>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                      Clique em 3 vértices amarelos para definir um plano
                    </p>
                    {(style.selectedVerticesForPlane?.length || 0) > 0 && (
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Selecionados: {style.selectedVerticesForPlane?.length || 0}/3 vértices
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStyleChange('selectedVerticesForPlane', [])}
                          className="h-5 px-2 text-xs"
                        >
                          {t('button.clear')}
                        </Button>
                      </div>
                    )}
                  </div>

                  <MultiplePlanesManager 
                    style={style}
                    handleStyleChange={handleStyleChange}
                  />
                  
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    <div>• Selecione 3 vértices para definir um plano</div>
                    <div>• O vetor amarelo mostra a direção perpendicular ao plano (normal)</div>
                    <div>• A equação matemática do plano é exibida automaticamente</div>
                    <div>• Quando vértices conectados são perpendiculares, aparece um símbolo de ângulo reto (□)</div>
                    {style.selectedVerticesForPlane && style.selectedVerticesForPlane.length > 0 && (
                      <div className="mt-1">
                        <strong>Vértices selecionados:</strong> {style.selectedVerticesForPlane.join(', ')}
                        {style.selectedVerticesForPlane.length < 3 && (
                          <span className="text-yellow-600"> (Faltam {3 - style.selectedVerticesForPlane.length})</span>
                        )}
                      </div>
                    )}
                    {style.selectedVerticesForPlane && style.selectedVerticesForPlane.length >= 3 && (
                      <span className="text-green-600"> ✓ Plano definido!</span>
                    )}
                  </div>

                  {/* Controles de Cor e Opacidade do Plano */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cor do Plano</Label>
                    <div className="grid grid-cols-7 gap-1">
                      {colors.map((color) => (
                        <button
                          key={color.value}
                          className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: color.value,
                            borderColor: style.planeColor === color.value ? '#000' : '#ccc'
                          }}
                          onClick={() => handleStyleChange('planeColor', color.value)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Transparência: {(style.planeOpacity * 100).toFixed(0)}%
                    </Label>
                    <Slider
                      value={[style.planeOpacity]}
                      onValueChange={([value]) => handleStyleChange('planeOpacity', value)}
                      min={0.1}
                      max={0.8}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Botões de Controle */}
                  <div className="space-y-2">
                    {(() => {
                      console.log('=== BOTÃO CRIAR PLANO DEBUG ===');
                      console.log('selectedVerticesForPlane:', style.selectedVerticesForPlane);
                      console.log('selectedVerticesForPlane.length:', style.selectedVerticesForPlane?.length);
                      console.log('planes.length:', style.planes?.length);
                      console.log('Should show button:', style.selectedVerticesForPlane && 
                                 style.selectedVerticesForPlane.length >= 3 && 
                                 style.planes.length < 5);
                      return style.selectedVerticesForPlane && 
                             style.selectedVerticesForPlane.length >= 3 && 
                             style.planes.length < 5;
                    })() && (
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="w-full"
                        onClick={() => {
                          const currentPlanes = Array.isArray(style.planes) ? style.planes : [];
                          const currentSelection = style.selectedVerticesForPlane || [];
                          
                          console.log('=== CRIANDO NOVO PLANO (ControlPanel) ===');
                          console.log('Planos existentes:', currentPlanes);
                          console.log('Vértices selecionados:', currentSelection);
                          console.log('Active mode:', style.activeVertexMode);
                          
                          if (currentSelection.length >= 3 && currentPlanes.length < 5) {
                            // Criar novo plano com nome único
                            const planeNumber = currentPlanes.length + 1;
                            const newPlane = {
                              id: `plane-${Date.now()}-${planeNumber}`,
                              name: `Plano ${planeNumber}`,
                              vertices: [...currentSelection],
                              color: style.planeColor,
                              opacity: style.planeOpacity
                            };
                            
                            console.log('Novo plano criado:', newPlane);
                            
                            // Garantir que mantemos os planos existentes
                            const updatedPlanes = [...currentPlanes, newPlane];
                            console.log('Lista final de planos:', updatedPlanes);
                            console.log('Total de planos após criação:', updatedPlanes.length);
                            
                            // Atualizar estado de forma segura
                            onStyleChange({ ...style, planes: updatedPlanes });
                            
                            // Limpar seleção após criar plano
                            handleStyleChange('selectedVerticesForPlane', []);
                            
                            toast.success(`✅ ${newPlane.name} criado com sucesso! (${updatedPlanes.length}/5 planos)`);
                          } else if (currentSelection.length < 3) {
                            toast.error('⚠️ Selecione pelo menos 3 vértices para criar um plano');
                          } else if (currentPlanes.length >= 5) {
                            toast.error('⚠️ Limite máximo de 5 planos atingido');
                          }
                        }}
                      >
                        {t('interaction.create_plane')} ({style.planes.length}/5)
                      </Button>
                    )}
                    
                    {style.planes.length >= 5 && (
                      <div className="text-xs text-yellow-600 bg-yellow-100/20 p-2 rounded">
                        Limite máximo de 5 planos atingido
                      </div>
                    )}

                    {/* Lista de planos existentes */}
                    {style.planes && style.planes.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Planos Criados ({style.planes.length}/5)
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {style.planes.map((plane, index) => (
                            <div key={plane.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded border" 
                                  style={{ backgroundColor: plane.color }}
                                ></div>
                                <span>{plane.name}</span>
                                <span className="text-gray-500">({plane.vertices.length} vértices)</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={() => {
                                  const updatedPlanes = style.planes.filter(p => p.id !== plane.id);
                                  onStyleChange({ ...style, planes: updatedPlanes });
                                  toast.success(`${plane.name} removido`);
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-red-600 hover:text-red-700"
                          onClick={() => {
                            onStyleChange({ ...style, planes: [] });
                            toast.success('Todos os planos removidos');
                          }}
                        >
                          {t('button.clear_planes')}
                        </Button>
                      </div>
                    )}

                    {style.selectedVerticesForPlane && style.selectedVerticesForPlane.length > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleStyleChange('selectedVerticesForPlane', [] as number[])}
                      >
                        {t('button.clear_selection')}
                      </Button>
                    )}
                  </div>

                  {/* Lista de Planos Criados */}
                  {style.planes && style.planes.length > 0 && (
                    <div className="space-y-3 mt-4 border-t pt-3">
                      <Label className="text-sm font-medium">Planos Criados ({style.planes.length}/5)</Label>
                      {style.planes.map((plane, index) => (
                        <div key={plane.id} className="bg-muted/30 p-3 rounded space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Plano {index + 1}</span>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => {
                                const newPlanes = style.planes.filter(p => p.id !== plane.id);
                                onStyleChange({ ...style, planes: newPlanes });
                                toast.success('Plano removido!');
                              }}
                              className="h-6 w-6 p-0"
                            >
                              ×
                            </Button>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            Vértices: {plane.vertices.join(', ')}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Cor</Label>
                            <div className="grid grid-cols-7 gap-1">
                              {colors.map((color) => (
                                <button
                                  key={color.value}
                                  className="w-4 h-4 rounded border hover:scale-110 transition-transform"
                                  style={{
                                    backgroundColor: color.value,
                                    borderColor: plane.color === color.value ? '#000' : '#ccc'
                                  }}
                                  onClick={() => {
                                    const updatedPlanes = style.planes.map(p => 
                                      p.id === plane.id ? { ...p, color: color.value } : p
                                    );
                                    onStyleChange({ ...style, planes: updatedPlanes });
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">
                              Transparência: {(plane.opacity * 100).toFixed(0)}%
                            </Label>
                            <Slider
                              value={[plane.opacity]}
                              onValueChange={([value]) => {
                                const updatedPlanes = style.planes.map(p => 
                                  p.id === plane.id ? { ...p, opacity: value } : p
                                );
                                onStyleChange({ ...style, planes: updatedPlanes });
                              }}
                              min={0.1}
                              max={0.8}
                              step={0.1}
                              className="w-full h-2"
                            />
                          </div>
                        </div>
                      ))}
                      
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="w-full mt-2"
                        onClick={() => {
                          onStyleChange({ ...style, planes: [] });
                          toast.success('Todos os planos foram removidos!');
                        }}
                      >
                        {t('button.clear_planes')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              </div>
            )}

          {/* Opção para formas equiláteras */}
          {['cylinder', 'cone'].includes(params.type) && (
            <div className="flex items-center justify-between">
              <Label htmlFor="equilateral" className="text-sm font-medium">Forma Equilátera</Label>
              <Switch
                id="equilateral"
                checked={options.isEquilateral}
                onCheckedChange={(checked) => handleOptionChange('isEquilateral', checked)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formas Inscritas e Circunscritas */}
      <Card className="control-section">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">{t('shapes.inscribed_circumscribed')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Para Cubo */}
          {params.type === 'cube' && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="cube-diagonal" className="text-sm font-medium">Diagonal do Cubo</Label>
                <Switch
                  id="cube-diagonal"
                  checked={options.showCubeDiagonal}
                  onCheckedChange={(checked) => handleOptionChange('showCubeDiagonal', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="inscribed-sphere-cube" className="text-sm font-medium">Esfera Inscrita</Label>
                <Switch
                  id="inscribed-sphere-cube"
                  checked={options.showInscribedSphere}
                  onCheckedChange={(checked) => handleOptionChange('showInscribedSphere', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="circumscribed-sphere-cube" className="text-sm font-medium">Esfera Circunscrita</Label>
                <Switch
                  id="circumscribed-sphere-cube"
                  checked={options.showCircumscribedSphere}
                  onCheckedChange={(checked) => handleOptionChange('showCircumscribedSphere', checked)}
                />
              </div>
            </>
          )}

          {/* Para Esfera */}
          {params.type === 'sphere' && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="inscribed-cube-sphere" className="text-sm font-medium">Cubo Inscrito</Label>
                <Switch
                  id="inscribed-cube-sphere"
                  checked={options.showInscribedCube}
                  onCheckedChange={(checked) => handleOptionChange('showInscribedCube', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="circumscribed-cube-sphere" className="text-sm font-medium">Cubo Circunscrito</Label>
                <Switch
                  id="circumscribed-cube-sphere"
                  checked={options.showCircumscribedCube}
                  onCheckedChange={(checked) => handleOptionChange('showCircumscribedCube', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="inscribed-cylinder-sphere" className="text-sm font-medium">Cilindro Equilátero Inscrito</Label>
                <Switch
                  id="inscribed-cylinder-sphere"
                  checked={options.showInscribedCylinder}
                  onCheckedChange={(checked) => handleOptionChange('showInscribedCylinder', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="circumscribed-cylinder-sphere" className="text-sm font-medium">Cilindro Equilátero Circunscrito</Label>
                <Switch
                  id="circumscribed-cylinder-sphere"
                  checked={options.showCircumscribedCylinder}
                  onCheckedChange={(checked) => handleOptionChange('showCircumscribedCylinder', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="inscribed-cone-sphere" className="text-sm font-medium">Cone Inscrito</Label>
                <Switch
                  id="inscribed-cone-sphere"
                  checked={options.showInscribedCone}
                  onCheckedChange={(checked) => handleOptionChange('showInscribedCone', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="circumscribed-cone-sphere" className="text-sm font-medium">Cone Circunscrito</Label>
                <Switch
                  id="circumscribed-cone-sphere"
                  checked={options.showCircumscribedCone}
                  onCheckedChange={(checked) => handleOptionChange('showCircumscribedCone', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="inscribed-octahedron" className="text-sm font-medium">Octaedro Inscrito</Label>
                <Switch
                  id="inscribed-octahedron"
                  checked={options.showInscribedOctahedron}
                  onCheckedChange={(checked) => handleOptionChange('showInscribedOctahedron', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="spherical-segment" className="text-sm font-medium">Fuso Esférico</Label>
                <Switch
                  id="spherical-segment"
                  checked={options.showSphericalSegment}
                  onCheckedChange={(checked) => handleOptionChange('showSphericalSegment', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="spherical-sector" className="text-sm font-medium">Cunha Esférica</Label>
                <Switch
                  id="spherical-sector"
                  checked={options.showSphericalSector}
                  onCheckedChange={(checked) => handleOptionChange('showSphericalSector', checked)}
                />
              </div>
              {(options.showSphericalSegment || options.showSphericalSector) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Ângulo: {options.sphereSegmentAngle}°
                  </Label>
                  <Slider
                    value={[options.sphereSegmentAngle]}
                    onValueChange={([value]) => handleOptionChange('sphereSegmentAngle', value)}
                    min={10}
                    max={360}
                    step={5}
                    className="w-full"
                  />
                </div>
               )}
               
               {/* Controles de qualidade das esferas */}
                {(params.type === 'sphere' || options.showInscribedSphere || options.showCircumscribedSphere) && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Qualidade das Esferas</Label>
                     <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Meridianos: {options.sphereWidthSegments}
                      </Label>
                      <Slider
                        value={[options.sphereWidthSegments]}
                        onValueChange={([value]) => handleOptionChange('sphereWidthSegments', value)}
                        min={2}
                        max={30}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Paralelos: {options.sphereHeightSegments}
                      </Label>
                      <Slider
                        value={[options.sphereHeightSegments]}
                        onValueChange={([value]) => handleOptionChange('sphereHeightSegments', value)}
                        min={2}
                        max={30}
                        step={1}
                       className="w-full"
                     />
                    </div>
                     {/* Controle de geratrizes para cilindros */}
                     {(options.showInscribedCylinder || options.showCircumscribedCylinder) && (
                       <div>
                         <Label className="text-xs text-muted-foreground">
                           Geratrizes do Cilindro: {style.cylinderGeneratrices}
                         </Label>
                         <Slider
                           value={[style.cylinderGeneratrices]}
                           onValueChange={([value]) => handleStyleChange('cylinderGeneratrices', value)}
                           min={2}
                           max={8}
                           step={1}
                           className="w-full"
                         />
                       </div>
                     )}
                     {/* Controle de geratrizes para cones */}
                     {(options.showInscribedCone || options.showCircumscribedCone) && (
                       <div>
                         <Label className="text-xs text-muted-foreground">
                           Geratrizes do Cone: {style.coneGeneratrices}
                         </Label>
                         <Slider
                           value={[style.coneGeneratrices]}
                           onValueChange={([value]) => handleStyleChange('coneGeneratrices', value)}
                           min={2}
                           max={20}
                           step={1}
                           className="w-full"
                         />
                       </div>
                     )}
                    </div>
                  </div>
                )}

                {/* Controles de opacidade, espessura e cor das arestas para sólidos inscritos */}
                {(options.showInscribedCube || options.showInscribedSphere || options.showInscribedCylinder || options.showInscribedCone || options.showInscribedOctahedron) && (
                  <div className="space-y-4 p-3 bg-muted/30 rounded-lg">
                    <Label className="text-sm font-medium text-primary">Controles dos Sólidos Inscritos</Label>
                    
                    {/* Opacidade dos sólidos inscritos */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Opacidade: {Math.round((style.inscribedShapeOpacity || 0.4) * 100)}%
                      </Label>
                      <Slider
                        value={[style.inscribedShapeOpacity || 0.4]}
                        onValueChange={([value]) => handleStyleChange('inscribedShapeOpacity', value)}
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    {/* Cor das arestas dos sólidos inscritos */}
                    {renderColorPicker("Cor das Arestas Inscritas", "inscribedEdgeColor", true, "inscribedEdgeColor")}
                    
                    {/* Espessura das arestas dos sólidos inscritos */}
                    {renderThicknessControl("Espessura das Arestas Inscritas", "inscribedEdgeThickness", true, "inscribedEdgeThickness")}
                  </div>
                )}

                {/* Controles de opacidade, espessura e cor das arestas para sólidos circunscritos */}
                {(options.showCircumscribedCube || options.showCircumscribedSphere || options.showCircumscribedCylinder || options.showCircumscribedCone) && (
                  <div className="space-y-4 p-3 bg-muted/30 rounded-lg">
                    <Label className="text-sm font-medium text-primary">Controles dos Sólidos Circunscritos</Label>
                    
                    {/* Opacidade dos sólidos circunscritos */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Opacidade: {Math.round((style.circumscribedShapeOpacity || 0.3) * 100)}%
                      </Label>
                      <Slider
                        value={[style.circumscribedShapeOpacity || 0.3]}
                        onValueChange={([value]) => handleStyleChange('circumscribedShapeOpacity', value)}
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    {/* Cor das arestas dos sólidos circunscritos */}
                    {renderColorPicker("Cor das Arestas Circunscritas", "circumscribedEdgeColor", true, "circumscribedEdgeColor")}
                    
                    {/* Espessura das arestas dos sólidos circunscritos */}
                    {renderThicknessControl("Espessura das Arestas Circunscritas", "circumscribedEdgeThickness", true, "circumscribedEdgeThickness")}
                  </div>
                )}
             </>
           )}

           {/* Para Cilindro */}
          {params.type === 'cylinder' && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="inscribed-sphere-cylinder" className="text-sm font-medium">Esfera Inscrita</Label>
                <Switch
                  id="inscribed-sphere-cylinder"
                  checked={options.showInscribedSphere}
                  onCheckedChange={(checked) => handleOptionChange('showInscribedSphere', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="circumscribed-sphere-cylinder" className="text-sm font-medium">Esfera Circunscrita</Label>
                <Switch
                  id="circumscribed-sphere-cylinder"
                  checked={options.showCircumscribedSphere}
                  onCheckedChange={(checked) => handleOptionChange('showCircumscribedSphere', checked)}
                />
              </div>
            </>
          )}

          {/* Para Cone */}
          {params.type === 'cone' && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="inscribed-sphere-cone" className="text-sm font-medium">Esfera Inscrita</Label>
                <Switch
                  id="inscribed-sphere-cone"
                  checked={options.showInscribedSphere}
                  onCheckedChange={(checked) => handleOptionChange('showInscribedSphere', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="circumscribed-sphere-cone" className="text-sm font-medium">Esfera Circunscrita</Label>
                <Switch
                  id="circumscribed-sphere-cone"
                  checked={options.showCircumscribedSphere}
                  onCheckedChange={(checked) => handleOptionChange('showCircumscribedSphere', checked)}
                />
              </div>
            </>
          )}

          {!['cube', 'sphere', 'cylinder', 'cone'].includes(params.type) && (
            <p className="text-sm text-muted-foreground text-center py-4">
{t('shapes.instruction')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Style Options */}
      <Card className="control-section">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">{t('panel.style')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('colors.edge_color')}</Label>
            <Select value={style.edgeColor} onValueChange={(value) => handleStyleChange('edgeColor', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('colors.meridian_section_color')}</Label>
            <Select value={style.heightLineColor} onValueChange={(value) => handleStyleChange('heightLineColor', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('colors.height_color')}</Label>
            <Select value={style.heightLineColor} onValueChange={(value) => handleStyleChange('heightLineColor', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('colors.face_color')}</Label>
              <Select value={style.faceColor} onValueChange={(value) => handleStyleChange('faceColor', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('colors.inscribed_circumference_color')}</Label>
              <Select value={style.inscribedCircleColor} onValueChange={(value) => handleStyleChange('inscribedCircleColor', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('colors.circumscribed_circumference_color')}</Label>
              <Select value={style.circumscribedCircleColor} onValueChange={(value) => handleStyleChange('circumscribedCircleColor', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('colors.inscribed_shapes_color')}</Label>
            <Select value={style.inscribedShapeColor} onValueChange={(value) => handleStyleChange('inscribedShapeColor', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cores individuais para sólidos inscritos */}
          {(options.showInscribedSphere || options.showInscribedCube || options.showInscribedCone || options.showInscribedCylinder || options.showInscribedOctahedron) && (
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-medium text-primary">Cores Individuais</Label>
              
              {options.showInscribedSphere && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Esfera Inscrita</Label>
                  <Select value={style.inscribedSphereColor} onValueChange={(value) => handleStyleChange('inscribedSphereColor', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {options.showInscribedCube && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Cubo Inscrito</Label>
                  <Select value={style.inscribedCubeColor} onValueChange={(value) => handleStyleChange('inscribedCubeColor', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {options.showInscribedCone && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Cone Inscrito</Label>
                  <Select value={style.inscribedConeColor} onValueChange={(value) => handleStyleChange('inscribedConeColor', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {options.showInscribedCylinder && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Cilindro Inscrito</Label>
                  <Select value={style.inscribedCylinderColor} onValueChange={(value) => handleStyleChange('inscribedCylinderColor', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {options.showInscribedOctahedron && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Octaedro Inscrito</Label>
                  <Select value={style.inscribedOctahedronColor} onValueChange={(value) => handleStyleChange('inscribedOctahedronColor', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('colors.circumscribed_shapes_color')}</Label>
            <Select value={style.circumscribedShapeColor} onValueChange={(value) => handleStyleChange('circumscribedShapeColor', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('colors.meridian_section_color')}</Label>
            <Select 
              value={style.meridianSectionColor} 
              onValueChange={(value) => handleStyleChange('meridianSectionColor', value)}
              disabled={!options.showMeridianSection}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
{t('opacity.meridian_section')}: {(style.meridianSectionOpacity * 100).toFixed(0)}%
            </Label>
            <Slider
              value={[style.meridianSectionOpacity]}
              onValueChange={([value]) => handleStyleChange('meridianSectionOpacity', value)}
              min={0.1}
              max={1}
              step={0.1}
              className="w-full"
              disabled={!options.showMeridianSection}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
{t('opacity.general')}: {(style.faceOpacity * 100).toFixed(0)}%
            </Label>
            <Slider
              value={[style.faceOpacity]}
              onValueChange={([value]) => handleStyleChange('faceOpacity', value)}
              min={0.1}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Controles de opacidade para formas inscritas e circunscritas */}
          {params.type === 'sphere' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Opacidade Formas Inscritas: {(style.inscribedShapeOpacity * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[style.inscribedShapeOpacity]}
                  onValueChange={([value]) => handleStyleChange('inscribedShapeOpacity', value)}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Opacidade Formas Circunscritas: {(style.circumscribedShapeOpacity * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[style.circumscribedShapeOpacity]}
                  onValueChange={([value]) => handleStyleChange('circumscribedShapeOpacity', value)}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Opacidade Segmentos Esféricos: {(style.sphericalSegmentOpacity * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[style.sphericalSegmentOpacity]}
                  onValueChange={([value]) => handleStyleChange('sphericalSegmentOpacity', value)}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cor Segmentos Esféricos</Label>
                <Select value={style.sphericalSegmentColor} onValueChange={(value) => handleStyleChange('sphericalSegmentColor', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">
{t('speed.rotation')}: {style.rotationSpeed.toFixed(1)}x
            </Label>
            <Slider
              value={[style.rotationSpeed]}
              onValueChange={([value]) => handleStyleChange('rotationSpeed', value)}
              min={0.1}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Interactive Controls */}
      <Card className="control-section">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">{t('controls.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant={options.activeTool === 'pan' ? "default" : "outline"}
            onClick={() => onOptionsChange({ ...options, activeTool: options.activeTool === 'pan' ? 'none' : 'pan' })}
            className="w-full"
          >
            <Hand className="w-4 h-4 mr-2" />
            {options.activeTool === 'pan' ? 'Navegação Melhorada' : 'Navegação Normal'}
          </Button>

          <Button
            variant={options.autoRotate ? "default" : "outline"}
            onClick={() => handleOptionChange('autoRotate', !options.autoRotate)}
            className="w-full"
          >
            {options.autoRotate ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pausar Rotação
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
{t('controls.auto_rotation')}
              </>
            )}
          </Button>


          <ImageDownloadMenu 
            onExport={(format, quality) => onExportImage(format, quality)}
          />
        </CardContent>
      </Card>

      {/* Properties Display */}
      <Card className="control-section">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">{t('panel.properties')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {properties.baseArea && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('properties.base_area')}:</span>
              <span className="font-mono">{formatNumber(properties.baseArea)}</span>
            </div>
          )}
          {properties.lateralArea && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Área Lateral:</span>
              <span className="font-mono">{formatNumber(properties.lateralArea)}</span>
            </div>
          )}
          {properties.totalArea && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('properties.total_area_label')}</span>
              <span className="font-mono">{formatNumber(properties.totalArea)}</span>
            </div>
          )}
          {properties.surfaceArea && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Área Superfície:</span>
              <span className="font-mono">{formatNumber(properties.surfaceArea)}</span>
            </div>
          )}
          {properties.inscribedRadius && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('properties.inscribed_radius_label')}</span>
              <span className="font-mono">{formatNumber(properties.inscribedRadius)}</span>
            </div>
          )}
          {properties.circumscribedRadius && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('properties.circumscribed_radius_label')}</span>
              <span className="font-mono">{formatNumber(properties.circumscribedRadius)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-sm font-medium">
            <span className="text-primary">{t('properties.volume_label')}</span>
            <span className="font-mono text-primary">{formatNumber(properties.volume)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Cálculos Geométricos */}
      <GeometryCalculations params={params} />

      {/* Mesa Digitalizadora - Movida para a barra superior */}

    </div>
  );
}