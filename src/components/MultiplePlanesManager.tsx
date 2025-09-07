import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { StyleOptions } from '@/types/geometry';
import { toast } from 'sonner';

interface MultiplePlanesManagerProps {
  style: StyleOptions;
  handleStyleChange: (key: string, value: any) => void;
}

const colors = [
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Amarelo', value: '#f59e0b' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Roxo', value: '#8b5cf6' }
];

export default function MultiplePlanesManager({ 
  style, 
  handleStyleChange 
}: MultiplePlanesManagerProps) {
  const maxPlanes = style.maxPlanes || 1;
  const activePlaneIndex = style.activePlaneIndex || 0;
  const planeConfigs = style.planeConfigs || [];

  const initializePlaneConfigs = (numPlanes: number) => {
    const configs = Array.from({length: numPlanes}, (_, i) => ({
      id: i + 1,
      color: colors[i % colors.length].value,
      opacity: 0.3,
      vertices: [] as number[],
      created: false
    }));
    handleStyleChange('planeConfigs', configs);
    handleStyleChange('activePlaneIndex', 0);
    
    // Aplicar configuração do primeiro plano
    if (configs[0]) {
      handleStyleChange('planeColor', configs[0].color);
      handleStyleChange('planeOpacity', configs[0].opacity);
    }
  };

  const selectActivePlane = (index: number) => {
    handleStyleChange('activePlaneIndex', index);
    
    // Carregar configurações do plano selecionado
    const planeConfig = planeConfigs[index];
    if (planeConfig) {
      handleStyleChange('planeColor', planeConfig.color);
      handleStyleChange('planeOpacity', planeConfig.opacity);
    }
  };

  const updatePlaneConfig = (property: string, value: any) => {
    const configs = [...planeConfigs];
    if (configs[activePlaneIndex]) {
      configs[activePlaneIndex] = {
        ...configs[activePlaneIndex],
        [property]: value
      };
      handleStyleChange('planeConfigs', configs);
    }
  };

  const createPlane = () => {
    const currentPlanes = Array.isArray(style.planes) ? style.planes : [];
    const currentSelection = style.selectedVerticesForPlane || [];
    const planeNumber = activePlaneIndex + 1;
    
    if (currentSelection.length >= 3) {
      // Criar novo plano com ID único baseado no índice
      const newPlane = {
        id: `plane-${Date.now()}-${planeNumber}-multi`,
        name: `Plano ${planeNumber}`,
        vertices: [...currentSelection],
        color: style.planeColor,
        opacity: style.planeOpacity
      };
      
      // Remover plano anterior com o mesmo número se existir
      const filteredPlanes = currentPlanes.filter(p => !p.id.includes(`-${planeNumber}-`));
      const updatedPlanes = [...filteredPlanes, newPlane];
      
      // Atualizar configurações
      const configs = [...planeConfigs];
      if (configs[activePlaneIndex]) {
        configs[activePlaneIndex] = {
          ...configs[activePlaneIndex],
          vertices: currentSelection,
          created: true
        };
        handleStyleChange('planeConfigs', configs);
      }
      
      handleStyleChange('planes', updatedPlanes);
      handleStyleChange('selectedVerticesForPlane', []);
      
      toast.success(`${newPlane.name} criado com sucesso!`);
    }
  };

  const removePlane = (planeId: string) => {
    const newPlanes = style.planes.filter(p => p.id !== planeId);
    handleStyleChange('planes', newPlanes);
    
    // Marcar configuração como não criada
    const planeNumber = parseInt(planeId.split('-')[2]);
    const configs = [...planeConfigs];
    if (configs[planeNumber - 1]) {
      configs[planeNumber - 1].created = false;
      handleStyleChange('planeConfigs', configs);
    }
    
    toast.success('Plano removido!');
  };

  const removeAllPlanes = () => {
    handleStyleChange('planes', []);
    
    // Reset todas as configurações
    const configs = planeConfigs.map(config => ({
      ...config,
      vertices: [],
      created: false
    }));
    handleStyleChange('planeConfigs', configs);
    
    toast.success('Todos os planos foram removidos!');
  };

  return (
    <div className="space-y-4">
      {/* Controle de Número de Planos */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Configurar Planos</Label>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Número de planos:</Label>
          <select 
            className="px-2 py-1 text-xs border rounded bg-background"
            value={maxPlanes}
            onChange={(e) => {
              const numPlanes = parseInt(e.target.value);
              handleStyleChange('maxPlanes', numPlanes);
              initializePlaneConfigs(numPlanes);
            }}
          >
            {[1,2,3,4,5].map(num => (
              <option key={num} value={num}>{num} plano{num > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Seletor de Plano Ativo */}
      {maxPlanes > 1 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Plano Ativo</Label>
          <div className="flex gap-1 flex-wrap">
            {Array.from({length: maxPlanes}).map((_, i) => {
              const isActive = activePlaneIndex === i;
              const planeConfig = planeConfigs[i];
              const isCreated = planeConfig?.created || style.planes?.some(p => p.id.includes(`-${i + 1}-`));
              
              return (
                <button
                  key={i}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : isCreated
                        ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                        : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  }`}
                  onClick={() => selectActivePlane(i)}
                >
                  Plano {i + 1} {isCreated ? '✓' : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Configurações do Plano Ativo */}
      <div className="space-y-3 p-3 bg-muted/20 rounded">
        <Label className="text-sm font-medium">
          Configurações - Plano {activePlaneIndex + 1}
        </Label>

        {/* Instruções */}
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2 rounded">
          <div>• Selecione 3 vértices para definir um plano</div>
          <div>• O vetor amarelo mostra a direção perpendicular do plano (normal)</div>
          <div>• A equação matemática do plano é exibida automaticamente</div>
          <div>• Quando vértices conectados são perpendiculares, aparece um símbolo de ângulo reto (∟)</div>
        </div>

        {/* Status da Seleção */}
        {style.selectedVerticesForPlane && style.selectedVerticesForPlane.length > 0 && (
          <div className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
            <strong>Vértices selecionados:</strong> {style.selectedVerticesForPlane.join(', ')}
            {style.selectedVerticesForPlane.length < 3 && (
              <span className="text-amber-600"> (Faltam {3 - style.selectedVerticesForPlane.length})</span>
            )}
            {style.selectedVerticesForPlane.length >= 3 && (
              <span className="text-green-600"> ✓ Plano definido!</span>
            )}
          </div>
        )}

        {/* Controles de Cor do Plano */}
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
                onClick={() => {
                  handleStyleChange('planeColor', color.value);
                  updatePlaneConfig('color', color.value);
                }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Controle de Transparência */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Transparência: {(style.planeOpacity * 100).toFixed(0)}%
          </Label>
          <Slider
            value={[style.planeOpacity]}
            onValueChange={([value]) => {
              handleStyleChange('planeOpacity', value);
              updatePlaneConfig('opacity', value);
            }}
            min={0.1}
            max={0.8}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Botões de Controle */}
        <div className="space-y-2">
          {style.selectedVerticesForPlane && style.selectedVerticesForPlane.length >= 3 && (
            <Button 
              size="sm" 
              variant="default" 
              className="w-full"
              onClick={createPlane}
            >
              Criar Plano {activePlaneIndex + 1}
            </Button>
          )}

          {style.selectedVerticesForPlane && style.selectedVerticesForPlane.length > 0 && (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => handleStyleChange('selectedVerticesForPlane', [])}
            >
              Limpar Seleção
            </Button>
          )}
        </div>
      </div>

      {/* Lista de Planos Criados */}
      {style.planes && style.planes.length > 0 && (
        <div className="space-y-3 mt-4 border-t pt-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Planos Criados ({style.planes.length})</Label>
            <Button 
              size="sm" 
              variant="destructive" 
              className="h-6 text-xs px-2"
              onClick={removeAllPlanes}
            >
              Remover Todos
            </Button>
          </div>
          
          <div className="space-y-2">
            {style.planes.map((plane) => (
              <div key={plane.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded border" 
                    style={{backgroundColor: plane.color}}
                  />
                  <span className="font-medium">{plane.name}</span>
                  <span className="text-muted-foreground">
                    ({plane.vertices.join(', ')})
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removePlane(plane.id)}
                  className="h-4 w-4 p-0 hover:bg-red-100"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}