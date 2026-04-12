import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GeometryParams, VisualizationOptions, StyleOptions, GeometryProperties } from '@/types/geometry';
import { formatNumber } from '@/lib/geometry-calculations';
import { GeometryCalculations } from '@/components/GeometryCalculations';

export interface PanelProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
  properties: GeometryProperties;
  onParamsChange: (params: GeometryParams) => void;
  onOptionsChange: (options: VisualizationOptions) => void;
  onStyleChange: (style: StyleOptions) => void;
}

export default function PropertiesPanel({
  params,
  properties,
}: PanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
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
              <span className="text-muted-foreground">Area Lateral:</span>
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
              <span className="text-muted-foreground">Area Superficie:</span>
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

      {/* Secao de Calculos Geometricos */}
      <GeometryCalculations params={params} />
    </div>
  );
}
