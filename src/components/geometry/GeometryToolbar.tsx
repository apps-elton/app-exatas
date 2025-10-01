import React from 'react';
import { Button } from '@/components/ui/button';
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
  AlignVerticalJustifyCenter
} from 'lucide-react';
import { VisualizationOptions } from '@/types/geometry';

interface GeometryToolbarProps {
  options: VisualizationOptions;
  onOptionsChange: (options: VisualizationOptions) => void;
}

export default function GeometryToolbar({ options, onOptionsChange }: GeometryToolbarProps) {
  const tools = [
    {
      id: 'none',
      icon: <Navigation className="w-4 h-4" />,
      label: 'Seleção',
      description: 'Ferramenta de seleção padrão'
    },
    {
      id: 'midpoint',
      icon: <Circle className="w-4 h-4" />,
      label: 'Ponto Médio',
      description: 'Criar ponto médio entre dois vértices'
    },
    {
      id: 'parallel',
      icon: <Minus className="w-4 h-4" />,
      label: 'Paralela',
      description: 'Criar linha paralela'
    },
    {
      id: 'angle',
      icon: <Compass className="w-4 h-4" />,
      label: 'Ângulo',
      description: 'Medir ângulo entre linhas'
    },
    {
      id: 'measure',
      icon: <Ruler className="w-4 h-4" />,
      label: 'Medir',
      description: 'Medir distâncias e comprimentos'
    },
    {
      id: 'align',
      icon: <AlignHorizontalJustifyCenter className="w-4 h-4" />,
      label: 'Alinhar',
      description: 'Alinhar objetos'
    },
    {
      id: 'vertex-connector',
      icon: <BarChart3 className="w-4 h-4" />,
      label: 'Conectar',
      description: 'Conectar vértices'
    }
  ];

  const handleToolSelect = (toolId: string) => {
    const newTool = toolId === options.activeTool ? 'none' : toolId;
    onOptionsChange({ ...options, activeTool: newTool as any });
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {tools.map((tool) => (
        <Button
          key={tool.id}
          variant={options.activeTool === tool.id ? "default" : "outline"}
          size="sm"
          onClick={() => handleToolSelect(tool.id)}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-[60px]"
          title={tool.description}
        >
          {tool.icon}
          <span className="text-xs">{tool.label}</span>
        </Button>
      ))}
    </div>
  );
}

