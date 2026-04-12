import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// ==========================================
// TIPOS E INTERFACES
// ==========================================

export type DrawingToolType = 
  | 'pen' 
  | 'pencil' 
  | 'eraser'
  | 'marker'
  | 'technical'
  | 'chalk'
  | 'highlighter'
  | 'rectangle'
  | 'square'
  | 'circle'
  | 'line'
  | 'dashed-line'
  | 'arrow'
  | 'text'
  | 'select';

export interface DrawingPoint {
  x: number;
  y: number;
  pressure: number;
  timestamp?: number;
}

export interface DrawingStyle {
  color: string;
  thickness: number;
  opacity: number;
  pressure: boolean;
  smoothing: number;
  fontFamily?: string;
}

export interface DrawingTool {
  type: DrawingToolType;
  name: string;
  icon?: any;
}

export interface DrawingStroke {
  id: string;
  tool: DrawingTool;
  style: DrawingStyle;
  points: DrawingPoint[];
  timestamp: number;
  shapeType?: 'rectangle' | 'square' | 'circle' | 'line' | 'arrow';
  text?: string;
  fontSize?: number;
  properties?: {
    startPoint: DrawingPoint;
    endPoint: DrawingPoint;
    isDashed?: boolean;
    showMeasure?: boolean;
    measureValue?: string;
  };
}

interface DrawingOverlay3DProps {
  isActive: boolean;
  drawingStrokes: DrawingStroke[];
  onDrawingChange: (strokes: DrawingStroke[]) => void;
  currentStyle?: DrawingStyle;
  currentTool?: DrawingTool;
  activeTool?: string;
  className?: string;
}

// ==========================================
// CONSTANTES DE PERFORMANCE
// ==========================================

const RENDER_THROTTLE = 16; // ~60fps
const MIN_POINT_DISTANCE = 2; // pixels - filtra pontos muito próximos

// ==========================================
// CONFIGURAÇÕES DE CANETA (TEXTURAS E OPACIDADE)
// ==========================================

const PEN_CONFIGS = {
  pen: { opacity: 1, texture: 'smooth', thickness: 1 },
  pencil: { opacity: 0.75, texture: 'rough', thickness: 1 },
  marker: { opacity: 0.6, texture: 'marker', thickness: 2.5 },
  technical: { opacity: 1, texture: 'precise', thickness: 0.25 },
  chalk: { opacity: 0.8, texture: 'chalk', thickness: 2 },
  highlighter: { opacity: 0.3, texture: 'highlight', thickness: 5 }
};

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

const smoothPoints = (points: DrawingPoint[], smoothingFactor: number): DrawingPoint[] => {
  if (points.length < 3 || smoothingFactor === 0) return points;
  
  const smoothed: DrawingPoint[] = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    // Algoritmo de suavização exato do código enviado
    smoothed.push({
      x: curr.x * (1 - smoothingFactor) + (prev.x + next.x) * 0.5 * smoothingFactor,
      y: curr.y * (1 - smoothingFactor) + (prev.y + next.y) * 0.5 * smoothingFactor,
      pressure: curr.pressure,
    });
  }
  
  smoothed.push(points[points.length - 1]);
  return smoothed;
};

