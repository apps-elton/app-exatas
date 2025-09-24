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
  Type,
  Ruler
} from 'lucide-react';
import TabletPressureIndicator from './TabletPressureIndicator';
import TabletAdvancedSettings from './TabletAdvancedSettings';
import { TabletSettings } from '@/types/tablet';

export interface DrawingTool {
  type: 'pen' | 'pencil' | 'marker' | 'eraser' | 'text' | 'ruler' | 'select' | 'area-select';
  name: string;
  icon: React.ReactNode;
}

export interface DrawingStyle {
  color: string;
  thickness: number;
  opacity: number;
  pressure: boolean;
  smoothing: number;
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
  { type: 'select', name: 'Seleção', icon: <MousePointer className="w-4 h-4" /> },
  { type: 'pen', name: 'Caneta', icon: <Pen className="w-4 h-4" /> },
  { type: 'pencil', name: 'Lápis', icon: <Pen className="w-4 h-4" /> },
  { type: 'marker', name: 'Marcador', icon: <Pen className="w-4 h-4" /> },
  { type: 'eraser', name: 'Borracha', icon: <Eraser className="w-4 h-4" /> },
  { type: 'text', name: 'Texto', icon: <Type className="w-4 h-4" /> },
  { type: 'ruler', name: 'Régua', icon: <Ruler className="w-4 h-4" /> },
  { type: 'area-select', name: 'Seleção de Área', icon: <MousePointer className="w-4 h-4" /> }
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
    thickness: 13,
    opacity: 1,
    pressure: false, // Desativar variação de pressão
    smoothing: 0.5
  });
  const [penType, setPenType] = useState('ballpoint');
  const [pencilType, setPencilType] = useState('hb');
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [history, setHistory] = useState<DrawingStroke[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentPressure, setCurrentPressure] = useState(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [tabletSettings, setTabletSettings] = useState<TabletSettings>({
    pressureSensitivity: 1,
    smoothingLevel: 0.5,
    autoSave: true,
    tabletMode: 'pen'
  });
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  
  // Estados para seleção de área
  const [isAreaSelecting, setIsAreaSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{x: number, y: number} | null>(null);
  const [selectedStrokes, setSelectedStrokes] = useState<string[]>([]);

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

  const startDrawing = useCallback((event: React.PointerEvent) => {
    if (!isActive) return;

    // Modo borracha seletiva
    if (activeTool.type === 'eraser' && isEraserMode) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Encontrar e remover traços próximos ao clique
      const threshold = 20; // pixels
      const newStrokes = strokes.filter(stroke => {
        return !stroke.points.some(point => {
          const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
          return distance < threshold;
        });
      });

      setStrokes(newStrokes);
      onDrawingChange?.(newStrokes);
      return;
    }

    // Modo texto
    if (activeTool.type === 'text') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (textInput.trim()) {
        addText(textInput, x, y);
      } else {
        setShowTextInput(true);
      }
      return;
    }

    // Modo seleção
    if (activeTool.type === 'select') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const pressure = event.pressure || 0.5;

    setCurrentPressure(pressure);

    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}-${Math.random()}`,
      tool: activeTool,
      style: { ...drawingStyle },
      points: [{
        x,
        y,
        pressure,
        timestamp: Date.now()
      }],
      timestamp: Date.now()
    };

    setCurrentStroke(newStroke);
    setIsDrawing(true);
  }, [isActive, activeTool, drawingStyle, isEraserMode, strokes, onDrawingChange]);

  const draw = useCallback((event: React.PointerEvent) => {
    if (!isDrawing || !currentStroke || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const pressure = event.pressure || 0.5;

    setCurrentPressure(pressure);

    const newPoint: DrawingPoint = {
      x,
      y,
      pressure,
      timestamp: Date.now()
    };

    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, newPoint]
    };

    setCurrentStroke(updatedStroke);
    drawStroke(updatedStroke);
  }, [isDrawing, currentStroke]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing || !currentStroke) return;

    setStrokes(prev => {
      const newStrokes = [...prev, currentStroke];
      setHistory(prev => [...prev.slice(0, historyIndex + 1), newStrokes]);
      setHistoryIndex(prev => prev + 1);
      onDrawingChange?.(newStrokes);
      return newStrokes;
    });

    setCurrentStroke(null);
    setIsDrawing(false);
  }, [isDrawing, currentStroke, historyIndex, onDrawingChange]);

  const drawStroke = useCallback((stroke: DrawingStroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.globalAlpha = stroke.style.opacity;

    if (stroke.tool.type === 'text' && (stroke as any).text) {
      // Desenhar texto
      let textColor = stroke.style.color;
      if (textColor === '#ffffff' || textColor === '#FFFFFF' || textColor === 'white') {
        textColor = '#000000';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 3;
      }
      ctx.fillStyle = textColor;
      ctx.font = `${stroke.style.thickness * 4}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText((stroke as any).text, stroke.points[0].x, stroke.points[0].y);
    } else if (stroke.points.length >= 2) {
      // Desenhar traço normal
      let strokeColor = stroke.style.color;
      if (strokeColor === '#ffffff' || strokeColor === '#FFFFFF' || strokeColor === 'white') {
        strokeColor = '#000000';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 2;
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = stroke.style.thickness; // Sem variação de pressão
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool.type === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        const prevPoint = stroke.points[i - 1];
        
        if (stroke.style.smoothing > 0) {
          const cp1x = prevPoint.x + (point.x - prevPoint.x) * stroke.style.smoothing;
          const cp1y = prevPoint.y + (point.y - prevPoint.y) * stroke.style.smoothing;
          const cp2x = point.x - (point.x - prevPoint.x) * stroke.style.smoothing;
          const cp2y = point.y - (point.y - prevPoint.y) * stroke.style.smoothing;
          
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }

      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    setHistory([]);
    setHistoryIndex(-1);
    onDrawingChange?.([]);
  }, [onDrawingChange]);

  const redrawCanvas = useCallback((strokesToDraw: DrawingStroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesToDraw.forEach(stroke => drawStroke(stroke));
  }, [drawStroke]);

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

  // Aplicar configurações do tipo de caneta
  const applyPenTypeSettings = useCallback((penType: string) => {
    const penSettings = {
      ballpoint: { thickness: 1.5, opacity: 0.9, smoothing: 0.3 },
      fountain: { thickness: 2, opacity: 0.8, smoothing: 0.5 },
      gel: { thickness: 1.8, opacity: 0.95, smoothing: 0.4 },
      marker: { thickness: 3, opacity: 0.7, smoothing: 0.2 },
      brush: { thickness: 4, opacity: 0.6, smoothing: 0.8 }
    };
    
    const settings = penSettings[penType as keyof typeof penSettings];
    if (settings) {
      const newStyle = { ...drawingStyle, ...settings };
      setDrawingStyle(newStyle);
      onStyleChange?.(newStyle);
    }
  }, [drawingStyle, onStyleChange]);

  // Aplicar configurações do tipo de lápis
  const applyPencilTypeSettings = useCallback((pencilType: string) => {
    const pencilSettings = {
      hb: { thickness: 1.5, opacity: 0.8, smoothing: 0.4 },
      '2b': { thickness: 2, opacity: 0.9, smoothing: 0.6 },
      '4b': { thickness: 2.5, opacity: 0.95, smoothing: 0.7 },
      '6b': { thickness: 3, opacity: 1, smoothing: 0.8 },
      h: { thickness: 1, opacity: 0.7, smoothing: 0.2 },
      charcoal: { thickness: 3.5, opacity: 0.9, smoothing: 0.9 },
      colored: { thickness: 2.2, opacity: 0.85, smoothing: 0.5 }
    };
    
    const settings = pencilSettings[pencilType as keyof typeof pencilSettings];
    if (settings) {
      const newStyle = { ...drawingStyle, ...settings };
      setDrawingStyle(newStyle);
      onStyleChange?.(newStyle);
    }
  }, [drawingStyle, onStyleChange]);

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

  // Adicionar texto
  const addText = useCallback((text: string, x: number, y: number) => {
    if (!text.trim()) return;

    const textStroke: DrawingStroke = {
      id: `text-${Date.now()}-${Math.random()}`,
      tool: { type: 'text', name: 'Texto', icon: null },
      style: { ...drawingStyle },
      points: [{ x, y, pressure: 1, timestamp: Date.now() }],
      timestamp: Date.now(),
      text: text
    } as any;

    const newStrokes = [...strokes, textStroke];
    setStrokes(newStrokes);
    onDrawingChange?.(newStrokes);
    setShowTextInput(false);
    setTextInput('');
  }, [drawingStyle, strokes, onDrawingChange]);

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
          {/* Ferramentas Essenciais */}
          <div className="grid grid-cols-2 gap-1">
            {DRAWING_TOOLS.slice(0, 2).map((tool) => (
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
            <Button
              variant={activeTool.type === 'eraser' ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolChange({ type: 'eraser', name: 'Borracha', icon: null })}
              className="h-10 flex flex-col items-center gap-1 p-1"
            >
              <Eraser className="w-4 h-4" />
              <span className="text-xs">Borracha</span>
            </Button>
            <Button
              variant={activeTool.type === 'text' ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolChange({ type: 'text', name: 'Texto', icon: null })}
              className="h-10 flex flex-col items-center gap-1 p-1"
            >
              <Type className="w-4 h-4" />
              <span className="text-xs">Texto</span>
            </Button>
          </div>

          {/* Cores Essenciais */}
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

          {/* Espessura */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Espessura</span>
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
        </CardContent>
      )}
    </Card>
  );
}
