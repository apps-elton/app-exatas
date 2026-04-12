import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConstructionType } from './GeometricConstructions';

interface GeometricConstructionPanelProps {
  selectedConstruction: ConstructionType;
  onConstructionSelect: (construction: ConstructionType) => void;
  onClearSelection?: () => void;
  selectedVerticesCount: number;
}

export function GeometricConstructionPanel({
  selectedConstruction,
  onConstructionSelect,
  onClearSelection,
  selectedVerticesCount
}: GeometricConstructionPanelProps) {
  const { t } = useTranslation();

  const constructionOptions = [
    {
      type: 'segmento-reta' as ConstructionType,
      label: t('constructions.line_segment'),
      description: 'Conectar dois pontos com um segmento',
      icon: '━',
      requiredPoints: 2
    },
    {
      type: 'ponto-medio' as ConstructionType,
      label: t('constructions.midpoint'),
      description: 'Encontrar o ponto médio entre dois pontos',
      icon: '⬤',
      requiredPoints: 2
    },
    {
      type: 'reta-perpendicular' as ConstructionType,
      label: t('constructions.perpendicular_line'),
      description: 'Reta perpendicular a uma linha passando por um ponto',
      icon: '⊥',
      requiredPoints: 3
    },
    {
      type: 'reta-paralela' as ConstructionType,
      label: t('constructions.parallel_line'),
      description: 'Reta paralela a uma linha passando por um ponto',
      icon: '||',
      requiredPoints: 3
    },
    {
      type: 'mediatriz' as ConstructionType,
      label: t('constructions.perpendicular_bisector'),
      description: 'Reta perpendicular que passa pelo ponto médio de um segmento',
      icon: '⊥⌐',
      requiredPoints: 2
    },
    {
      type: 'bissetriz' as ConstructionType,
      label: t('constructions.angle_bisector'),
      description: 'Reta que divide um ângulo ao meio',
      icon: '∠÷',
      requiredPoints: 3
    },
    {
      type: 'reta-tangente' as ConstructionType,
      label: t('constructions.tangent_line'),
      description: 'Reta tangente passando por um ponto',
      icon: '⟱',
      requiredPoints: 2
    }
  ];

  const getButtonVariant = (constructionType: ConstructionType) => {
    return selectedConstruction === constructionType ? 'default' : 'outline';
  };

  const isConstructionReady = (requiredPoints: number) => {
    return selectedVerticesCount >= requiredPoints;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {t('drawing.constructions')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {constructionOptions.map((option) => (
          <div key={option.type} className="flex flex-col space-y-1">
            <Button
              variant={getButtonVariant(option.type)}
              onClick={() => onConstructionSelect(option.type)}
              className="w-full justify-start text-left h-auto py-3"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl font-mono w-8 text-center">
                  {option.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {option.requiredPoints} ponto{option.requiredPoints > 1 ? 's' : ''} necessário{option.requiredPoints > 1 ? 's' : ''}
                  </div>
                </div>
                {selectedConstruction === option.type && isConstructionReady(option.requiredPoints) && (
                  <span className="text-green-500 text-sm">✓</span>
                )}
              </div>
            </Button>
          </div>
        ))}
        
        <div className="pt-4 border-t space-y-2">
          <div className="text-sm text-muted-foreground">
            Pontos selecionados: {selectedVerticesCount}
          </div>
          
          {selectedConstruction && (
            <div className="text-xs text-muted-foreground">
              {constructionOptions.find(opt => opt.type === selectedConstruction)?.description}
            </div>
          )}
          
          {selectedVerticesCount > 0 && onClearSelection && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onClearSelection}
              className="w-full"
            >
              {t('button.clear_selection')}
            </Button>
          )}
          
          {selectedConstruction && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onConstructionSelect(null)}
              className="w-full"
            >
              Desativar Construção
            </Button>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          <strong>Como usar:</strong><br/>
          1. Selecione um tipo de construção<br/>
          2. Clique nos vértices da figura 3D<br/>
          3. A construção aparecerá automaticamente
        </div>
      </CardContent>
    </Card>
  );
}

export default GeometricConstructionPanel;