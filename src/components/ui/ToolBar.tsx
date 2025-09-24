import React from 'react';
import { useActiveTool } from '@/context/ActiveToolContext';
import { MousePointer, Link, Plane, Wrench, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// Ferramentas de interação (exclusivas) - serão traduzidas dinamicamente
const interactionTools = [
  { key: 'none', labelKey: 'interaction.navigate', icon: MousePointer, description: 'Navegar pela cena 3D' },
  { key: 'vertex-connector', labelKey: 'interaction.connect_vertices', icon: Link, description: 'Criar segmentos entre vértices' },
  { key: 'plane-definition', labelKey: 'interaction.create_plane', icon: Plane, description: 'Definir planos por 3 pontos' },
  { key: 'construction', labelKey: 'interaction.constructions', icon: Wrench, description: 'Ferramentas de construção geométrica' },
] as const;

// Ferramentas de visualização (independentes - precisam de estado separado) - serão traduzidas dinamicamente
const visualizationTools = [
  { key: 'cross-section', labelKey: 'visualization.cross_section', icon: Eye, description: 'Cortar o sólido horizontalmente' },
  { key: 'meridian-section', labelKey: 'visualization.meridian_section', icon: EyeOff, description: 'Cortar o sólido verticalmente' },
] as const;

interface ToolBarProps {
  showCrossSection?: boolean;
  showMeridianSection?: boolean;
  onToggleCrossSection?: () => void;
  onToggleMeridianSection?: () => void;
}

export function ToolBar({ 
  showCrossSection = false, 
  showMeridianSection = false,
  onToggleCrossSection,
  onToggleMeridianSection 
}: ToolBarProps) {
  const { t } = useLanguage();
  const { activeTool, setActiveTool } = useActiveTool();

  return (
    <div className="flex items-center gap-6 p-4 bg-background/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
      {/* Seção de Interação */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-lg shadow-blue-500/50"></div>
          <span className="text-sm font-semibold text-white/90 tracking-wide">{t('interaction.title')}</span>
        </div>
        <div className="flex gap-1.5">
          {interactionTools.map(tool => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.key;
            
            return (
              <button
                key={tool.key}
                onClick={() => setActiveTool(tool.key)}
                className={`
                  group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-300 ease-out transform
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-2xl shadow-blue-500/40 scale-105' 
                    : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white hover:scale-105 border border-white/20 hover:border-white/40'
                  }
                `}
                title={tool.description}
              >
                <Icon className="w-4 h-4" />
                <span>{t(tool.labelKey)}</span>
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Separador Visual */}
      <div className="w-px h-12 bg-gradient-to-b from-transparent via-border/50 to-transparent"></div>

      {/* Seção de Visualização */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full shadow-lg shadow-purple-500/50"></div>
          <span className="text-sm font-semibold text-white/90 tracking-wide">{t('visualization.title')}</span>
        </div>
        <div className="flex gap-1.5">
          {visualizationTools.map(tool => {
            const Icon = tool.icon;
            const isActive = (tool.key === 'cross-section' && showCrossSection) || 
                           (tool.key === 'meridian-section' && showMeridianSection);
            const onClick = tool.key === 'cross-section' ? onToggleCrossSection : onToggleMeridianSection;
            
            return (
              <button
                key={tool.key}
                onClick={onClick}
                className={`
                  group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-300 ease-out transform
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-2xl shadow-purple-500/40 scale-105' 
                    : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white hover:scale-105 border border-white/20 hover:border-white/40'
                  }
                `}
                title={tool.description}
              >
                <Icon className="w-4 h-4" />
                <span>{t(tool.labelKey)}</span>
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ToolBar;


