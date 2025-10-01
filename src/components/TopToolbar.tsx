import React, { useState, useEffect } from 'react';
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
  Redo2,
  Palette,
  Zap,
  Gauge,
  Link,
  Plane
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { VisualizationOptions } from '@/types/geometry';

interface TopToolbarProps {
  options: VisualizationOptions;
  onOptionsChange: (options: VisualizationOptions) => void;
  isTabletActive?: boolean;
  onTabletToggle?: (active: boolean) => void;
  // Props para sistema de histórico
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  // Props para sincronização com painel lateral
  onStyleChange?: (key: string, value: any) => void;
  // Props para controles de fluidez da mesa digitalizadora
  tabletStyle?: {
    color: string;
    thickness: number;
    opacity: number;
    pressure: boolean;
    smoothing: number;
  };
  onTabletStyleChange?: (key: string, value: any) => void;
}

export default function TopToolbar({ 
  options, 
  onOptionsChange, 
  isTabletActive = false, 
  onTabletToggle,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onStyleChange,
  tabletStyle = { color: '#ffffff', thickness: 3, opacity: 1, pressure: true, smoothing: 0.8 },
  onTabletStyleChange
}: TopToolbarProps) {
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
      id: 'cross-section',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path d="M2 12s3-9 10-9 10 9 10 9-3 9-10 9-10-9-10-9z" />
      </svg>,
      label: 'Seção Transversal',
      description: 'Cortar o sólido horizontalmente'
    },
    {
      id: 'meridian-section',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>,
      label: 'Seção Meridiana',
      description: 'Cortar o sólido verticalmente'
    },
    {
      id: 'vertex-connector',
      icon: <Link className="w-5 h-5" />,
      label: 'Conectar Vértices',
      description: 'Criar segmentos entre vértices'
    },
    {
      id: 'plane-definition',
      icon: <Plane className="w-5 h-5" />,
      label: 'Criar Plano',
      description: 'Definir planos por 3 pontos'
    }
  ];

  const handleToolSelect = (toolId: string) => {
    if (toolId === 'cross-section') {
      onOptionsChange({ ...options, showCrossSection: !options.showCrossSection });
    } else if (toolId === 'meridian-section') {
      onOptionsChange({ ...options, showMeridianSection: !options.showMeridianSection });
    } else {
      const newTool = toolId === options.activeTool ? 'none' : toolId;
      onOptionsChange({ ...options, activeTool: newTool as any });
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Seção de Ferramentas Principais */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Ferramentas</span>
              <div className="w-8 h-px bg-slate-600"></div>
            </div>
            
            <div className="flex items-center gap-2">
              {tools.map((tool) => {
                let isActive = false;
                if (tool.id === 'cross-section') {
                  isActive = options.showCrossSection;
                } else if (tool.id === 'meridian-section') {
                  isActive = options.showMeridianSection;
                } else {
                  isActive = options.activeTool === tool.id;
                }

                return (
                  <Button
                    key={tool.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToolSelect(tool.id)}
                    className={`h-10 px-4 rounded-lg transition-all duration-200 ${
                      isActive
                        ? tool.id === 'cross-section' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-md'
                          : tool.id === 'meridian-section'
                          ? 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500 shadow-md'
                          : tool.id === 'vertex-connector'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500 shadow-md'
                          : tool.id === 'plane-definition'
                          ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-500 shadow-md'
                          : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-600 hover:border-slate-500'
                    }`}
                    title={tool.description}
                  >
                    <div className="flex items-center gap-2">
                      {tool.icon}
                      <span className="text-sm font-medium">{tool.label}</span>
                    </div>
                  </Button>
                );
              })}

            </div>
          </div>

          {/* Seção de Ações */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className={`h-10 px-4 rounded-lg transition-all duration-200 ${
                canUndo 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-600 hover:border-slate-500' 
                  : 'bg-slate-900 text-slate-500 border-slate-700 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Desfazer</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className={`h-10 px-4 rounded-lg transition-all duration-200 ${
                canRedo 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-600 hover:border-slate-500' 
                  : 'bg-slate-900 text-slate-500 border-slate-700 cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Refazer</span>
            </Button>

            {/* Botão para limpar pontos médios */}
            {options.activeTool === 'midpoint' && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 rounded-lg bg-red-900/20 hover:bg-red-800/30 text-red-400 hover:text-red-300 border-red-700 hover:border-red-600 transition-all duration-200"
                onClick={() => {
                  onOptionsChange({ ...options, activeTool: 'none' });
                }}
              >
                <Circle className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Limpar Pontos</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
