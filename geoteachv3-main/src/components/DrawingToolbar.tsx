import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  MousePointer, 
  Pen, 
  Highlighter, 
  Eraser, 
  Type, 
  Square, 
  Circle, 
  Minus,
  Trash2,
  Undo2,
  Redo2,
  Save
} from 'lucide-react';
import { DrawingTool, DrawingOptions, PEN_PRESETS, DRAWING_COLORS } from '@/types/drawing';
import { cn } from '@/lib/utils';

interface DrawingToolbarProps {
  options: DrawingOptions;
  onOptionsChange: (options: DrawingOptions) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function DrawingToolbar({
  options,
  onOptionsChange,
  onClear,
  onUndo,
  onRedo,
  onSave,
  canUndo,
  canRedo
}: DrawingToolbarProps) {
  
  const handleToolChange = (tool: DrawingTool) => {
    onOptionsChange({ ...options, tool });
  };

  const handleColorChange = (color: string) => {
    onOptionsChange({ ...options, color });
  };

  const handleStrokeWidthChange = (width: number[]) => {
    onOptionsChange({ ...options, strokeWidth: width[0] });
  };

  const handleOpacityChange = (opacity: number[]) => {
    onOptionsChange({ ...options, opacity: opacity[0] });
  };

  const applyPreset = (preset: typeof PEN_PRESETS[0]) => {
    onOptionsChange({
      ...options,
      tool: 'pen',
      strokeWidth: preset.strokeWidth,
      opacity: preset.opacity,
      color: preset.color
    });
  };

  const tools = [
    { id: 'select' as DrawingTool, icon: MousePointer, label: 'Selecionar' },
    { id: 'pen' as DrawingTool, icon: Pen, label: 'Caneta' },
    { id: 'highlighter' as DrawingTool, icon: Highlighter, label: 'Marca-texto' },
    { id: 'eraser' as DrawingTool, icon: Eraser, label: 'Borracha' },
    { id: 'text' as DrawingTool, icon: Type, label: 'Texto' },
    { id: 'rectangle' as DrawingTool, icon: Square, label: 'Retângulo' },
    { id: 'circle' as DrawingTool, icon: Circle, label: 'Círculo' },
    { id: 'line' as DrawingTool, icon: Minus, label: 'Linha' }
  ];

  return (
    <Card className="p-4 bg-card/95 backdrop-blur border-border/50">
      <div className="flex flex-wrap items-center gap-4">
        {/* Tools */}
        <div className="flex items-center gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={options.tool === tool.id ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToolChange(tool.id)}
                className={cn(
                  "h-9 w-9 p-0",
                  options.tool === tool.id && "bg-primary text-primary-foreground"
                )}
                title={tool.label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Pen Presets */}
        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground mr-2">Presets:</Label>
          {PEN_PRESETS.map((preset, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => applyPreset(preset)}
              className="h-9 w-9 p-0 text-lg"
              title={preset.name}
            >
              {preset.icon}
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Colors */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Cor:</Label>
          <div className="flex items-center gap-1">
            {DRAWING_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={cn(
                  "w-7 h-7 rounded border-2 transition-all",
                  options.color === color 
                    ? "border-primary scale-110" 
                    : "border-border hover:border-muted-foreground"
                )}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Stroke Width */}
        <div className="flex items-center gap-3 min-w-[120px]">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">
            Espessura: {options.strokeWidth}px
          </Label>
          <Slider
            value={[options.strokeWidth]}
            onValueChange={handleStrokeWidthChange}
            min={1}
            max={50}
            step={1}
            className="flex-1"
          />
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Opacity */}
        <div className="flex items-center gap-3 min-w-[120px]">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">
            Opacidade: {Math.round(options.opacity * 100)}%
          </Label>
          <Slider
            value={[options.opacity]}
            onValueChange={handleOpacityChange}
            min={0.1}
            max={1}
            step={0.1}
            className="flex-1"
          />
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-9 w-9 p-0"
            title="Desfazer"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-9 w-9 p-0"
            title="Refazer"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-9 w-9 p-0 text-destructive hover:text-destructive"
            title="Limpar tudo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            className="h-9 w-9 p-0"
            title="Salvar"
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}