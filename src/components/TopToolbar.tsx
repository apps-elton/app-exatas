import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Navigation, 
  Minus, 
  Ruler, 
  Triangle, 
  BarChart3, 
  Circle,
  Square,
  RotateCcw,
  Move,
  Compass,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  Calculator,
  Undo2,
  Palette
} from 'lucide-react';
import { VisualizationOptions } from '@/types/geometry';

interface TopToolbarProps {
  options: VisualizationOptions;
  onOptionsChange: (options: VisualizationOptions) => void;
  isTabletActive?: boolean;
  onTabletToggle?: (active: boolean) => void;
}

export default function TopToolbar({ options, onOptionsChange, isTabletActive = false, onTabletToggle }: TopToolbarProps) {
  const tools = [
    {
      id: 'none',
      icon: <Navigation className="w-5 h-5" />,
      label: 'Seleção',
      description: 'Ferramenta de seleção padrão'
    },
    {
      id: 'midpoint',
      icon: <Circle className="w-5 h-5" />,
      label: 'Ponto Médio',
      description: 'Criar ponto médio entre dois vértices'
    },
    {
      id: 'vertex-connector',
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Conectar',
      description: 'Conectar vértices'
    },
    {
      id: 'perpendicular',
      icon: <Square className="w-5 h-5" />,
      label: 'Perpendicular',
      description: 'Criar linha perpendicular'
    }
  ];

  const handleToolSelect = (toolId: string) => {
    const newTool = toolId === options.activeTool ? 'none' : toolId;
    onOptionsChange({ ...options, activeTool: newTool as any });
  };

  return (
    <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-xl">
      {/* Ferramentas geométricas com design premium */}
      <div className="flex items-center gap-3">
        <div className="text-sm font-semibold text-slate-300 mr-2">Ferramentas:</div>
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={options.activeTool === tool.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolSelect(tool.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              options.activeTool === tool.id
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-blue-400 shadow-lg shadow-blue-500/25'
                : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white border-slate-600 hover:border-slate-500 shadow-md hover:shadow-lg'
            }`}
            title={tool.description}
          >
            <div className={`p-1 rounded-lg ${options.activeTool === tool.id ? 'bg-white/20' : 'bg-slate-600/20'}`}>
              {tool.icon}
            </div>
            <span className="font-semibold text-sm">{tool.label}</span>
          </Button>
        ))}
      </div>

      {/* Separador elegante */}
      <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-500 to-transparent mx-2" />

      

      

      {/* Ações com design melhorado */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white border-slate-600 hover:border-slate-500 shadow-md transition-all duration-200"
        >
          <Undo2 className="w-4 h-4" />
          <span className="font-medium text-sm">Desfazer</span>
        </Button>

        {/* Botão para limpar pontos médios */}
        {options.activeTool === 'midpoint' && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/50 hover:bg-red-800/50 text-red-300 hover:text-white border-red-600 hover:border-red-500 shadow-md transition-all duration-200"
            onClick={() => {
              onOptionsChange({ ...options, activeTool: 'none' });
            }}
          >
            <Circle className="w-4 h-4" />
            <span className="font-medium text-sm">Limpar Pontos</span>
          </Button>
        )}
      </div>
    </div>
  );
}
