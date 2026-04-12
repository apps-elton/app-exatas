import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MousePointer, Palette, Pen, Pencil, Eraser, Undo, Redo, RotateCcw, Square, Circle, Minus, ArrowRight, Highlighter, Ruler, Grid3x3 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// ==========================================
// CORES - Samsung Notes Style
// ==========================================

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
  { label: 'Prata', value: '#c0c0c0', category: 'premium' },
  { label: 'Amarelo Ouro', value: '#ffd700', category: 'nova' },
  { label: 'Azul Céu', value: '#87ceeb', category: 'nova' },
  { label: 'Roxo Violeta', value: '#8a2be2', category: 'nova' },
  { label: 'Verde Musgo', value: '#8fbc8f', category: 'nova' }
];

// ==========================================
// TIPOS DE FERRAMENTAS
// ==========================================

const DRAWING_TOOLS = [
  { type: 'pen', icon: Pen, name: 'Caneta', tooltip: 'Caneta (P)' },
  { type: 'pencil', icon: Pencil, name: 'Lápis', tooltip: 'Lápis (L)' },
  { type: 'marker', icon: Highlighter, name: 'Marcador', tooltip: 'Marcador (M)' },
  { type: 'technical', icon: Ruler, name: 'Técnica', tooltip: 'Caneta Técnica (T)' },
  { type: 'highlighter', icon: Highlighter, name: 'Marca-texto', tooltip: 'Marca-texto (H)' },
  { type: 'eraser', icon: Eraser, name: 'Borracha', tooltip: 'Borracha (E)' },
];

const GEOMETRIC_TOOLS = [
  { type: 'rectangle', icon: Square, name: 'Retângulo', tooltip: 'Retângulo (R)' },
  { type: 'square', icon: Square, name: 'Quadrado', tooltip: 'Quadrado (Q)' },
  { type: 'circle', icon: Circle, name: 'Círculo', tooltip: 'Círculo (C)' },
  { type: 'line', icon: Minus, name: 'Reta', tooltip: 'Reta (-)' },
  { type: 'dashed-line', icon: Minus, name: 'Reta Tracejada', tooltip: 'Reta Tracejada (Shift+-)' },
  { type: 'arrow', icon: ArrowRight, name: 'Seta', tooltip: 'Seta (A)' },
];

// ==========================================
// INTERFACE
// ==========================================

