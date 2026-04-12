import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { GeometryParams, VisualizationOptions, StyleOptions, GeometryProperties } from '@/types/geometry';

export interface PanelProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
  properties: GeometryProperties;
  onParamsChange: (params: GeometryParams) => void;
  onOptionsChange: (options: VisualizationOptions) => void;
  onStyleChange: (style: StyleOptions) => void;
}

export default function StylePanel({
  params,
  options,
  style,
  properties,
  onParamsChange,
  onOptionsChange,
  onStyleChange,
}: PanelProps) {
  const { t } = useTranslation();

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

  const renderColorSelect = (label: string, colorKey: keyof StyleOptions, disabled: boolean = false) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Select value={style[colorKey] as string} onValueChange={(value) => handleStyleChange(colorKey, value)} disabled={disabled}>
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
  );

  return (
    <div className="space-y-4">
      {/* Style Options */}
      <Card className="control-section">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">{t('panel.style')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderColorSelect(t('colors.edge_color'), 'edgeColor')}
          {renderColorSelect(t('colors.meridian_section_color'), 'heightLineColor')}
          {renderColorSelect(t('colors.height_color'), 'heightLineColor')}
          {renderColorSelect(t('colors.face_color'), 'faceColor')}
          {renderColorSelect(t('colors.inscribed_circumference_color'), 'inscribedCircleColor')}
          {renderColorSelect(t('colors.circumscribed_circumference_color'), 'circumscribedCircleColor')}
          {renderColorSelect(t('colors.inscribed_shapes_color'), 'inscribedShapeColor')}

          {/* Cores individuais para solidos inscritos */}
          {(options.showInscribedSphere || options.showInscribedCube || options.showInscribedCone || options.showInscribedCylinder || options.showInscribedOctahedron) && (
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-medium text-primary">Cores Individuais</Label>

              {options.showInscribedSphere && renderColorSelect('Esfera Inscrita', 'inscribedSphereColor')}
              {options.showInscribedCube && renderColorSelect('Cubo Inscrito', 'inscribedCubeColor')}
              {options.showInscribedCone && renderColorSelect('Cone Inscrito', 'inscribedConeColor')}
              {options.showInscribedCylinder && renderColorSelect('Cilindro Inscrito', 'inscribedCylinderColor')}
              {options.showInscribedOctahedron && renderColorSelect('Octaedro Inscrito', 'inscribedOctahedronColor')}
            </div>
          )}

          {renderColorSelect(t('colors.circumscribed_shapes_color'), 'circumscribedShapeColor')}
          {renderColorSelect(t('colors.meridian_section_color'), 'meridianSectionColor', !options.showMeridianSection)}

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
                  Opacidade Segmentos Esfericos: {(style.sphericalSegmentOpacity * 100).toFixed(0)}%
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
              {renderColorSelect('Cor Segmentos Esfericos', 'sphericalSegmentColor')}
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
    </div>
  );
}
