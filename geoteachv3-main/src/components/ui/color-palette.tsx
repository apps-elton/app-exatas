import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ColorPaletteProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  label?: string;
  className?: string;
}

const predefinedColors = [
  '#ffffff', // Branco
  '#ff0000', // Vermelho
  '#00ff00', // Verde
  '#0000ff', // Azul
  '#ffff00', // Amarelo
  '#ff00ff', // Magenta
  '#00ffff', // Ciano
  '#ff8800', // Laranja
  '#8800ff', // Roxo
  '#00ff88', // Verde claro
  '#ff0088', // Rosa
  '#88ff00', // Verde lima
  '#0088ff', // Azul claro
  '#ff6600', // Laranja escuro
  '#6600ff', // Violeta
  '#00ff66', // Verde água
  '#ff0066', // Vermelho rosa
  '#66ff00', // Lima
  '#0066ff', // Azul médio
  '#ffaa00', // Âmbar
  '#aa00ff', // Púrpura
  '#00aaff', // Azul celeste
  '#ff00aa', // Fúcsia
  '#aaff00', // Verde amarelado
  '#00ffaa', // Turquesa
];

export function ColorPalette({ selectedColor, onColorChange, label, className }: ColorPaletteProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="grid grid-cols-8 gap-1 p-2 border rounded-lg bg-background">
        {predefinedColors.map((color) => (
          <Button
            key={color}
            variant="outline"
            size="sm"
            className={cn(
              "w-8 h-8 p-0 border-2 rounded-md hover:scale-110 transition-transform",
              selectedColor === color ? "ring-2 ring-primary ring-offset-1" : ""
            )}
            style={{ backgroundColor: color }}
            onClick={() => onColorChange(color)}
            aria-label={`Selecionar cor ${color}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-12 h-8 border rounded cursor-pointer"
          title="Cor personalizada"
        />
        <span className="text-sm text-muted-foreground">
          Cor atual: {selectedColor}
        </span>
      </div>
    </div>
  );
}