interface ToolBarProps {
  isTabletActive?: boolean;
  onTabletToggle?: (active: boolean) => void;
  tabletStyle?: {
    color: string;
    thickness: number;
    opacity: number;
    pressure: boolean;
    smoothing: number;
    fontFamily?: string;
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
  showGrid?: boolean;
  onToggleGrid?: () => void;
  snapEnabled?: boolean;
  onToggleSnap?: () => void;
}

// ==========================================
// COMPONENTE TOOLBAR
// ==========================================

export function ToolBar({ 
  isTabletActive = false,
  onTabletToggle,
  tabletStyle = { 
    color: '#ffffff', 
    thickness: 2, 
    opacity: 1, 
    pressure: true, 
    smoothing: 0.8, 
    fontFamily: 'Poppins' 
  },
  tabletTool = { type: 'pen', name: 'Caneta' },
  onTabletStyleChange,
  onTabletToolChange,
  onTabletUndo,
  onTabletRedo,
  onTabletClear,
  canTabletUndo = false,
  canTabletRedo = false,
  showGrid = false,
  onToggleGrid,
  snapEnabled = false,
  onToggleSnap
}: ToolBarProps) {
  
  const { t } = useTranslation();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  return (
    <div className="flex items-center gap-6 p-4 bg-background/95 backdrop-blur-xl border-b border-white/10 shadow-lg overflow-x-auto min-h-[80px]">

      {/* Mesa Digitalizadora */}
      <div className="flex flex-col gap-3">
        
        {isTabletActive ? (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 min-w-max flex-shrink-0">
            
            {/* Toggle */}
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-green-400" />
              <Label htmlFor="tablet-toggle" className="text-xs text-green-300 font-medium">
                {t('tablet.active')}
              </Label>
              <Switch
                id="tablet-toggle"
                checked={isTabletActive}
                onCheckedChange={onTabletToggle}
                className="data-[state=checked]:bg-green-500 scale-75"
              />
            </div>

            <div className="w-px h-6 bg-green-500/30"></div>

            {/* Ferramentas de Seleção */}
            <div className="flex items-center gap-1">
              <Button
                variant={tabletTool.type === 'select' ? "default" : "outline"}
                size="sm"
                onClick={() => onTabletToolChange?.({ type: 'select', name: t('tool.select') })}
                className={`h-8 w-8 p-0 ${tabletTool.type === 'select' ? 'bg-green-500 text-white' : 'bg-white/5 text-white/70'}`}
                title={t('tool.select')}
              >
                <MousePointer className="w-3 h-3" />
              </Button>
            </div>

            <div className="w-px h-6 bg-green-500/30"></div>

            {/* Ferramentas de Desenho */}
            <div className="flex items-center gap-1 max-w-[300px] overflow-x-auto">
              {DRAWING_TOOLS.map(tool => {
                const Icon = tool.icon;
                return (
                  <Button
                    key={tool.type}
                    variant={tabletTool.type === tool.type ? "default" : "outline"}
                    size="sm"
                    onClick={() => onTabletToolChange?.({ type: tool.type, name: tool.name })}
                    className={`h-8 w-8 p-0 flex-shrink-0 ${
                      tabletTool.type === tool.type ? 'bg-green-500 text-white' : 'bg-white/5 text-white/70'
                    }`}
                    title={tool.tooltip}
                  >
                    <Icon className="w-3 h-3" />
                  </Button>
                );
              })}
            </div>

            <div className="w-px h-6 bg-green-500/30"></div>

            {/* Ferramentas Geométricas */}
            <div className="flex items-center gap-1 max-w-[300px] overflow-x-auto">
              <span className="text-xs text-green-300 mr-1">{t('toolbar.geometry')}</span>
              {GEOMETRIC_TOOLS.map(tool => {
                const Icon = tool.icon;
                return (
                  <Button
                    key={tool.type}
                    variant={tabletTool.type === tool.type ? "default" : "outline"}
                    size="sm"
                    onClick={() => onTabletToolChange?.({ type: tool.type, name: tool.name })}
                    className={`h-8 w-8 p-0 flex-shrink-0 ${
                      tabletTool.type === tool.type ? 'bg-green-500 text-white' : 'bg-white/5 text-white/70'
                    }`}
                    title={tool.tooltip}
                  >
                    <Icon className="w-3 h-3" />
                  </Button>
                );
              })}
            </div>

            <div className="w-px h-6 bg-green-500/30"></div>

            {/* Seletor de Cor */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-white/5 text-white/70 border-green-500/30 hover:bg-white/10"
              onClick={() => setShowColorPicker(true)}
              title={t('label.select_color')}
            >
              <div 
                className="w-4 h-4 rounded border border-white/30"
                style={{ backgroundColor: tabletStyle.color }}
              />
            </Button>

            <div className="w-px h-6 bg-green-500/30"></div>

            {/* Espessura */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-300">{t('label.thickness_short')}</span>
              <input
                type="range"
                min="0.5"
                max="20"
                step="0.5"
                value={tabletStyle.thickness || 2}
                onChange={(e) => onTabletStyleChange?.('thickness', Number(e.target.value))}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${((tabletStyle.thickness || 2) / 20) * 100}%, #374151 ${((tabletStyle.thickness || 2) / 20) * 100}%, #374151 100%)`
                }}
              />
              <span className="text-xs text-green-300 w-10">{(tabletStyle.thickness || 2).toFixed(1)}px</span>
            </div>

            <div className="w-px h-6 bg-green-500/30"></div>

            {/* Opacidade */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-300">{t('label.opacity_short')}</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={tabletStyle.opacity || 1}
                onChange={(e) => onTabletStyleChange?.('opacity', Number(e.target.value))}
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-green-300 w-8">{Math.round((tabletStyle.opacity || 1) * 100)}%</span>
            </div>

            <div className="w-px h-6 bg-green-500/30"></div>

            {/* Configurações Avançadas */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="h-8 px-2 border-green-500/30 text-green-300 hover:bg-green-500/20 text-xs"
              title="Configurações Avançadas"
            >
              {showAdvancedSettings ? '◀' : '▶'}
            </Button>

            {showAdvancedSettings && (
              <>
                <div className="w-px h-6 bg-green-500/30"></div>
                
                {/* Suavização */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-300">Suave:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={tabletStyle.smoothing || 0.8}
                    onChange={(e) => onTabletStyleChange?.('smoothing', Number(e.target.value))}
                    className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-green-300 w-8">{Math.round((tabletStyle.smoothing || 0.8) * 100)}%</span>
                </div>

                <div className="w-px h-6 bg-green-500/30"></div>

                {/* Pressão */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-green-300">Pressão</Label>
                  <Switch
                    checked={tabletStyle.pressure}
                    onCheckedChange={(checked) => onTabletStyleChange?.('pressure', checked)}
                    className="data-[state=checked]:bg-green-500 scale-75"
                  />
                </div>

                <div className="w-px h-6 bg-green-500/30"></div>

                {/* Grade */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={showGrid ? "default" : "outline"}
                    size="sm"
                    onClick={onToggleGrid}
                    className={`h-8 w-8 p-0 ${showGrid ? 'bg-green-500' : 'border-green-500/30 text-green-300'}`}
                    title="Grade (Ctrl+G)"
                  >
                    <Grid3x3 className="w-3 h-3" />
                  </Button>
                  
                  {showGrid && (
                    <div className="flex items-center gap-1">
                      <Label className="text-xs text-green-300">Snap</Label>
                      <Switch
                        checked={snapEnabled}
                        onCheckedChange={onToggleSnap}
                        className="data-[state=checked]:bg-green-500 scale-75"
                      />
                    </div>
                  )}
                </div>

                <div className="w-px h-6 bg-green-500/30"></div>

                {/* Fonte */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-300">Fonte:</span>
                  <select
                    value={tabletStyle.fontFamily || 'Poppins'}
                    onChange={(e) => onTabletStyleChange?.('fontFamily', e.target.value)}
                    className="bg-white/10 text-green-300 text-xs px-2 py-1 rounded border border-green-500/30 focus:border-green-400 focus:outline-none"
                  >
                    <option value="Poppins">Poppins</option>
                    <option value="Nunito">Nunito</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                  </select>
                </div>
              </>
            )}

            <div className="w-px h-6 bg-green-500/30"></div>

            {/* Ações */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onTabletUndo}
                disabled={!canTabletUndo}
                className="h-8 w-8 p-0 border-green-500/30 text-green-300 hover:bg-green-500/20 disabled:opacity-30"
                title={`${t('button.undo')} (Ctrl+Z)`}
              >
                <Undo className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onTabletRedo}
                disabled={!canTabletRedo}
                className="h-8 w-8 p-0 border-green-500/30 text-green-300 hover:bg-green-500/20 disabled:opacity-30"
                title={`${t('button.redo')} (Ctrl+Y)`}
              >
                <Redo className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onTabletClear}
                className="h-8 w-8 p-0 border-green-500/30 text-green-300 hover:bg-green-500/20"
                title={`${t('button.clear')} (Delete)`}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ) : (
          // Mesa Inativa
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/20 hover:bg-white/10 transition-colors">
            <Palette className="w-4 h-4 text-white/60" />
            <div className="flex items-center gap-2">
              <Label htmlFor="tablet-toggle" className="text-xs text-white/70">
                {t('tablet.name')}
              </Label>
              <Switch
                id="tablet-toggle"
                checked={isTabletActive}
                onCheckedChange={onTabletToggle}
                className="data-[state=checked]:bg-green-500 scale-75"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cores Compacto */}
      {showColorPicker && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowColorPicker(false)}
        >
          <div 
            className="bg-gray-900/95 backdrop-blur-xl border border-green-500/30 rounded-lg p-4 w-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">{t('label.select_color')}</h3>
              <button
                onClick={() => setShowColorPicker(false)}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Grade de cores */}
            <div className="grid grid-cols-9 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  className={`w-8 h-8 rounded border-2 transition-all duration-150 hover:scale-110 ${
                    tabletStyle.color === color.value 
                      ? 'border-white ring-2 ring-white/50' 
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    onTabletStyleChange?.('color', color.value);
                    setShowColorPicker(false);
                  }}
                  title={color.label}
                />
              ))}
            </div>
            
            {/* Seletor de cor personalizada */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <label className="text-xs text-white/70 block mb-2">Cor Personalizada:</label>
              <input
                type="color"
                value={tabletStyle.color}
                onChange={(e) => {
                  onTabletStyleChange?.('color', e.target.value);
                }}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ToolBar;