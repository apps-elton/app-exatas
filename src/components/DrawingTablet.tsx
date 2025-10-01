import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { 
  Pen, 
  Eraser, 
  Palette, 
  Settings, 
  Undo, 
  Redo, 
  Trash2,
  MousePointer,
  Ruler
} from 'lucide-react';
// Removed unused imports

export interface DrawingTool {
  type: 'pen' | 'pencil' | 'marker' | 'eraser' | 'ruler' | 'select' | 'area-select';
  name: string;
  icon: React.ReactNode;
}

export interface DrawingStyle {
  color: string;
  thickness: number;
  opacity: number;
  pressure: boolean;
  smoothing: number;
  fontFamily?: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

export interface DrawingStroke {
  id: string;
  tool: DrawingTool;
  style: DrawingStyle;
  points: DrawingPoint[];
  timestamp: number;
}

interface DrawingTabletProps {
  isActive: boolean;
  onToggle: () => void;
  onDrawingChange?: (strokes: DrawingStroke[]) => void;
  currentStyle?: DrawingStyle;
  currentTool?: DrawingTool;
  onStyleChange?: (style: DrawingStyle) => void;
  onToolChange?: (tool: DrawingTool) => void;
  className?: string;
}

const DRAWING_TOOLS: DrawingTool[] = [
  { type: 'pen', name: 'Caneta', icon: <Pen className="w-4 h-4" /> },
  { type: 'pencil', name: 'Lápis', icon: <Pen className="w-4 h-4" /> },
  { type: 'marker', name: 'Marcador', icon: <Pen className="w-4 h-4" /> },
  { type: 'eraser', name: 'Borracha', icon: <Eraser className="w-4 h-4" /> },
  { type: 'ruler', name: 'Régua', icon: <Ruler className="w-4 h-4" /> }
];

const PEN_TYPES = [
  { value: 'ballpoint', label: 'Caneta Esferográfica' },
  { value: 'fountain', label: 'Caneta Tinteiro' },
  { value: 'gel', label: 'Caneta Gel' },
  { value: 'marker', label: 'Marcador' },
  { value: 'brush', label: 'Pincel' }
];

const PENCIL_TYPES = [
  { value: 'hb', label: 'HB (Padrão)' },
  { value: '2b', label: '2B (Macio)' },
  { value: '4b', label: '4B (Muito Macio)' },
  { value: '6b', label: '6B (Extra Macio)' },
  { value: 'h', label: 'H (Duro)' },
  { value: 'charcoal', label: 'Carvão' },
  { value: 'colored', label: 'Colorido' }
];

const COLORS = [
  { value: '#000000', label: 'Preto' },
  { value: '#ffffff', label: 'Branco' },
  { value: '#ff0000', label: 'Vermelho' },
  { value: '#00ff00', label: 'Verde' },
  { value: '#0000ff', label: 'Azul' },
  { value: '#ffff00', label: 'Amarelo' },
  { value: '#ff00ff', label: 'Magenta' },
  { value: '#00ffff', label: 'Ciano' },
  { value: '#ffa500', label: 'Laranja' },
  { value: '#800080', label: 'Roxo' },
  { value: '#8b4513', label: 'Marrom' },
  { value: '#808080', label: 'Cinza' }
];

export default function DrawingTablet({ 
  isActive, 
  onToggle, 
  onDrawingChange,
  currentStyle,
  currentTool,
  onStyleChange,
  onToolChange,
  className = '' 
}: DrawingTabletProps) {
  const [activeTool, setActiveTool] = useState<DrawingTool>(currentTool || DRAWING_TOOLS[0]);
  
  const [drawingStyle, setDrawingStyle] = useState<DrawingStyle>(currentStyle || {
    color: '#ffffff',
    thickness: 2,
    opacity: 1,
    pressure: true,
    smoothing: 0.8, // Suavização alta para eliminar retas
    fontFamily: 'Poppins' // Fonte padrão
  });
  
  // Estados para fluidez da caneta
  const [currentPressure, setCurrentPressure] = useState(0.5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastTimeRef, setLastTimeRef] = useState(0);
  
  // Constantes para fluidez
  const MIN_DISTANCE = 2;
  const FRAME_TIME = 16;
  
  // Funções auxiliares para fluidez
  const distance = (p1: DrawingPoint, p2: DrawingPoint) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const smoothPoints = (points: DrawingPoint[], factor: number): DrawingPoint[] => {
    if (points.length < 3 || factor === 0) return points;
    
    const result: DrawingPoint[] = [points[0]];
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      result.push({
        x: curr.x * (1 - factor) + (prev.x + next.x) * 0.5 * factor,
        y: curr.y * (1 - factor) + (prev.y + next.y) * 0.5 * factor,
        pressure: curr.pressure,
        timestamp: curr.timestamp
      });
    }
    
    result.push(points[points.length - 1]);
    return result;
  };
  const [penType, setPenType] = useState('ballpoint');
  const [pencilType, setPencilType] = useState('hb');
  
