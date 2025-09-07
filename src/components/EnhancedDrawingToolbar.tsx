import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  Calculator
} from 'lucide-react';
import EquationEditor from './EquationEditor';
import { DRAWING_COLORS } from '@/types/drawing';

type ToolType = 'pen' | 'eraser';

interface EnhancedDrawingToolbarProps {
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
}

export default function EnhancedDrawingToolbar({
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
  onEquationAdd
}: EnhancedDrawingToolbarProps) {
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
          {isDrawingMode ? 'Desativar Caneta' : 'Ativar Caneta'}
        </Button>
        {/* Ferramentas */}
        <div className="flex items-center gap-2">
          <Button
            variant={tool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('pen')}
            disabled={!isDrawingMode}
            title="Caneta"
          >
            <PenTool className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('eraser')}
            disabled={!isDrawingMode}
            title="Borracha - Apaga desenhos existentes"
          >
            <Eraser className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Color Picker */}
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

        {/* Stroke Width */}
        <div className="flex items-center gap-3 min-w-[120px]">
          <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {tool === 'eraser' ? 'Tam. Borracha:' : 'Espessura:'} {strokeWidth}px
          </Label>
          <Slider
            value={[strokeWidth]}
            onValueChange={([value]) => onStrokeWidthChange(value)}
            min={tool === 'eraser' ? 5 : 1}
            max={tool === 'eraser' ? 50 : 20}
            step={1}
            className="flex-1"
            disabled={!isDrawingMode}
          />
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Opacity */}
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
            title="Limpar desenho"
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

          {/* Editor de Equações */}
          {onEquationAdd && (
            <EquationEditor onEquationAdd={onEquationAdd} />
          )}
        </div>
      </div>
    </Card>
  );
}