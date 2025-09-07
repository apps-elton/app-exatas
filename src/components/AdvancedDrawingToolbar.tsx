import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  PenTool, 
  Undo2, 
  Redo2, 
  Trash2, 
  Download,
  Palette,
  Eye,
  EyeOff,
  Eraser,
  Calculator,
  MousePointer,
  Type,
  Settings,
  Compass,
  Ruler,
  Square,
  Triangle
} from 'lucide-react';
import EquationEditor from './EquationEditor';
import { DRAWING_COLORS } from '@/types/drawing';
import { ConstructionType } from './geometry/GeometricConstructions';

type ToolType = 'select' | 'pen' | 'eraser' | 'text';

interface AdvancedDrawingToolbarProps {
  isDrawingMode: boolean;
  tool: ToolType;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  canUndo: boolean;
  canRedo: boolean;
  onToggleDrawing: () => void;
  onToolChange: (tool: ToolType) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onOpacityChange: (opacity: number) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExportCombined: () => void;
  onEquationAdd?: (latex: string, rendered: string) => void;
  // Construções geométricas
  showGeometricConstructions?: boolean;
  selectedConstruction?: ConstructionType;
  selectedVerticesCount?: number;
  onToggleConstructions?: () => void;
  onConstructionSelect?: (construction: ConstructionType) => void;
  onClearConstructionSelection?: () => void;
  onClearConstructions?: () => void;
  onClearPlanes?: () => void;
  constructionsCount?: number;
  planesCount?: number;
}

const ERASER_SIZES = [
  { name: 'Pequena', value: 10 },
  { name: 'Média', value: 20 },
  { name: 'Grande', value: 35 },
  { name: 'Extra Grande', value: 50 },
  { name: 'Gigante', value: 75 }
];

const BRUSH_SIZES = [
  { name: 'Muito Fina', value: 1 },
  { name: 'Fina', value: 2 },
  { name: 'Normal', value: 4 },
  { name: 'Grossa', value: 8 },
  { name: 'Muito Grossa', value: 12 },
  { name: 'Extra Grossa', value: 20 }
];

const TEXT_SIZES = [
  { name: 'Pequeno', value: 3 },
  { name: 'Normal', value: 5 },
  { name: 'Grande', value: 8 },
  { name: 'Extra Grande', value: 12 },
  { name: 'Gigante', value: 16 }
];

