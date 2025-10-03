import React, { useRef, useCallback, useEffect, useState } from 'react';

const MIN_DISTANCE = 1;
const FRAME_TIME = 8;
const QUICK_COLORS_DARK = ['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];
const QUICK_COLORS_LIGHT = ['#000000', '#ff0000', '#00aa00', '#0000ff', '#cccc00', '#cc00cc', '#00aaaa', '#ff8800'];

const distance = (p1: any, p2: any) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

interface DrawingTabletProps {
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export default function DrawingTablet({ isActive, onToggle, className = '' }: DrawingTabletProps) {
  console.log('🎨 DrawingTablet renderizado - isActive:', isActive);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const lastTimeRef = useRef(0);

  const [pages, setPages] = useState([{ id: '1', name: 'Página 1', strokes: [] }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [strokes, setStrokes] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ffffff');
  const [thickness, setThickness] = useState(3);
  const [opacity, setOpacity] = useState(1);

  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<any>(null);

  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [showAxis, setShowAxis] = useState(false);
  const [axisX, setAxisX] = useState(50);
  const [axisY, setAxisY] = useState(50);
  const [laserPoint, setLaserPoint] = useState<any>(null);
  const [laserColor, setLaserColor] = useState('#ff0000');

  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0, pressure: 0.5 });
  const [textValue, setTextValue] = useState('');

  const [showRuler, setShowRuler] = useState(false);
  const [rulerAngle, setRulerAngle] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(true);
  const [showShapesMenu, setShowShapesMenu] = useState(false);

  const [polygonSides, setPolygonSides] = useState(6);
  const [showApothem, setShowApothem] = useState(false);
  const [isDashed, setIsDashed] = useState(false);

  const [theme, setTheme] = useState('dark');

  const [showSubjectPanel, setShowSubjectPanel] = useState(false);
  const [currentSubject, setCurrentSubject] = useState('fisica');
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPeriodicTable, setShowPeriodicTable] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState('0');
  const [pendingSymbol, setPendingSymbol] = useState<string | null>(null);
  const [selectedStroke, setSelectedStroke] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickStroke, setLastClickStroke] = useState<any>(null);

  // Cores adaptadas para combinar com a aplicação
  const themeColors = {
    dark: {
      bg: 'from-slate-950 via-slate-900 to-slate-950',
      toolbar: 'bg-slate-900/80 backdrop-blur-2xl border-slate-800/50',
      border: 'border-slate-800/50',
      text: 'text-slate-50',
      textMuted: 'text-slate-400',
      buttonActive: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-500/50',
      buttonInactive: 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 backdrop-blur-xl',
      card: 'bg-slate-900/90 backdrop-blur-2xl',
      cardBorder: 'border-slate-800/50'
    },
    light: {
      bg: 'from-slate-50 via-white to-slate-100',
      toolbar: 'bg-white/80 backdrop-blur-2xl border-slate-200/60',
      border: 'border-slate-200/60',
      text: 'text-slate-900',
      textMuted: 'text-slate-500',
      buttonActive: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/50',
      buttonInactive: 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 backdrop-blur-xl',
      card: 'bg-white/90 backdrop-blur-2xl',
      cardBorder: 'border-slate-200/60'
    }
  };

  const t = themeColors[theme as keyof typeof themeColors];

  // Funções de desenho
  const getPoint = useCallback((e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const p = e.pressure || (e.pointerType === 'pen' ? 0.7 : 0.5);

    const x = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
    const y = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
    
    return {
      x,
      y,
      pressure: Math.max(0.3, Math.min(1, p))
    };
  }, [canvasOffset, canvasScale]);

  const start = useCallback((e: any) => {
    if (!isActive) return;
    e.preventDefault();
    const point = getPoint(e);

    if (tool === 'text') {
      setTextPosition(point);
      setTextValue('');
      setShowTextInput(true);
      setTimeout(() => {
        if (textInputRef.current) textInputRef.current.focus();
      }, 10);
      return;
    }

    setCurrent({
      id: Date.now().toString(),
      tool,
      points: [point],
      color,
      thickness,
      opacity,
      sides: polygonSides,
      showApothem: showApothem,
      dashed: isDashed
    });
    setIsDrawing(true);
  }, [isActive, tool, color, thickness, opacity, getPoint, polygonSides, showApothem, isDashed]);
    
  const move = useCallback((e: any) => {
    if (!isDrawing || !current) return;
    e.preventDefault();
    const point = getPoint(e);
    const now = performance.now();
    if (now - lastTimeRef.current < FRAME_TIME) return;
    lastTimeRef.current = now;
    
    const last = current.points[current.points.length - 1];
    if (distance(last, point) < MIN_DISTANCE) return;
    setCurrent((c: any) => c ? { ...c, points: [...c.points, point] } : null);
  }, [isDrawing, current, getPoint]);

  const stop = useCallback(() => {
    if (!isDrawing || !current) return;
    if (current.points.length > 0) {
      setStrokes(prev => [...prev, current]);
    }
    setCurrent(null);
    setIsDrawing(false);
  }, [isDrawing, current]);

  const handleTextSubmit = useCallback(() => {
    if (textValue.trim()) {
      setStrokes(prev => [...prev, {
        id: Date.now().toString(),
        tool: 'text',
        points: [textPosition],
        color,
        thickness,
        opacity,
        text: textValue
      }]);
    }
    setShowTextInput(false);
    setTextValue('');
    // Manter a ferramenta de texto ativa em vez de voltar para caneta
    // setTool('pen'); // Removido para manter a ferramenta de texto
  }, [textValue, textPosition, color, thickness, opacity]);

  // Função de redesenho
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Não desenhar fundo - deixar transparente para mostrar o sólido

      ctx.save();
    ctx.translate(canvasOffset.x, canvasOffset.y);
    ctx.scale(canvasScale, canvasScale);
    
    // Desenhar strokes
    const allStrokes = [...strokes];
    if (current) allStrokes.push(current);

    allStrokes.forEach((stroke) => {
      if (!stroke) return;

      if (stroke.tool === 'text' && stroke.text) {
        ctx.save();
        ctx.fillStyle = stroke.color;
        ctx.font = stroke.thickness * 8 + 'px "Comic Sans MS", "Segoe Print", "Bradley Hand", cursive';
        ctx.globalAlpha = stroke.opacity;
        const lines = stroke.text.split('\n');
        lines.forEach((line: string, i: number) => {
          ctx.fillText(line, stroke.points[0].x, stroke.points[0].y + (i * stroke.thickness * 10));
        });
        ctx.restore();
        return;
      }

      if (stroke.points.length < 2) return;
      
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.opacity;
        
      const path = new Path2D();
      path.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        path.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      const avgPressure = stroke.points.reduce((sum: number, p: any) => sum + p.pressure, 0) / stroke.points.length;
      ctx.lineWidth = stroke.thickness * (0.7 + avgPressure * 0.6);
      ctx.stroke(path);
      ctx.restore();
    });

    ctx.restore();
  }, [strokes, current, theme, canvasOffset, canvasScale, isActive]);

  // Efeitos
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  return (
    <div className={`w-full h-screen bg-transparent flex flex-col relative overflow-hidden ${className}`} style={{ zIndex: isActive ? 10 : 5, backgroundColor: 'transparent', marginTop: 0, paddingTop: 0, marginBottom: 0, paddingBottom: 0, top: 0 }}>
      {/* Header com controles - sempre visível */}
      <div className={`${t.toolbar} border-b ${t.border} shadow-2xl shadow-black/5 ${isActive ? 'bg-opacity-90' : 'bg-opacity-30'} pointer-events-auto`} style={{ zIndex: 20 }}>
        <div className="px-6 py-0 flex items-center gap-2 flex-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="flex items-center gap-2">
            <div className={`${t.text} font-semibold text-lg tracking-tight`}>
              Mesa Digitalizadora
            </div>

            <div className={`h-6 w-px ${t.border}`}></div>

            <button
              onClick={() => {
                console.log('🎨 Switch Mesa Digitalizadora clicado - isActive atual:', isActive);
                onToggle();
                console.log('🎨 Novo valor isActive:', !isActive);
              }}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                isActive ? 'bg-blue-600 shadow-lg shadow-blue-600/30' : 'bg-slate-600/50'
              }`}
              title="Ativar/Desativar Mesa Digitalizadora"
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${
                isActive ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2.5 rounded-xl ${t.buttonInactive} transition-all duration-300 hover:scale-105 active:scale-95`}
              title="Alternar tema"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <button
              onClick={() => setShowToolsPanel(!showToolsPanel)}
              className={`p-2.5 rounded-xl ${showToolsPanel ? t.buttonActive : t.buttonInactive} transition-all duration-300 hover:scale-105 active:scale-95`}
              title="Mostrar/Ocultar Ferramentas"
            >
              🎨
            </button>
          </div>

          {showToolsPanel && (
            <>
              <div className="flex items-center gap-2">
                {[
                  { id: 'pen', icon: '✒️', name: 'Caneta (P)' },
                  { id: 'pencil', icon: '✏️', name: 'Lápis (L)' },
                  { id: 'highlighter', icon: '🖍️', name: 'Marca-texto (H)' },
                  { id: 'eraser', icon: '🧹', name: 'Borracha (E)' },
                  { id: 'hand', icon: '✋', name: 'Mover Canvas (V)' }
                ].map(tt => (
                  <button
                    key={tt.id}
                    onClick={() => setTool(tt.id)}
                    className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${tool === tt.id ? t.buttonActive : t.buttonInactive}`}
                    title={tt.name}
                  >
                    {tt.icon}
                  </button>
            ))}
          </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTool('text')}
                  className={`px-2 py-1.5 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${tool === 'text' ? t.buttonActive : t.buttonInactive}`}
                  title="Texto"
                >
                  Aa
                </button>
                <button
                  onClick={() => setShowGrid(s => !s)}
                  className={`p-1.5 rounded-xl transition-all duration-200 hover:scale-105 ${showGrid ? t.buttonActive : t.buttonInactive}`}
                  title="Grade (G)"
                >
                  ⊞
                </button>
              </div>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setStrokes(prev => prev.slice(0, -1))}
              disabled={strokes.length === 0}
              className={`p-1.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${strokes.length === 0 ? 'opacity-40 cursor-not-allowed ' + t.buttonInactive : 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30'}`}
              title="Desfazer (Ctrl+Z)"
            >
              ↶
            </button>
              <button
              onClick={() => setStrokes([])}
              className="p-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
              title="Limpar (Del)"
            >
              🗑️
            </button>
          </div>
            </div>

        {showToolsPanel && (
          <div className={`px-4 py-3 border-t ${t.border} flex items-center gap-4 flex-wrap text-sm`}>
            <div className="flex items-center gap-2">
              <span className={`${t.textMuted} font-medium`}>Cor:</span>
              <div className="flex gap-1.5">
                {(theme === 'dark' ? QUICK_COLORS_DARK : QUICK_COLORS_LIGHT).map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-lg transition-all duration-200 hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-blue-500' : 'ring-1 ring-gray-300'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer"
            />
          </div>
          </div>

            <div className="flex items-center gap-2">
              <span className={`${t.textMuted} font-medium`}>Espessura:</span>
              <input
                type="range"
                min="0.5"
                max="30"
                step="0.5"
                value={thickness}
                onChange={(e) => setThickness(parseFloat(e.target.value))}
                className="w-24"
              />
              <span className={`${t.text} font-semibold w-10`}>{thickness}px</span>
          </div>

            <div className="flex items-center gap-2">
              <span className={`${t.textMuted} font-medium`}>Opacidade:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-24"
              />
              <span className={`${t.text} font-semibold w-10`}>{Math.round(opacity * 100)}%</span>
            </div>
          </div>
        )}
              </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ pointerEvents: isActive ? 'auto' : 'none', opacity: 1 }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            touchAction: 'none',
            cursor: isActive
              ? (tool === 'symbol-insert' ? 'crosshair' : tool === 'laser' ? 'none' : tool === 'hand' ? 'grab' : 'crosshair')
              : 'default',
            pointerEvents: isActive ? 'auto' : 'none',
            opacity: 1
          }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerLeave={stop}
        />

        {showTextInput && (
          <div
            className={`absolute ${t.card} border-2 border-blue-500 rounded-xl shadow-2xl z-50 p-2`}
            style={{
              left: (textPosition.x * canvasScale + canvasOffset.x) + 'px',
              top: (textPosition.y * canvasScale + canvasOffset.y) + 'px',
              minWidth: '200px',
              maxWidth: '400px'
            }}
          >
            <textarea
              ref={textInputRef}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleTextSubmit();
                  e.stopPropagation();
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTextSubmit();
                  e.stopPropagation();
                }
              }}
              onBlur={handleTextSubmit}
              autoFocus
              className={`w-full px-2 py-1 border-0 outline-none resize-none bg-transparent ${t.text}`}
              style={{
                fontSize: (thickness * 8) + 'px',
                color: color,
                minHeight: '40px',
                fontFamily: '"Comic Sans MS", "Segoe Print", "Bradley Hand", cursive'
              }}
              placeholder="Digite aqui... (Enter para confirmar, Shift+Enter para nova linha)"
              rows={1}
            />
            </div>
          )}

        <div className={`absolute bottom-4 right-4 ${t.card} border ${t.cardBorder} ${t.text} px-4 py-2 rounded-xl shadow-lg text-xs space-y-1`}>
          <div className="font-semibold">Página {currentPageIndex + 1}/{pages.length}</div>
          <div className={t.textMuted}>Traços: {strokes.length}</div>
          <div className={t.textMuted}>Ferramenta: {tool}</div>
          <div className={t.textMuted}>Zoom: {Math.round(canvasScale * 100)}%</div>
            </div>
          </div>
          </div>
  );
}