const calculateDistance = (p1: DrawingPoint, p2: DrawingPoint): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const snapToGrid = (point: DrawingPoint, gridSize: number, enabled: boolean): DrawingPoint => {
  if (!enabled) return point;
  return {
    ...point,
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function DrawingOverlay3D({
  isActive,
  drawingStrokes,
  onDrawingChange,
  currentStyle,
  currentTool,
  activeTool,
  className = ''
}: DrawingOverlay3DProps) {
  
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estados de desenho
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [currentPressure, setCurrentPressure] = useState(0.5);
  const [lastRenderTime, setLastRenderTime] = useState(0);
  
  // Estados de grade
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize] = useState(20);
  const [snapEnabled, setSnapEnabled] = useState(false);
  
  // Estados de preview de forma
  const [previewShape, setPreviewShape] = useState<DrawingStroke | null>(null);
  const [shapeStartPoint, setShapeStartPoint] = useState<DrawingPoint | null>(null);
  
  // Estados para ferramenta de texto
  const [textInputActive, setTextInputActive] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState<DrawingPoint | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  
  // Configurações padrão
  const defaultStyle: DrawingStyle = {
    color: '#ffffff',
    thickness: 2,
    opacity: 1,
    pressure: true,
    smoothing: 0.8
  };

  const defaultTool: DrawingTool = {
    type: 'pen',
    name: 'Caneta',
    icon: null
  };

  const activeStyle = currentStyle || defaultStyle;
  const activeToolConfig = currentTool || defaultTool;
  const effectiveActiveTool = activeTool || 'none';

  // ==========================================
  // REDIMENSIONAMENTO DO CANVAS
  // ==========================================
  
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, []);

  useEffect(() => {
    if (isActive) {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [isActive, resizeCanvas]);

  // ==========================================
  // FUNÇÕES DE DESENHO GEOMÉTRICO
  // ==========================================

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }, [showGrid, gridSize]);

  const drawRectangle = useCallback((ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (!stroke.properties) return;
    
    const { startPoint, endPoint, isDashed } = stroke.properties;
    const width = endPoint.x - startPoint.x;
    const height = endPoint.y - startPoint.y;
    
    ctx.save();
    ctx.strokeStyle = stroke.style.color;
    ctx.lineWidth = stroke.style.thickness;
    ctx.globalAlpha = stroke.style.opacity;
    
    if (isDashed) {
      ctx.setLineDash([10, 5]);
    }
    
    ctx.strokeRect(startPoint.x, startPoint.y, width, height);
    ctx.restore();
  }, []);

  const drawSquare = useCallback((ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (!stroke.properties) return;
    
    const { startPoint, endPoint } = stroke.properties;
    const width = endPoint.x - startPoint.x;
    const size = Math.abs(width);
      
    ctx.save();
    ctx.strokeStyle = stroke.style.color;
    ctx.lineWidth = stroke.style.thickness;
    ctx.globalAlpha = stroke.style.opacity;
    
    ctx.strokeRect(
      startPoint.x,
      startPoint.y,
      width > 0 ? size : -size,
      width > 0 ? size : -size
    );
    ctx.restore();
  }, []);

  const drawCircle = useCallback((ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (!stroke.properties) return;
    
    const { startPoint, endPoint } = stroke.properties;
    const radius = calculateDistance(startPoint, endPoint);
    
    ctx.save();
    ctx.strokeStyle = stroke.style.color;
    ctx.lineWidth = stroke.style.thickness;
    ctx.globalAlpha = stroke.style.opacity;
    
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, []);

  const drawLine = useCallback((ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (!stroke.properties) return;
    
    const { startPoint, endPoint, isDashed, showMeasure, measureValue } = stroke.properties;
    
    ctx.save();
    ctx.strokeStyle = stroke.style.color;
    ctx.lineWidth = stroke.style.thickness;
    ctx.globalAlpha = stroke.style.opacity;
    ctx.lineCap = 'round';
    
    if (isDashed) {
      ctx.setLineDash([10, 5]);
    }
    
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
    
    // Desenhar medida se ativado
    if (showMeasure && measureValue) {
      const midX = (startPoint.x + endPoint.x) / 2;
      const midY = (startPoint.y + endPoint.y) / 2;
      
      ctx.fillStyle = stroke.style.color;
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(measureValue, midX, midY - 10);
    }
    
    ctx.restore();
  }, []);

  const drawArrow = useCallback((ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (!stroke.properties) return;
    
    const { startPoint, endPoint } = stroke.properties;
    
    ctx.save();
    ctx.strokeStyle = stroke.style.color;
    ctx.lineWidth = stroke.style.thickness;
    ctx.globalAlpha = stroke.style.opacity;
    ctx.lineCap = 'round';
    
    // Linha principal
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
    
    // Ponta da seta
    const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
    const arrowSize = 15;
    
    ctx.beginPath();
    ctx.moveTo(endPoint.x, endPoint.y);
    ctx.lineTo(
      endPoint.x - arrowSize * Math.cos(angle - Math.PI / 6),
      endPoint.y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endPoint.x, endPoint.y);
    ctx.lineTo(
      endPoint.x - arrowSize * Math.cos(angle + Math.PI / 6),
      endPoint.y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
    
    ctx.restore();
  }, []);

  // ==========================================
  // FUNÇÃO PRINCIPAL: DESENHAR TRAÇO COM TEXTURA
  // ==========================================

  const drawFreehandStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length < 2) return;
    
    ctx.save();
    
    // Configurar estilo baseado no tipo de caneta
    const penConfig = PEN_CONFIGS[stroke.tool.type as keyof typeof PEN_CONFIGS] || PEN_CONFIGS.pen;
    
    if (stroke.tool.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.style.color;
    }
    
    const baseOpacity = penConfig.opacity * stroke.style.opacity;
    const thicknessMultiplier = penConfig.thickness;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Suavizar pontos com algoritmo melhorado
    const points = smoothPoints(stroke.points, stroke.style.smoothing);
    
    // Desenhar traço contínuo e fluido com pressão dinâmica
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const curr = points[i - 1];
      const next = points[i];
      const pressure = stroke.style.pressure ? next.pressure : 0.5;
      
      // Multiplicador de pressão mais responsivo (0.5 + pressure * 1.5)
      const pressureMultiplier = 0.5 + (pressure * 1.5);
      const width = stroke.style.thickness * thicknessMultiplier * pressureMultiplier;
      
      ctx.lineWidth = width;
      ctx.globalAlpha = baseOpacity * (0.7 + pressure * 0.3);
      
      // Usar curvas quadráticas para fluidez máxima
      if (i < points.length - 1) {
        const cpx = (curr.x + next.x) / 2;
        const cpy = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, cpx, cpy);
      } else {
        ctx.lineTo(next.x, next.y);
      }
    }
    
    ctx.stroke();
    
    // Adicionar textura para lápis e giz com algoritmo melhorado
    if (stroke.tool.type === 'pencil' || stroke.tool.type === 'chalk') {
      ctx.globalAlpha = baseOpacity * 0.3;
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        const curr = points[i - 1];
        const next = points[i];
        const offset = (Math.random() - 0.5) * 2; // Aumentar variação para textura mais realista
        
        if (i < points.length - 1) {
          const cpx = (curr.x + next.x) / 2 + offset;
          const cpy = (curr.y + next.y) / 2 + offset;
          ctx.quadraticCurveTo(curr.x + offset, curr.y + offset, cpx, cpy);
        } else {
          ctx.lineTo(next.x + offset, next.y + offset);
        }
      }
      
      ctx.stroke();
    }
    
    ctx.restore();
  }, []);

  const drawText = useCallback((ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (!stroke.text || !stroke.points.length) return;
    
    const point = stroke.points[0];
    const fontSize = stroke.fontSize || 16;
    
    ctx.save();
    ctx.fillStyle = stroke.style.color;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = stroke.style.opacity;
    
    // Desenhar texto com quebra de linha
    const lines = stroke.text.split('\n');
    lines.forEach((line, index) => {
      ctx.fillText(line, point.x, point.y + (index * fontSize * 1.2));
    });
    
    ctx.restore();
  }, []);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    // Desenhar texto
    if (stroke.tool.type === 'text' && stroke.text) {
      drawText(ctx, stroke);
      return;
    }
    
    // Desenhar formas geométricas
    if (stroke.shapeType) {
      switch (stroke.shapeType) {
        case 'rectangle':
          drawRectangle(ctx, stroke);
          break;
        case 'square':
          drawSquare(ctx, stroke);
          break;
        case 'circle':
          drawCircle(ctx, stroke);
          break;
        case 'line':
          drawLine(ctx, stroke);
          break;
        case 'arrow':
          drawArrow(ctx, stroke);
          break;
      }
    } else {
      // Desenhar traço livre
      drawFreehandStroke(ctx, stroke);
    }
  }, [drawRectangle, drawSquare, drawCircle, drawLine, drawArrow, drawFreehandStroke, drawText]);

  // ==========================================
  // RENDERIZAÇÃO DO CANVAS
  // ==========================================
  
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar grade
    drawGrid(ctx);
    
    // Desenhar strokes existentes
    drawingStrokes.forEach(stroke => drawStroke(ctx, stroke));
    
    // Desenhar stroke atual ou preview
    if (currentStroke) {
      drawStroke(ctx, currentStroke);
    }
    
    if (previewShape) {
      drawStroke(ctx, previewShape);
    }
  }, [drawingStrokes, currentStroke, previewShape, drawGrid, drawStroke]);

  useEffect(() => {
    if (isActive || drawingStrokes.length > 0) {
      redrawCanvas();
    }
  }, [isActive, drawingStrokes, redrawCanvas]);

  // ==========================================
  // HANDLERS DE POINTER
  // ==========================================
  
  const getPointerPos = useCallback((e: React.PointerEvent): DrawingPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Algoritmo de pressão exato do código enviado
    const pressure = e.pressure || (e.pointerType === 'pen' ? 0.7 : 0.5);
    const clampedPressure = Math.max(0.3, Math.min(1, pressure));
    
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: clampedPressure,
      timestamp: Date.now()
    };
    
    return snapToGrid(point, gridSize, snapEnabled);
  }, [snapEnabled, gridSize]);

  const isGeometricTool = useCallback((toolType: string): boolean => {
    return ['rectangle', 'square', 'circle', 'line', 'dashed-line', 'arrow'].includes(toolType);
  }, []);

  const startDrawing = useCallback((event: React.PointerEvent) => {
    if (!isActive) return;

    event.preventDefault();
    event.stopPropagation();

    const point = getPointerPos(event);
    setCurrentPressure(point.pressure);
    
    // Ferramenta de seleção - não desenha, apenas seleciona
    if (activeToolConfig.type === 'select') {
      console.log('Ferramenta de seleção ativada em:', point);
      return;
    }
    
    // Borracha
    if (activeToolConfig.type === 'eraser') {
      const threshold = 20;
      const newStrokes = drawingStrokes.filter(stroke => {
        return !stroke.points.some(p => calculateDistance(p, point) < threshold);
      });
      
      if (newStrokes.length !== drawingStrokes.length) {
        onDrawingChange(newStrokes);
      }
      setIsDrawing(true);
      return;
    }
    
    // Ferramenta de texto
    if (activeToolConfig.type === 'text') {
      setTextInputPosition(point);
      setTextInputActive(true);
      setTextInputValue('');
      return;
    }
    
    // Ferramentas geométricas
    if (isGeometricTool(activeToolConfig.type)) {
      setShapeStartPoint(point);
      setIsDrawing(true);
      return;
    }

    // Desenho livre
    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}-${Math.random()}`,
      tool: activeToolConfig,
      style: { ...activeStyle },
      points: [point],
      timestamp: Date.now()
    };

    setCurrentStroke(newStroke);
    setIsDrawing(true);
  }, [isActive, activeToolConfig, activeStyle, drawingStrokes, onDrawingChange, getPointerPos, isGeometricTool]);

  const draw = useCallback((event: React.PointerEvent) => {
    if (!isDrawing) return;

    event.preventDefault();
    event.stopPropagation();

    const currentPoint = getPointerPos(event);
    setCurrentPressure(currentPoint.pressure);
    
    // THROTTLE DE RENDERIZAÇÃO exato do código enviado (~60fps)
    const now = performance.now();
    if (now - lastRenderTime < RENDER_THROTTLE) return;
    setLastRenderTime(now);
    
    // Ferramenta de seleção - não desenha, apenas seleciona
    if (activeToolConfig.type === 'select') {
      return;
    }
    
    // Borracha contínua
    if (activeToolConfig.type === 'eraser') {
      const threshold = 20;
      const newStrokes = drawingStrokes.filter(stroke => {
        return !stroke.points.some(p => calculateDistance(p, currentPoint) < threshold);
      });

      if (newStrokes.length !== drawingStrokes.length) {
        onDrawingChange(newStrokes);
      }
      return;
    }
    
    // Preview de forma geométrica
    if (isGeometricTool(activeToolConfig.type) && shapeStartPoint) {
      const isDashed = activeToolConfig.type === 'dashed-line';
      const distance = calculateDistance(shapeStartPoint, currentPoint);
      
      const preview: DrawingStroke = {
        id: 'preview',
        tool: activeToolConfig,
        style: { ...activeStyle },
        points: [shapeStartPoint, currentPoint],
        timestamp: Date.now(),
        shapeType: activeToolConfig.type === 'dashed-line' ? 'line' : activeToolConfig.type as any,
        properties: {
          startPoint: shapeStartPoint,
          endPoint: currentPoint,
          isDashed,
          showMeasure: true,
          measureValue: `${distance.toFixed(1)}px`
        }
      };
      
      setPreviewShape(preview);
      redrawCanvas();
      return;
    }

    // Desenho livre com filtro de distância exato do código enviado
    if (currentStroke) {
      const lastPoint = currentStroke.points[currentStroke.points.length - 1];
      const distance = calculateDistance(lastPoint, currentPoint);
      
      // FILTRAR PONTOS MUITO PRÓXIMOS - exato do código enviado
      if (distance > MIN_POINT_DISTANCE) {
        const updatedStroke = {
          ...currentStroke,
          points: [...currentStroke.points, currentPoint]
        };

        setCurrentStroke(updatedStroke);
        
        // USAR RequestAnimationFrame para renderização suave
        requestAnimationFrame(() => {
          redrawCanvas();
        });
      }
    }
  }, [isDrawing, currentStroke, activeToolConfig, activeStyle, shapeStartPoint, drawingStrokes, onDrawingChange, getPointerPos, isGeometricTool, redrawCanvas, lastRenderTime]);

  const addTextToCanvas = useCallback((text: string) => {
    if (!textInputPosition || !text.trim()) return;
    
    const textStroke: DrawingStroke = {
      id: `text-${Date.now()}-${Math.random()}`,
      tool: activeToolConfig,
      style: { ...activeStyle },
      points: [textInputPosition],
      timestamp: Date.now(),
      text: text.trim(),
      fontSize: 16
    };
    
    const newStrokes = [...drawingStrokes, textStroke];
    onDrawingChange(newStrokes);
    
    setTextInputActive(false);
    setTextInputPosition(null);
    setTextInputValue('');
  }, [textInputPosition, activeToolConfig, activeStyle, drawingStrokes, onDrawingChange]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    // Ferramenta de seleção - não desenha, apenas seleciona
    if (activeToolConfig.type === 'select') {
      setIsDrawing(false);
      return;
    }

    // Finalizar forma geométrica
    if (isGeometricTool(activeToolConfig.type) && shapeStartPoint && previewShape) {
      const newStrokes = [...drawingStrokes, previewShape];
      onDrawingChange(newStrokes);
      setPreviewShape(null);
      setShapeStartPoint(null);
    }
    
    // Finalizar desenho livre
    if (currentStroke && currentStroke.points.length > 1) {
      const newStrokes = [...drawingStrokes, currentStroke];
      onDrawingChange(newStrokes);
    }
    
    setCurrentStroke(null);
    setIsDrawing(false);
  }, [isDrawing, currentStroke, previewShape, shapeStartPoint, activeToolConfig, drawingStrokes, onDrawingChange, isGeometricTool]);

  // ==========================================
  // ATALHOS DE TECLADO
  // ==========================================
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (drawingStrokes.length > 0) {
          onDrawingChange(drawingStrokes.slice(0, -1));
        }
      }

      // Ctrl+G - Toggle Grade
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        setShowGrid(!showGrid);
      }

      // Ctrl+Shift+G - Toggle Snap
      if (e.ctrlKey && e.shiftKey && e.key === 'g') {
        e.preventDefault();
        setSnapEnabled(!snapEnabled);
      }

      // Delete - Limpar tudo
      if (e.key === 'Delete') {
        e.preventDefault();
        onDrawingChange([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingStrokes, onDrawingChange, showGrid, snapEnabled]);

  // ==========================================
  // RENDER
  // ==========================================
  
  const shouldRender = isActive || drawingStrokes.length > 0;
  
  if (!shouldRender) return null;

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 ${className}`}
      style={{ 
        zIndex: 1000,
        // Quando inativo, não interceptar eventos - permitir passagem para o 3D
        pointerEvents: isActive ? 'auto' : 'none',
        touchAction: isActive ? 'none' : 'auto'
      }}
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${
          isActive 
            ? (activeToolConfig.type === 'select' 
              ? 'cursor-pointer' 
                : 'cursor-crosshair')
            : 'cursor-default'
        }`}
        onPointerDown={isActive ? startDrawing : undefined}
        onPointerMove={isActive ? draw : undefined}
        onPointerUp={isActive ? stopDrawing : undefined}
        onPointerLeave={isActive ? stopDrawing : undefined}
        style={{ 
          touchAction: isActive ? 'none' : 'auto',
          pointerEvents: isActive ? 'auto' : 'none'
        }}
      />
      
      {/* Indicadores */}
      {isDrawing && isActive && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm space-y-1">
          <div>Pressão: {Math.round(currentPressure * 100)}%</div>
          {showGrid && <div>Grade: {snapEnabled ? 'Snap ON' : 'Snap OFF'}</div>}
        </div>
      )}
      
      {/* Legenda de atalhos */}
      {isActive && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-xs space-y-1">
          <div><kbd>Ctrl+Z</kbd> {t('button.undo')}</div>
          <div><kbd>Ctrl+G</kbd> Grade</div>
          <div><kbd>Ctrl+Shift+G</kbd> Snap</div>
          <div><kbd>Delete</kbd> {t('button.clear')}</div>
        </div>
      )}
      
      {/* Input de texto estilo Excalidraw */}
      {textInputActive && textInputPosition && (
        <div 
          className="absolute bg-white border-2 border-blue-500 rounded-lg shadow-lg p-2"
          style={{
            left: textInputPosition.x,
            top: textInputPosition.y,
            zIndex: 1001
          }}
        >
          <textarea
            value={textInputValue}
            onChange={(e) => setTextInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addTextToCanvas(textInputValue);
              } else if (e.key === 'Escape') {
                setTextInputActive(false);
                setTextInputPosition(null);
                setTextInputValue('');
              }
            }}
            onBlur={() => {
              if (textInputValue.trim()) {
                addTextToCanvas(textInputValue);
              } else {
                setTextInputActive(false);
                setTextInputPosition(null);
                setTextInputValue('');
              }
            }}
            className="w-64 h-20 resize-none border-none outline-none text-black"
            placeholder="Digite seu texto..."
            autoFocus
          />
        </div>
      )}
    </div>
  );
}