export default function AdvancedDrawingToolbar({
  isDrawingMode,
  tool,
  strokeColor,
  strokeWidth,
  opacity,
  canUndo,
  canRedo,
  onToggleDrawing,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onOpacityChange,
  onClear,
  onUndo,
  onRedo,
  onSave,
  onExportCombined,
  onEquationAdd,
  // Construções geométricas
  showGeometricConstructions = false,
  selectedConstruction = null,
  selectedVerticesCount = 0,
  onToggleConstructions,
  onConstructionSelect,
  onClearConstructionSelection,
  onClearConstructions,
  onClearPlanes,
  constructionsCount = 0,
  planesCount = 0
}: AdvancedDrawingToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const getToolName = (toolType: ToolType): string => {
    switch (toolType) {
      case 'select': return 'Seleção';
      case 'pen': return 'Caneta';
      case 'eraser': return 'Borracha';
      case 'text': return 'Texto';
      default: return 'Ferramenta';
    }
  };

  const getSizeOptions = () => {
    switch (tool) {
      case 'eraser': return ERASER_SIZES;
      case 'text': return TEXT_SIZES;
      default: return BRUSH_SIZES;
    }
  };

  const getSizeLabel = () => {
    switch (tool) {
      case 'eraser': return 'Tamanho da Borracha';
      case 'text': return 'Tamanho do Texto';
      default: return 'Espessura da Caneta';
    }
  };

  return (
    <Card className="p-3 bg-card/95 backdrop-blur-sm border-border/50 shadow-lg">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Drawing Mode Toggle */}
        <Button
          variant={isDrawingMode ? "default" : "outline"}
          size="sm"
          onClick={onToggleDrawing}
          className={`flex items-center gap-2 transition-all ${
            isDrawingMode 
              ? 'bg-primary text-primary-foreground shadow-[var(--glow-primary)]' 
              : 'hover:bg-primary/10'
          }`}
        >
          {isDrawingMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <PenTool className="w-4 h-4" />
          {isDrawingMode ? 'Desativar Desenho' : 'Ativar Desenho'}
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Tools */}
        <div className="flex items-center gap-2">
          <Button
            variant={tool === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('select')}
            disabled={!isDrawingMode}
            title="Seleção - Clique para selecionar e mover elementos"
          >
            <MousePointer className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('pen')}
            disabled={!isDrawingMode}
            title="Caneta - Desenhe à mão livre"
          >
            <PenTool className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('eraser')}
            disabled={!isDrawingMode}
            title="Borracha - Apaga desenhos e elementos"
          >
            <Eraser className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('text')}
            disabled={!isDrawingMode}
            title="Texto - Clique para adicionar texto"
          >
            <Type className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Color Picker - Hide for select tool */}
        {tool !== 'select' && (
          <>
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium flex items-center gap-1 text-muted-foreground">
                <Palette className="w-3 h-3" />
                Cor:
              </Label>
              <div className="flex gap-1">
                {DRAWING_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                      strokeColor === color 
                        ? 'border-primary shadow-lg scale-110 ring-2 ring-primary/30' 
                        : 'border-border hover:border-accent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => onColorChange(color)}
                    title={`Cor ${color}`}
                    disabled={!isDrawingMode}
                  />
                ))}
              </div>
            </div>

            <Separator orientation="vertical" className="h-8" />
          </>
        )}

        {/* Size Control with Quick Options */}
        {tool !== 'select' && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground">
                {getSizeLabel()}: {strokeWidth}{tool === 'text' ? '' : 'px'}
              </Label>
              <div className="flex items-center gap-2">
                {/* Quick size buttons */}
                <div className="flex gap-1">
                  {getSizeOptions().slice(0, 3).map((size) => (
                    <Button
                      key={size.value}
                      variant={strokeWidth === size.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => onStrokeWidthChange(size.value)}
                      disabled={!isDrawingMode}
                      className="h-6 px-2 text-xs"
                      title={`${size.name} (${size.value}${tool === 'text' ? '' : 'px'})`}
                    >
                      {size.name.charAt(0)}
                    </Button>
                  ))}
                </div>
                
                {/* Size selector dropdown */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!isDrawingMode}
                      className="h-6 px-2"
                      title="Mais opções de tamanho"
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{getSizeLabel()}</Label>
                      <div className="grid gap-1">
                        {getSizeOptions().map((size) => (
                          <Button
                            key={size.value}
                            variant={strokeWidth === size.value ? "default" : "ghost"}
                            size="sm"
                            onClick={() => onStrokeWidthChange(size.value)}
                            className="justify-start h-8"
                          >
                            {size.name} ({size.value}{tool === 'text' ? '' : 'px'})
                          </Button>
                        ))}
                      </div>
                      
                      {/* Custom slider */}
                      <div className="pt-2 border-t">
                        <Label className="text-xs">Personalizado:</Label>
                        <Slider
                          value={[strokeWidth]}
                          onValueChange={([value]) => onStrokeWidthChange(value)}
                          min={tool === 'eraser' ? 5 : tool === 'text' ? 1 : 1}
                          max={tool === 'eraser' ? 100 : tool === 'text' ? 20 : 30}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {/* Opacity - Hide for eraser and select */}
        {tool !== 'eraser' && tool !== 'select' && (
          <>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-3 min-w-[120px]">
              <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Opacidade: {Math.round(opacity * 100)}%
              </Label>
              <Slider
                value={[opacity]}
                onValueChange={([value]) => onOpacityChange(value)}
                min={0.1}
                max={1}
                step={0.1}
                className="flex-1"
                disabled={!isDrawingMode}
              />
            </div>
          </>
        )}

        <Separator orientation="vertical" className="h-8" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo || !isDrawingMode}
            title="Desfazer (Ctrl+Z)"
            className="hover:bg-accent/10"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo || !isDrawingMode}
            title="Refazer (Ctrl+Y)"
            className="hover:bg-accent/10"
          >
            <Redo2 className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={!isDrawingMode}
            title="Limpar tudo"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={!isDrawingMode}
            title="Baixar apenas desenho"
            className="hover:bg-accent/10"
          >
            <Download className="w-4 h-4" />
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onExportCombined}
            title="Baixar geometria + desenho"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Completo
          </Button>

          {/* Equation Editor */}
          {onEquationAdd && (
            <EquationEditor onEquationAdd={onEquationAdd} />
          )}
        </div>

        {/* Construções Geométricas */}
        {onToggleConstructions && (
          <>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-2">
              <Button
                variant={showGeometricConstructions ? "default" : "outline"}
                size="sm"
                onClick={onToggleConstructions}
                title="Ativar construções geométricas"
                className={`flex items-center gap-2 transition-all ${
                  showGeometricConstructions 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'hover:bg-secondary/10'
                }`}
              >
                <Compass className="w-4 h-4" />
                {showGeometricConstructions ? 'Desativar' : 'Construções'}
              </Button>

              {/* Botões rápidos de construção */}
              {showGeometricConstructions && onConstructionSelect && (
                <>
                  <Button
                    variant={selectedConstruction === 'reta-perpendicular' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onConstructionSelect('reta-perpendicular')}
                    title="Reta Perpendicular"
                    className="h-8 px-2"
                  >
                    <span className="text-sm font-mono">⊥</span>
                  </Button>
                  
                  <Button
                    variant={selectedConstruction === 'reta-paralela' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onConstructionSelect('reta-paralela')}
                    title="Reta Paralela"
                    className="h-8 px-2"
                  >
                    <span className="text-sm font-mono">||</span>
                  </Button>
                  
                  <Button
                    variant={selectedConstruction === 'mediatriz' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onConstructionSelect('mediatriz')}
                    title="Mediatriz"
                    className="h-8 px-2"
                  >
                    <Ruler className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant={selectedConstruction === 'bissetriz' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onConstructionSelect('bissetriz')}
                    title="Bissetriz"
                    className="h-8 px-2"
                  >
                    <Triangle className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant={selectedConstruction === 'reta-tangente' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onConstructionSelect('reta-tangente')}
                    title="Reta Tangente"
                    className="h-8 px-2"
                  >
                    <span className="text-sm font-mono">⟱</span>
                  </Button>

                  <Button
                    variant={selectedConstruction === 'ponto-medio' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onConstructionSelect('ponto-medio')}
                    title="Ponto Médio"
                    className="h-8 px-2"
                  >
                    <span className="text-sm font-mono">•</span>
                  </Button>

                  <Button
                    variant={selectedConstruction === 'segmento-reta' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onConstructionSelect('segmento-reta')}
                    title="Segmento de Reta"
                    className="h-8 px-2"
                  >
                    <span className="text-sm font-mono">—</span>
                  </Button>

                  {selectedVerticesCount > 0 && onClearConstructionSelection && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={onClearConstructionSelection}
                      title="Limpar seleção de vértices"
                      className="h-8 px-2"
                    >
                      <span className="text-xs">✕</span>
                    </Button>
                  )}

                  {/* Botões para limpar construções e planos */}
                  {(constructionsCount > 0 || planesCount > 0) && (
                    <>
                      {constructionsCount > 0 && onClearConstructions && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={onClearConstructions}
                          title={`Limpar todas as construções (${constructionsCount})`}
                          className="h-8 px-2"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          <span className="text-xs">{constructionsCount}</span>
                        </Button>
                      )}
                      
                      {planesCount > 0 && onClearPlanes && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={onClearPlanes}
                          title={`Limpar todos os planos (${planesCount})`}
                          className="h-8 px-2"
                        >
                          <Square className="w-3 h-3 mr-1" />
                          <span className="text-xs">{planesCount}</span>
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Tool Info */}
      {isDrawingMode && (
        <div className="mt-2 p-2 bg-muted/20 rounded text-xs text-muted-foreground">
          <strong>Ferramenta Ativa:</strong> {getToolName(tool)} 
          {tool === 'select' && ' - Clique nos elementos para selecioná-los. Use Delete para remover.'}
          {tool === 'pen' && ' - Clique e arraste para desenhar.'}
          {tool === 'eraser' && ' - Clique nos elementos ou arraste para apagar.'}
          {tool === 'text' && ' - Clique onde deseja adicionar texto.'}
        </div>
      )}
    </Card>
  );
}