import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { GeometryParams, VisualizationOptions, StyleOptions, GeometryProperties } from '@/types/geometry';
import MultiplePlanesManager from '@/components/MultiplePlanesManager';
import { toast } from 'sonner';

export interface PanelProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
  properties: GeometryProperties;
  onParamsChange: (params: GeometryParams) => void;
  onOptionsChange: (options: VisualizationOptions) => void;
  onStyleChange: (style: StyleOptions) => void;
}

export default function VisualizationPanel({
  params,
  options,
  style,
  properties,
  onParamsChange,
  onOptionsChange,
  onStyleChange,
}: PanelProps) {
  const { t } = useTranslation();

  // Estado para controlar visibilidade de controles de cor e espessura
  const [colorSelectors, setColorSelectors] = useState<{[key: string]: boolean}>({});
  const [thicknessSelectors, setThicknessSelectors] = useState<{[key: string]: boolean}>({});

  const handleOptionChange = (key: keyof VisualizationOptions, value: boolean | number) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const handleStyleChange = (key: keyof StyleOptions, value: string | number | number[]) => {
    onStyleChange({ ...style, [key]: value });
  };

  const colors = [
    { value: '#ffffff', label: 'Branco' },
    { value: '#3b82f6', label: 'Azul' },
    { value: '#8b5cf6', label: 'Roxo' },
    { value: '#06b6d4', label: 'Ciano' },
    { value: '#10b981', label: 'Verde' },
    { value: '#f59e0b', label: 'Amarelo' },
    { value: '#ef4444', label: 'Vermelho' },
    { value: '#6b7280', label: 'Cinza' },
  ];

  // Funcao para renderizar um seletor de cor
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
            {isVisible ? '\u2713' : 'Cor'}
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

  // Funcao para renderizar controle de espessura
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
            {isVisible ? '\u2713' : 'Espessura'}
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

  return (
    <div className="space-y-4">
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

          {/* Controles especificos para formas poligonais */}
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
                    {renderColorPicker("Cor da Circunferencia Inscrita", "inscribedCircleColor", true, "inscribedCircle")}
                    {renderThicknessControl("Espessura da Circunferencia Inscrita", "inscribedCircleThickness", true, "inscribedCircleThickness")}
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
                    {renderColorPicker("Cor da Circunferencia Circunscrita", "circumscribedCircleColor", true, "circumscribedCircle")}
                    {renderThicknessControl("Espessura da Circunferencia Circunscrita", "circumscribedCircleThickness", true, "circumscribedCircleThickness")}
                  </>
                )}
              </div>
            </>
          )}

          {/* Controles especificos para poliedros de Platao */}
          {['tetrahedron', 'octahedron'].includes(params.type) && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="tetrahedron-base-apothem" className="text-sm font-medium">Apotema da Base</Label>
                <Switch
                  id="tetrahedron-base-apothem"
                  checked={options.showBaseApothem}
                  onCheckedChange={(checked) => handleOptionChange('showBaseApothem', checked)}
                />
              </div>
            </>
          )}

          {/* Controles especificos para piramides */}
          {params.type === 'pyramid' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lateral-apothem" className="text-sm font-medium">Apotema da Piramide</Label>
                  <Switch
                    id="lateral-apothem"
                    checked={options.showLateralApothem}
                    onCheckedChange={(checked) => handleOptionChange('showLateralApothem', checked)}
                  />
                </div>
                {options.showLateralApothem && (
                  <>
                    {renderColorPicker("Cor do Apotema da Piramide", "lateralApothemColor", true, "lateralApothem")}
                    {renderThicknessControl("Espessura do Apotema da Piramide", "lateralApothemThickness", true, "lateralApothemThickness")}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="base-apothem" className="text-sm font-medium">Apotema da Base</Label>
                  <Switch
                    id="base-apothem"
                    checked={options.showBaseApothem}
                    onCheckedChange={(checked) => handleOptionChange('showBaseApothem', checked)}
                  />
                </div>
                {options.showBaseApothem && (
                  <>
                    {renderColorPicker("Cor do Apotema da Base", "baseApothemColor", true, "baseApothem")}
                    {renderThicknessControl("Espessura do Apotema da Base", "baseApothemThickness", true, "baseApothemThickness")}
                  </>
                )}
              </div>
            </>
          )}

          {/* Controles especificos para cones */}
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

          {/* Altura da Secao Transversal */}
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
                  handleStyleChange('activeVertexMode', 'meridian');
                  handleStyleChange('selectedVerticesForGeneral', []);
                  handleStyleChange('selectedVerticesForPlane', []);
                  toast.info(t('message.meridian_mode_activated'));
                } else if (!checked) {
                  handleStyleChange('activeVertexMode', 'none');
                  handleStyleChange('selectedVerticesForMeridian', []);
                }
              }}
              disabled={!['cylinder', 'cone', 'cube', 'prism', 'tetrahedron', 'octahedron', 'dodecahedron', 'icosahedron', 'pyramid', 'sphere'].includes(params.type)}
            />
          </div>

          {/* Selecao de vertices para secao meridiana */}
          {['prism', 'cube', 'tetrahedron', 'pyramid', 'cylinder', 'cone'].includes(params.type) && options.showMeridianSection && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="vertex-selection" className="text-sm font-medium">Selecionar Vertices</Label>
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
                      MODO SECAO MERIDIANA ATIVO
                    </p>
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">
                    Selecione 2 vertices (laranja) para definir plano meridiano
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
                  Clique em dois vertices nao consecutivos para definir a secao meridiana.
                  {style.selectedVerticesForMeridian.length > 0 && (
                    <div className="mt-1">
                      Vertices selecionados: {style.selectedVerticesForMeridian.join(', ')}
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

          {/* Altura da Secao Meridiana */}
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
          {/* Conectores de Vertices */}
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
                      handleStyleChange('activeVertexMode', 'connection');
                      handleStyleChange('selectedVerticesForMeridian', []);
                      handleStyleChange('selectedVerticesForPlane', []);
                      toast.info(t('message.connection_mode_activated'));
                    } else {
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
                        CONECTAR VERTICES ATIVO
                      </p>
                    </div>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                      Clique em 2 vertices amarelos para criar uma conexao
                    </p>
                    {(style.connections?.length || 0) > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                        {style.connections?.length || 0} conexoes criadas
                      </p>
                    )}
                    {(style.selectedVerticesForGeneral?.length || 0) > 0 && (
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          Conectados: {style.selectedVerticesForGeneral?.length || 0} vertices
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
                      <div>Clique nos vertices para conecta-los. Vertices ja conectados podem ser reutilizados em novas conexoes.</div>
                      {style.selectedVerticesForGeneral && style.selectedVerticesForGeneral.length > 0 && (
                        <div className="mt-1">
                          <strong>Vertices selecionados:</strong> {style.selectedVerticesForGeneral.join(', ')}
                        </div>
                      )}
                      {style.selectedVerticesForGeneral && style.selectedVerticesForGeneral.length >= 4 && (
                        <div className="mt-1 text-blue-600 dark:text-blue-400">
                          <strong>Pontos de interseccao:</strong> Os pontos magenta mostram onde os segmentos se cruzam
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
                          toast.success('Todas as conexoes foram limpas');
                        }}
                      >
                        Limpar Conexoes
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
                            const newSelection = current.slice(0, -2);
                            handleStyleChange('selectedVerticesForGeneral', newSelection);
                          }
                        }}
                      >
                        Apagar Ultimo
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Controles de Modo de Selecao */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('vertex_modes.title')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={style.activeVertexMode === 'meridian' ? 'default' : 'outline'}
                onClick={() => {
                  if (style.activeVertexMode === 'meridian') {
                    handleStyleChange('activeVertexMode', 'none');
                  } else {
                    handleStyleChange('selectedVerticesForGeneral', []);
                    handleStyleChange('selectedVerticesForPlane', []);
                    handleStyleChange('intersectionPositions', []);
                    handleStyleChange('activeVertexMode', 'meridian');
                  }
                }}
                className="text-xs"
              >
                {t('vertex_modes.meridian')}
              </Button>
              <Button
                size="sm"
                variant={style.activeVertexMode === 'plane' ? 'default' : 'outline'}
                onClick={() => {
                  if (style.activeVertexMode === 'plane') {
                    handleStyleChange('activeVertexMode', 'none');
                  } else {
                    handleStyleChange('selectedVerticesForGeneral', []);
                    handleStyleChange('selectedVerticesForMeridian', []);
                    handleStyleChange('intersectionPositions', []);
                    handleStyleChange('activeVertexMode', 'plane');

                    if (!options.showPlaneDefinition) {
                      handleOptionChange('showPlaneDefinition', true);
                      toast.info('Definicao de Planos ativada');
                    }
                  }
                }}
                className="text-xs"
              >
                {t('vertex_modes.planes')}
              </Button>
              <Button
                size="sm"
                variant={style.activeVertexMode === 'connection' ? 'default' : 'outline'}
                onClick={() => {
                  if (style.activeVertexMode === 'connection') {
                    handleStyleChange('activeVertexMode', 'none');
                  } else {
                    handleStyleChange('selectedVerticesForMeridian', []);
                    handleStyleChange('selectedVerticesForPlane', []);
                    handleStyleChange('activeVertexMode', 'connection');
                  }
                }}
                className="text-xs"
              >
                {t('vertex_modes.connections')}
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
                {t('vertex_modes.constructions')}
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

          {/* Definicao de Planos por 3 Vertices */}
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
                      handleStyleChange('activeVertexMode', 'plane');
                      handleStyleChange('selectedVerticesForMeridian', []);
                      handleStyleChange('selectedVerticesForGeneral', []);
                      toast.info(t('message.click_create_plane'));
                    } else {
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
                        MODO CRIACAO DE PLANOS ATIVO
                      </p>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                      Clique em 3 vertices amarelos para definir um plano
                    </p>
                    {(style.selectedVerticesForPlane?.length || 0) > 0 && (
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Selecionados: {style.selectedVerticesForPlane?.length || 0}/3 vertices
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
                    <div>Selecione 3 vertices para definir um plano</div>
                    <div>O vetor amarelo mostra a direcao perpendicular ao plano (normal)</div>
                    <div>A equacao matematica do plano e exibida automaticamente</div>
                    <div>Quando vertices conectados sao perpendiculares, aparece um simbolo de angulo reto</div>
                    {style.selectedVerticesForPlane && style.selectedVerticesForPlane.length > 0 && (
                      <div className="mt-1">
                        <strong>Vertices selecionados:</strong> {style.selectedVerticesForPlane.join(', ')}
                        {style.selectedVerticesForPlane.length < 3 && (
                          <span className="text-yellow-600"> (Faltam {3 - style.selectedVerticesForPlane.length})</span>
                        )}
                      </div>
                    )}
                    {style.selectedVerticesForPlane && style.selectedVerticesForPlane.length >= 3 && (
                      <span className="text-green-600"> Plano definido!</span>
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
                            borderColor: style.planeColor === color.value ? '#000' : '#ccc',
                          }}
                          onClick={() => handleStyleChange('planeColor', color.value)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Transparencia: {(style.planeOpacity * 100).toFixed(0)}%
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

                  {/* Botoes de Controle */}
                  <div className="space-y-2">
                    {style.selectedVerticesForPlane &&
                      style.selectedVerticesForPlane.length >= 3 &&
                      style.planes.length < 5 && (
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full"
                          onClick={() => {
                            const currentPlanes = Array.isArray(style.planes) ? style.planes : [];
                            const currentSelection = style.selectedVerticesForPlane || [];

                            if (currentSelection.length >= 3 && currentPlanes.length < 5) {
                              const planeNumber = currentPlanes.length + 1;
                              const newPlane = {
                                id: `plane-${Date.now()}-${planeNumber}`,
                                name: `Plano ${planeNumber}`,
                                vertices: [...currentSelection],
                                color: style.planeColor,
                                opacity: style.planeOpacity,
                              };

                              const updatedPlanes = [...currentPlanes, newPlane];
                              onStyleChange({ ...style, planes: updatedPlanes });
                              handleStyleChange('selectedVerticesForPlane', []);
                              toast.success(`${newPlane.name} criado com sucesso! (${updatedPlanes.length}/5 planos)`);
                            } else if (currentSelection.length < 3) {
                              toast.error('Selecione pelo menos 3 vertices para criar um plano');
                            } else if (currentPlanes.length >= 5) {
                              toast.error('Limite maximo de 5 planos atingido');
                            }
                          }}
                        >
                          {t('interaction.create_plane')} ({style.planes.length}/5)
                        </Button>
                      )}

                    {style.planes.length >= 5 && (
                      <div className="text-xs text-yellow-600 bg-yellow-100/20 p-2 rounded">
                        Limite maximo de 5 planos atingido
                      </div>
                    )}

                    {/* Lista de planos existentes */}
                    {style.planes && style.planes.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Planos Criados ({style.planes.length}/5)
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {style.planes.map((plane) => (
                            <div key={plane.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded border"
                                  style={{ backgroundColor: plane.color }}
                                ></div>
                                <span>{plane.name}</span>
                                <span className="text-gray-500">({plane.vertices.length} vertices)</span>
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
                                x
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
                              x
                            </Button>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Vertices: {plane.vertices.join(', ')}
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
                                    borderColor: plane.color === color.value ? '#000' : '#ccc',
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
                              Transparencia: {(plane.opacity * 100).toFixed(0)}%
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

          {/* Opcao para formas equilateras */}
          {['cylinder', 'cone'].includes(params.type) && (
            <div className="flex items-center justify-between">
              <Label htmlFor="equilateral" className="text-sm font-medium">Forma Equilatera</Label>
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
                <Label htmlFor="inscribed-cylinder-sphere" className="text-sm font-medium">Cilindro Equilatero Inscrito</Label>
                <Switch
                  id="inscribed-cylinder-sphere"
                  checked={options.showInscribedCylinder}
                  onCheckedChange={(checked) => handleOptionChange('showInscribedCylinder', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="circumscribed-cylinder-sphere" className="text-sm font-medium">Cilindro Equilatero Circunscrito</Label>
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
                <Label htmlFor="spherical-segment" className="text-sm font-medium">Fuso Esferico</Label>
                <Switch
                  id="spherical-segment"
                  checked={options.showSphericalSegment}
                  onCheckedChange={(checked) => handleOptionChange('showSphericalSegment', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="spherical-sector" className="text-sm font-medium">Cunha Esferica</Label>
                <Switch
                  id="spherical-sector"
                  checked={options.showSphericalSector}
                  onCheckedChange={(checked) => handleOptionChange('showSphericalSector', checked)}
                />
              </div>
              {(options.showSphericalSegment || options.showSphericalSector) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Angulo: {options.sphereSegmentAngle} graus
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

              {/* Controles de opacidade, espessura e cor das arestas para solidos inscritos */}
              {(options.showInscribedCube || options.showInscribedSphere || options.showInscribedCylinder || options.showInscribedCone || options.showInscribedOctahedron) && (
                <div className="space-y-4 p-3 bg-muted/30 rounded-lg">
                  <Label className="text-sm font-medium text-primary">Controles dos Solidos Inscritos</Label>

                  {/* Opacidade dos solidos inscritos */}
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

                  {/* Cor das arestas dos solidos inscritos */}
                  {renderColorPicker("Cor das Arestas Inscritas", "inscribedEdgeColor", true, "inscribedEdgeColor")}

                  {/* Espessura das arestas dos solidos inscritos */}
                  {renderThicknessControl("Espessura das Arestas Inscritas", "inscribedEdgeThickness", true, "inscribedEdgeThickness")}
                </div>
              )}

              {/* Controles de opacidade, espessura e cor das arestas para solidos circunscritos */}
              {(options.showCircumscribedCube || options.showCircumscribedSphere || options.showCircumscribedCylinder || options.showCircumscribedCone) && (
                <div className="space-y-4 p-3 bg-muted/30 rounded-lg">
                  <Label className="text-sm font-medium text-primary">Controles dos Solidos Circunscritos</Label>

                  {/* Opacidade dos solidos circunscritos */}
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

                  {/* Cor das arestas dos solidos circunscritos */}
                  {renderColorPicker("Cor das Arestas Circunscritas", "circumscribedEdgeColor", true, "circumscribedEdgeColor")}

                  {/* Espessura das arestas dos solidos circunscritos */}
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
    </div>
  );
}
