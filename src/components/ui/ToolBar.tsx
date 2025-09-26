import React from 'react';
import { useActiveTool } from '@/context/ActiveToolContext';
import { MousePointer, Link, Plane, Wrench, Eye, EyeOff, Palette, Pen, Eraser, Undo, Redo, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Cores para mesa digitalizadora - Samsung Notes Style
const COLORS = [
  { label: 'Preto', value: '#000000', category: 'básica' },
  { label: 'Branco', value: '#ffffff', category: 'básica' },
  { label: 'Vermelho', value: '#ff0000', category: 'primária' },
  { label: 'Verde', value: '#00ff00', category: 'primária' },
  { label: 'Azul', value: '#0000ff', category: 'primária' },
  { label: 'Amarelo', value: '#ffff00', category: 'primária' },
  { label: 'Rosa', value: '#ff69b4', category: 'secundária' },
  { label: 'Laranja', value: '#ffa500', category: 'secundária' },
  { label: 'Roxo', value: '#800080', category: 'secundária' },
  { label: 'Ciano', value: '#00ffff', category: 'secundária' },
  { label: 'Marrom', value: '#8b4513', category: 'neutra' },
  { label: 'Cinza', value: '#808080', category: 'neutra' },
  { label: 'Dourado', value: '#ffd700', category: 'premium' },
  { label: 'Prata', value: '#c0c0c0', category: 'premium' }
];

// Ferramentas de interação (exclusivas) - serão traduzidas dinamicamente
const interactionTools = [
  { key: 'vertex-connector', labelKey: 'interaction.connect_vertices', icon: Link, description: 'Criar segmentos entre vértices' },
  { key: 'plane-definition', labelKey: 'interaction.create_plane', icon: Plane, description: 'Definir planos por 3 pontos' },
] as const;

// Ferramentas de visualização (independentes - precisam de estado separado) - serão traduzidas dinamicamente
const visualizationTools = [
  { key: 'cross-section', labelKey: 'visualization.cross_section', icon: Eye, description: 'Cortar o sólido horizontalmente' },
  { key: 'meridian-section', labelKey: 'visualization.meridian_section', icon: EyeOff, description: 'Cortar o sólido verticalmente' },
] as const;

interface ToolBarProps {
  isTabletActive?: boolean;
  onTabletToggle?: (active: boolean) => void;
  tabletStyle?: {
    color: string;
    thickness: number;
    opacity: number;
  };
  tabletTool?: {
    type: string;
    name: string;
  };
  onTabletStyleChange?: (key: string, value: any) => void;
  onTabletToolChange?: (tool: any) => void;
  onTabletUndo?: () => void;
  onTabletRedo?: () => void;
  onTabletClear?: () => void;
  canTabletUndo?: boolean;
  canTabletRedo?: boolean;
}

export function ToolBar({ 
  isTabletActive = false,
  onTabletToggle,
  tabletStyle = { color: '#ff0000', thickness: 3, opacity: 1 },
  tabletTool = { type: 'pen', name: 'Caneta' },
  onTabletStyleChange,
  onTabletToolChange,
  onTabletUndo,
  onTabletRedo,
  onTabletClear,
  canTabletUndo = false,
  canTabletRedo = false
}: ToolBarProps) {
  const { t } = useLanguage();
  const { activeTool, setActiveTool } = useActiveTool();

  return (
    <div className="flex items-center gap-6 p-4 bg-background/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
      {/* Seção de Interação */}
      <div className="flex flex-col gap-3">
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

      {/* Mesa Digitalizadora - Versão Completa */}
      <div className="flex flex-col gap-3">
        
        {isTabletActive ? (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/20">
            {/* Toggle */}
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-green-400" />
              <Label htmlFor="tablet-toggle" className="text-xs text-white/70">
                Ativa
              </Label>
              <Switch
                id="tablet-toggle"
                checked={isTabletActive}
                onCheckedChange={(checked) => {
                  console.log('🖊️ Toggle mesa digitalizadora:', checked);
                  onTabletToggle(checked);
                }}
                className="data-[state=checked]:bg-green-500"
              />
            </div>

            {/* Separador */}
            <div className="w-px h-6 bg-white/20"></div>

            {/* Ferramentas - Compactas */}
            <div className="flex items-center gap-1">
              <Button
                variant={tabletTool.type === 'select' ? "default" : "outline"}
                size="sm"
                onClick={() => onTabletToolChange?.({ type: 'select', name: 'Seleção' })}
                className={`h-8 w-8 p-0 ${tabletTool.type === 'select' ? 'bg-green-500 text-white' : 'bg-white/5 text-white/70'}`}
                title="🎯 Seleção de Texto"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </Button>
              <Button
                variant={tabletTool.type === 'pen' ? "default" : "outline"}
                size="sm"
                onClick={() => onTabletToolChange?.({ type: 'pen', name: 'Caneta' })}
                className={`h-8 w-8 p-0 ${tabletTool.type === 'pen' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/70'}`}
                title="✏️ Caneta"
              >
                <Pen className="w-4 h-4" />
              </Button>
              <Button
                variant={tabletTool.type === 'highlighter' ? "default" : "outline"}
                size="sm"
                onClick={() => onTabletToolChange?.({ type: 'highlighter', name: 'Marcador' })}
                className={`h-8 w-8 p-0 ${tabletTool.type === 'highlighter' ? 'bg-yellow-500 text-white' : 'bg-white/5 text-white/70'}`}
                title="🖌️ Marcador"
              >
                <div className="w-4 h-4 bg-yellow-400 rounded-sm" />
              </Button>
              <Button
                variant={tabletTool.type === 'pencil' ? "default" : "outline"}
                size="sm"
                onClick={() => onTabletToolChange?.({ type: 'pencil', name: 'Lápis' })}
                className={`h-8 w-8 p-0 ${tabletTool.type === 'pencil' ? 'bg-gray-500 text-white' : 'bg-white/5 text-white/70'}`}
                title="✏️ Lápis"
              >
                <Pen className="w-4 h-4" />
              </Button>
              <Button
                variant={tabletTool.type === 'eraser' ? "default" : "outline"}
                size="sm"
                onClick={() => onTabletToolChange?.({ type: 'eraser', name: 'Borracha' })}
                className={`h-8 w-8 p-0 ${tabletTool.type === 'eraser' ? 'bg-red-500 text-white' : 'bg-white/5 text-white/70'}`}
                title="Borracha"
              >
                <Eraser className="w-4 h-4" />
              </Button>
            </div>

            {/* Separador */}
            <div className="w-px h-6 bg-white/20"></div>

            {/* Desenho Assistido - Funcional */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">Assistido</span>
              </div>
              <span className="text-xs text-white/60">Segure 1-2s</span>
            </div>

            {/* Separador */}
            <div className="w-px h-6 bg-white/20"></div>

            {/* Cores - Compactas */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <div 
                    className="w-4 h-4 rounded-full border border-white/30" 
                    style={{ backgroundColor: tabletStyle.color }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3">
                <div className="grid grid-cols-6 gap-2">
                  {COLORS.slice(0, 12).map((color) => (
                    <button
                      key={color.value}
                      className={`w-6 h-6 rounded-full border-2 ${
                        tabletStyle.color === color.value 
                          ? 'border-white ring-2 ring-white/50' 
                          : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => onTabletStyleChange?.('color', color.value)}
                      title={color.label}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Espessura - Compacta */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center bg-white/5">
                <div
                  className="rounded-full bg-white"
                  style={{
                    width: `${Math.max(2, tabletStyle.thickness * 0.6)}px`,
                    height: `${Math.max(2, tabletStyle.thickness * 0.6)}px`
                  }}
                />
              </div>
              <Slider
                value={[tabletStyle.thickness]}
                onValueChange={([value]) => {
                  onTabletStyleChange?.('thickness', value);
                }}
                min={1}
                max={20}
                step={1}
                className="w-16 h-2"
              />
              <span className="text-xs text-white/60 w-8">{tabletStyle.thickness}px</span>
            </div>

            {/* Separador */}
            <div className="w-px h-6 bg-white/20"></div>

            {/* Ações */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onTabletUndo}
                disabled={!canTabletUndo}
                className="h-8 w-8 p-0"
                title="Desfazer"
              >
                <Undo className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onTabletRedo}
                disabled={!canTabletRedo}
                className="h-8 w-8 p-0"
                title="Refazer"
              >
                <Redo className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onTabletClear}
                className="h-8 w-8 p-0"
                title="Limpar"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
            

          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/20">
            <Palette className="w-4 h-4 text-green-400" />
            <div className="flex items-center gap-2">
              <Label htmlFor="tablet-toggle" className="text-xs text-white/70">
                Inativa
              </Label>
              <Switch
                id="tablet-toggle"
                checked={isTabletActive}
                onCheckedChange={onTabletToggle}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
            
          </div>
        )}
      </div>

    </div>
  );
}

export default ToolBar;