  // Configurações de ferramentas com suavização alta
  const toolConfigs = {
    pen: {
      ballpoint: { smoothing: 0.8, pressure: true, thickness: 2 },
      gel: { smoothing: 0.9, pressure: true, thickness: 1.5 },
      fountain: { smoothing: 0.7, pressure: true, thickness: 2.5 }
    },
    pencil: {
      hb: { smoothing: 0.6, pressure: true, thickness: 1.8 },
      '2b': { smoothing: 0.5, pressure: true, thickness: 2.2 },
      '4b': { smoothing: 0.4, pressure: true, thickness: 2.8 }
    }
  };
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [history, setHistory] = useState<DrawingStroke[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  

  // Aplicar configurações específicas da ferramenta para smooth draw
  useEffect(() => {
    if (activeTool.type === 'pen') {
      const config = toolConfigs.pen[penType as keyof typeof toolConfigs.pen];
      if (config) {
        setDrawingStyle(prev => ({
          ...prev,
          smoothing: config.smoothing,
          pressure: config.pressure,
          thickness: config.thickness
        }));
        onStyleChange?.({
          ...prev,
          smoothing: config.smoothing,
          pressure: config.pressure,
          thickness: config.thickness
        });
      }
    } else if (activeTool.type === 'pencil') {
      const config = toolConfigs.pencil[pencilType as keyof typeof toolConfigs.pencil];
      if (config) {
        setDrawingStyle(prev => ({
          ...prev,
          smoothing: config.smoothing,
          pressure: config.pressure,
          thickness: config.thickness
        }));
        onStyleChange?.({
          ...prev,
          smoothing: config.smoothing,
          pressure: config.pressure,
          thickness: config.thickness
        });
      }
    }
  }, [activeTool.type, penType, pencilType, onStyleChange]);
  const [currentPressure, setCurrentPressure] = useState(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [tabletSettings, setTabletSettings] = useState({
    pressureSensitivity: 1,
    smoothingLevel: 0.5,
    autoSave: true,
    tabletMode: 'pen'
  });
  const [isEraserMode, setIsEraserMode] = useState(false);
  
  // Estados para seleção de área
  const [isAreaSelecting, setIsAreaSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{x: number, y: number} | null>(null);
  const [selectedStrokes, setSelectedStrokes] = useState<string[]>([]);

  // Estados para desenho assistido (Samsung Notes style)
  const [assistedDrawing, setAssistedDrawing] = useState(false);
  const [strokeStartTime, setStrokeStartTime] = useState<number | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sincronizar com props externas
  useEffect(() => {
    if (currentStyle) {
      setDrawingStyle(currentStyle);
    }
  }, [currentStyle]);

  useEffect(() => {
    if (currentTool) {
      setActiveTool(currentTool);
    }
  }, [currentTool]);

  // Detectar mesa digitalizadora
  useEffect(() => {
    const handleTabletDetected = (event: any) => {
      if (event.pointerType === 'pen') {
        console.log('Mesa digitalizadora detectada:', event);
      }
    };

    if (isActive) {
      document.addEventListener('pointerdown', handleTabletDetected);
      document.addEventListener('pointermove', handleTabletDetected);
    }

    return () => {
      document.removeEventListener('pointerdown', handleTabletDetected);
      document.removeEventListener('pointermove', handleTabletDetected);
    };
  }, [isActive]);

  // Atalhos de teclado para ferramentas
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isActive) return;

      // Atalhos para ferramentas
      switch (event.key.toLowerCase()) {
        case 'p':
          event.preventDefault();
          handleToolChange(DRAWING_TOOLS.find(t => t.type === 'pen')!);
          break;
        case 'l':
          event.preventDefault();
          handleToolChange(DRAWING_TOOLS.find(t => t.type === 'pencil')!);
          break;
        case 'h':
          event.preventDefault();
          handleToolChange(DRAWING_TOOLS.find(t => t.type === 'marker')!);
          break;
        case 'e':
          event.preventDefault();
          handleToolChange(DRAWING_TOOLS.find(t => t.type === 'eraser')!);
          break;
        case 'z':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'y':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            redo();
          }
          break;
        case 'delete':
        case 'backspace':
          event.preventDefault();
          clearCanvas();
          break;
      }
    };

    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handleToolChange, undo, redo, clearCanvas]);

  const getPoint = useCallback((e: React.PointerEvent): DrawingPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5, timestamp: Date.now() };
    
    const rect = canvas.getBoundingClientRect();
    const p = e.pressure || (e.pointerType === 'pen' ? 0.7 : 0.5);
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: Math.max(0.3, Math.min(1, p)),
      timestamp: Date.now()
    };
  }, []);

  const startDrawing = useCallback((event: React.PointerEvent) => {
    if (!isActive) return;
    
    event.preventDefault();
    const point = getPoint(event);
    setCurrentPressure(point.pressure);
    
    setCurrentStroke({
      id: Date.now().toString(),
      tool: activeTool,
      points: [point],
      color: drawingStyle.color,
      thickness: drawingStyle.thickness,
      opacity: drawingStyle.opacity
    });
    setIsDrawing(true);
  }, [isActive, activeTool, drawingStyle, getPoint]);

  const draw = useCallback((event: React.PointerEvent) => {
    if (!isDrawing || !currentStroke) return;
    
    event.preventDefault();
    const now = performance.now();
    if (now - lastTimeRef < FRAME_TIME) return;
    setLastTimeRef(now);
    
    const point = getPoint(event);
    setCurrentPressure(point.pressure);
    
    const last = currentStroke.points[currentStroke.points.length - 1];
    if (distance(last, point) < MIN_DISTANCE) return;
    
    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, point]
    });
  }, [isDrawing, currentStroke, getPoint]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    
    setCurrentStroke(null);
    setIsDrawing(false);
  }, [isDrawing, currentStroke]);

  // Função para verificar se os pontos formam uma linha aproximadamente reta
  const isApproximatelyStraightLine = useCallback((points: DrawingPoint[]) => {
    if (points.length < 3) return false;
    
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    
    // Calcular a distância total da linha reta
    const straightDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
    );
    
    if (straightDistance < 20) return false; // Linha muito curta
    
    // Calcular a distância total percorrida pelos pontos
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Se a distância percorrida é muito maior que a linha reta, não é uma linha reta
    const ratio = totalDistance / straightDistance;
    
    // Se a razão for menor que 1.3, é aproximadamente uma linha reta
    return ratio < 1.3;
  }, []);


  const drawStroke = useCallback((stroke: DrawingStroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.color;
    ctx.globalCompositeOperation = stroke.tool.type === 'eraser' ? 'destination-out' : 'source-over';
    
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    for (let i = 1; i < stroke.points.length; i++) {
      const curr = stroke.points[i - 1];
      const next = stroke.points[i];
      
      const p = curr.pressure;
      const w = stroke.thickness * (0.5 + p * 1.5);
      
      ctx.lineWidth = w;
      ctx.globalAlpha = stroke.opacity;
      
      const cpx = (curr.x + next.x) / 2;
      const cpy = (curr.y + next.y) / 2;
      ctx.quadraticCurveTo(curr.x, curr.y, cpx, cpy);
    }
    
    ctx.stroke();
    ctx.restore();
    
    // Textura para lápis
    if (stroke.tool.type === 'pencil') {
      ctx.save();
      ctx.globalAlpha = stroke.opacity * 0.3;
      ctx.lineWidth = 1;
      
      for (let i = 0; i < stroke.points.length - 1; i++) {
        const curr = stroke.points[i];
        const next = stroke.points[i + 1];
        const offset = Math.random() * 2 - 1;
        
        ctx.beginPath();
        ctx.moveTo(curr.x + offset, curr.y + offset);
        ctx.lineTo(next.x + offset, next.y + offset);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, []);

  const redrawCanvas = useCallback((strokesToDraw: DrawingStroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar strokes
    [...strokesToDraw, currentStroke].filter(Boolean).forEach((stroke) => {
      if (!stroke || stroke.points.length < 2) return;
      
      const smoothed = smoothPoints(stroke.points, drawingStyle.smoothing);
      
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.color;
      ctx.globalCompositeOperation = stroke.tool.type === 'eraser' ? 'destination-out' : 'source-over';
      
      ctx.beginPath();
      ctx.moveTo(smoothed[0].x, smoothed[0].y);
      
      for (let i = 1; i < smoothed.length; i++) {
        const curr = smoothed[i - 1];
        const next = smoothed[i];
        
        const p = curr.pressure;
        const w = stroke.thickness * (0.5 + p * 1.5);
        
        ctx.lineWidth = w;
        ctx.globalAlpha = stroke.opacity;
        
        const cpx = (curr.x + next.x) / 2;
        const cpy = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, cpx, cpy);
      }
      
      ctx.stroke();
      ctx.restore();
      
      // Textura para lápis
      if (stroke.tool.type === 'pencil') {
        ctx.save();
        ctx.globalAlpha = stroke.opacity * 0.3;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < smoothed.length - 1; i++) {
          const curr = smoothed[i];
          const next = smoothed[i + 1];
          const offset = Math.random() * 2 - 1;
          
          ctx.beginPath();
          ctx.moveTo(curr.x + offset, curr.y + offset);
          ctx.lineTo(next.x + offset, next.y + offset);
          ctx.stroke();
        }
        ctx.restore();
      }
    });
  }, [drawStroke, currentStroke, drawingStyle.smoothing]);

  const clearCanvas = useCallback(() => {
    console.log('clearCanvas called');
    
    // Limpar todos os estados locais
    setStrokes([]);
    setHistory([]);
    setHistoryIndex(-1);
    setCurrentStroke(null);
    setIsDrawing(false);
    console.log('Local states cleared');
    
    // Notificar o componente pai (DrawingOverlay3D) para limpar o canvas real
    onDrawingChange?.([]);
    console.log('Parent notified with empty array - this should clear the real canvas');
  }, [onDrawingChange]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const newStrokes = history[newIndex] || [];
      setStrokes(newStrokes);
      setHistoryIndex(newIndex);
      onDrawingChange?.(newStrokes);
      redrawCanvas(newStrokes);
    }
  }, [history, historyIndex, onDrawingChange, redrawCanvas]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const newStrokes = history[newIndex] || [];
      setStrokes(newStrokes);
      setHistoryIndex(newIndex);
      onDrawingChange?.(newStrokes);
      redrawCanvas(newStrokes);
    }
  }, [history, historyIndex, onDrawingChange, redrawCanvas]);

  const handleStyleChange = useCallback((key: keyof DrawingStyle, value: any) => {
    setDrawingStyle(prev => {
      const newStyle = { ...prev, [key]: value };
      // Notificar mudança para o componente pai
      onStyleChange?.(newStyle);
      // Forçar redesenho imediato do canvas
      setTimeout(() => {
        const strokesToDraw = [...strokes];
        if (currentStroke) {
          strokesToDraw.push(currentStroke);
        }
        redrawCanvas(strokesToDraw);
      }, 0);
      return newStyle;
    });
  }, [redrawCanvas, strokes, currentStroke, onStyleChange]);

  const handleToolChange = useCallback((tool: DrawingTool) => {
    setActiveTool(tool);
    onToolChange?.(tool);
  }, [onToolChange]);

  // Aplicar configurações do tipo de caneta - Otimizadas para fluidez
  const applyPenTypeSettings = useCallback((penType: string) => {
    const penSettings = {
      ballpoint: { thickness: 1.5, opacity: 0.9, smoothing: 0.6, pressure: true },
      fountain: { thickness: 2, opacity: 0.8, smoothing: 0.8, pressure: true },
      gel: { thickness: 1.8, opacity: 0.95, smoothing: 0.7, pressure: true },
      marker: { thickness: 3, opacity: 0.7, smoothing: 0.5, pressure: true },
      brush: { thickness: 4, opacity: 0.6, smoothing: 0.9, pressure: true }
    };
    
    const settings = penSettings[penType as keyof typeof penSettings];
    if (settings) {
      const newStyle = { ...drawingStyle, ...settings };
      setDrawingStyle(newStyle);
      onStyleChange?.(newStyle);
    }
  }, [drawingStyle, onStyleChange]);

  // Aplicar configurações do tipo de lápis - Otimizadas para fluidez
  const applyPencilTypeSettings = useCallback((pencilType: string) => {
    const pencilSettings = {
      hb: { thickness: 1.5, opacity: 0.8, smoothing: 0.6, pressure: true },
      '2b': { thickness: 2, opacity: 0.9, smoothing: 0.7, pressure: true },
      '4b': { thickness: 2.5, opacity: 0.95, smoothing: 0.8, pressure: true },
      '6b': { thickness: 3, opacity: 1, smoothing: 0.9, pressure: true },
      h: { thickness: 1, opacity: 0.7, smoothing: 0.5, pressure: true },
      charcoal: { thickness: 3.5, opacity: 0.9, smoothing: 0.9, pressure: true },
      colored: { thickness: 2.2, opacity: 0.85, smoothing: 0.7, pressure: true }
    };
    
    const settings = pencilSettings[pencilType as keyof typeof pencilSettings];
    if (settings) {
      const newStyle = { ...drawingStyle, ...settings };
      setDrawingStyle(newStyle);
      onStyleChange?.(newStyle);
    }
  }, [drawingStyle, onStyleChange]);

  // Auto opacity para highlighter
  useEffect(() => {
    if (activeTool.type === 'marker') {
      setDrawingStyle(prev => ({ ...prev, opacity: 0.3 }));
    } else {
      setDrawingStyle(prev => ({ ...prev, opacity: 1 }));
    }
  }, [activeTool.type]);

  // Redesenhar canvas quando o estilo mudar
  useEffect(() => {
    if (isActive) {
      const strokesToDraw = [...strokes];
      if (currentStroke) {
        strokesToDraw.push(currentStroke);
      }
      redrawCanvas(strokesToDraw);
    }
  }, [drawingStyle, isActive, redrawCanvas, strokes, currentStroke]);

  // Função addText removida - delegada para DrawingOverlay3D

  // Alternar modo borracha
  const toggleEraserMode = useCallback(() => {
    setIsEraserMode(prev => !prev);
  }, []);

  const getToolIcon = (tool: DrawingTool) => {
    return tool.icon;
  };

  const getToolColor = (tool: DrawingTool) => {
    if (tool.type === 'eraser') return 'text-red-500';
    if (tool.type === 'select') return 'text-blue-500';
    return 'text-gray-700 dark:text-gray-300';
  };

  return (
    <Card className={`${className} ${isActive ? 'border-primary' : ''} sticky top-4`}>
      <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-primary flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Mesa Digitalizadora
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="tablet-toggle" className="text-sm">
                  {isActive ? 'Ativa' : 'Inativa'}
                </Label>
                <Switch
                  id="tablet-toggle"
                  checked={isActive}
                  onCheckedChange={onToggle}
                />
              </div>
            </div>
          </div>
      </CardHeader>

      {isActive && (
        <CardContent className="space-y-3">
          {/* Ferramentas de Desenho */}
          <div className="grid grid-cols-5 gap-1">
            {DRAWING_TOOLS.map((tool) => (
              <Button
                key={tool.type}
                variant={activeTool.type === tool.type ? "default" : "outline"}
                size="sm"
                onClick={() => handleToolChange(tool)}
                className="h-10 flex flex-col items-center gap-1 p-1"
              >
                {getToolIcon(tool)}
                <span className="text-xs">{tool.name}</span>
              </Button>
            ))}
          </div>

          {/* Cores Essenciais - Mostrar sempre */}
          <div className="grid grid-cols-6 gap-1">
            {COLORS.slice(0, 6).map((color) => (
              <button
                key={color.value}
                className={`w-6 h-6 rounded border-2 ${
                  drawingStyle.color === color.value 
                    ? 'border-primary ring-2 ring-primary/30' 
                    : 'border-border'
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleStyleChange('color', color.value)}
                title={color.label}
              />
            ))}
          </div>

          {/* Espessura - Mostrar sempre */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{activeTool.type === 'select' ? 'Tamanho do Texto' : 'Espessura'}</span>
              <span>{drawingStyle.thickness}px</span>
            </div>
            <Slider
              value={[drawingStyle.thickness]}
              onValueChange={([value]) => handleStyleChange('thickness', value)}
              min={0.5}
              max={20}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Input de Texto removido - delegado para DrawingOverlay3D */}

          {/* Configurações de Fluidez */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Suavização</span>
              <span>{Math.round(drawingStyle.smoothing * 100)}%</span>
            </div>
            <Slider
              value={[drawingStyle.smoothing]}
              onValueChange={([value]) => handleStyleChange('smoothing', value)}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Sensibilidade à Pressão */}
          <div className="flex items-center justify-between p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-xs text-blue-400 font-medium">Sensibilidade à Pressão</span>
            </div>
            <Switch
              checked={drawingStyle.pressure}
              onCheckedChange={(checked) => handleStyleChange('pressure', checked)}
              className="scale-75"
            />
          </div>

          {/* Desenho Assistido */}
          <div className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">Desenho Assistido</span>
            </div>
            <Switch
              checked={assistedDrawing}
              onCheckedChange={setAssistedDrawing}
              className="scale-75"
            />
          </div>


          {/* Indicador de Pressão */}
          {isDrawing && (
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-xs text-blue-400 font-medium">
                Pressão: {Math.round(currentPressure * 100)}%
              </div>
            </div>
          )}

          {/* Ações Essenciais */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="h-8 flex items-center gap-1 text-xs"
              >
                <Undo className="w-3 h-3" />
                Desfazer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="h-8 flex items-center gap-1 text-xs"
              >
                <Redo className="w-3 h-3" />
                Refazer
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearCanvas}
              className="w-full h-8 flex items-center gap-1 text-xs"
            >
              <Trash2 className="w-3 h-3" />
              Limpar Tudo
            </Button>
          </div>

          {/* Informações de Status */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Traços: {strokes.length}</div>
            <div>Ferramenta: {activeTool.name}</div>
            <div>Cor: {drawingStyle.color}</div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
