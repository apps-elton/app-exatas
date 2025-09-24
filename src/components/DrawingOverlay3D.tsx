import React, { useRef, useCallback, useEffect, useState } from 'react';
import { DrawingStroke, DrawingPoint, DrawingStyle, DrawingTool } from './DrawingTablet';

interface DrawingOverlay3DProps {
  isActive: boolean;
  drawingStrokes: DrawingStroke[];
  onDrawingChange: (strokes: DrawingStroke[]) => void;
  currentStyle?: DrawingStyle;
  currentTool?: DrawingTool;
  className?: string;
}

export default function DrawingOverlay3D({
  isActive,
  drawingStrokes,
  onDrawingChange,
  currentStyle,
  currentTool,
  className = ''
}: DrawingOverlay3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [currentPressure, setCurrentPressure] = useState(0);
  
  // Estados para seleção de área
  const [isAreaSelecting, setIsAreaSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{x: number, y: number} | null>(null);
  const [selectedStrokes, setSelectedStrokes] = useState<string[]>([]);

  // Configurações de desenho padrão (fallback)
  const defaultStyle = {
    color: '#ffffff',
    thickness: 13,
    opacity: 1,
    pressure: false, // Desativar variação de pressão
    smoothing: 0.5
  };

  const defaultTool = {
    type: 'pen' as const,
    name: 'Caneta',
    icon: null
  };

  // Usar configurações atuais ou padrão
  const activeStyle = currentStyle || defaultStyle;
  const activeTool = currentTool || defaultTool;

  // Redimensionar canvas para cobrir toda a área
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  }, []);

  useEffect(() => {
    if (isActive) {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [isActive, resizeCanvas]);

  // Redesenhar todos os traços
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawingStrokes.forEach(stroke => {
      drawStroke(ctx, stroke);
    });

    if (currentStroke) {
      drawStroke(ctx, currentStroke);
    }

    // Desenhar área de seleção se estiver selecionando
    if (isAreaSelecting && selectionStart && selectionEnd) {
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);
      
      ctx.save();
      ctx.strokeStyle = '#007AFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      
      ctx.fillStyle = 'rgba(0, 122, 255, 0.1)';
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      ctx.restore();
    }
  }, [drawingStrokes, currentStroke, isAreaSelecting, selectionStart, selectionEnd]);

  // Desenhar um traço específico
  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length < 2) return;

    ctx.save();
    
    // Configurar modo de composição baseado na ferramenta
    if (stroke.tool.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000000'; // Cor não importa para borracha
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.style.color;
    }
    
    ctx.lineWidth = stroke.style.thickness; // Sem variação de pressão
    ctx.globalAlpha = stroke.style.opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

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
    ctx.restore();
  }, []);

  // Iniciar desenho
  const startDrawing = useCallback((event: React.PointerEvent) => {
    if (!isActive) return;

    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const pressure = event.pressure || 0.5;

    setCurrentPressure(pressure);

    // Modo borracha seletiva - remover traços próximos APENAS se a ferramenta for borracha
    if (activeTool.type === 'eraser') {
      const threshold = 20; // pixels
      const newStrokes = drawingStrokes.filter(stroke => {
        return !stroke.points.some(point => {
          const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
          return distance < threshold;
        });
      });

      if (newStrokes.length !== drawingStrokes.length) {
        onDrawingChange(newStrokes);
        return;
      }
    }

    // Modo seleção de área
    if (activeTool.type === 'area-select') {
      setIsAreaSelecting(true);
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
      return;
    }

    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}-${Math.random()}`,
      tool: activeTool,
      style: { ...activeStyle },
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
  }, [isActive, drawingStrokes, onDrawingChange]);

  // Continuar desenho
  const draw = useCallback((event: React.PointerEvent) => {
    if (!isDrawing || !currentStroke || !canvasRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const pressure = event.pressure || 0.5;

    setCurrentPressure(pressure);

    // Se for borracha, apagar traços próximos continuamente
    if (activeTool.type === 'eraser') {
      const threshold = 20; // pixels
      const newStrokes = drawingStrokes.filter(stroke => {
        return !stroke.points.some(point => {
          const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
          return distance < threshold;
        });
      });

      if (newStrokes.length !== drawingStrokes.length) {
        onDrawingChange(newStrokes);
        return;
      }
    }

    // Se for seleção de área, atualizar a seleção
    if (activeTool.type === 'area-select' && isAreaSelecting) {
      setSelectionEnd({ x, y });
      return;
    }

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
    
    // Redesenhar canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      drawingStrokes.forEach(stroke => {
        drawStroke(ctx, stroke);
      });
      
      drawStroke(ctx, updatedStroke);
    }
  }, [isDrawing, currentStroke, drawingStrokes, drawStroke, activeTool, onDrawingChange]);

  // Parar desenho
  const stopDrawing = useCallback(() => {
    // Se for seleção de área, finalizar a seleção
    if (activeTool.type === 'area-select' && isAreaSelecting) {
      setIsAreaSelecting(false);
      
      // Encontrar traços dentro da área selecionada
      if (selectionStart && selectionEnd) {
        const minX = Math.min(selectionStart.x, selectionEnd.x);
        const maxX = Math.max(selectionStart.x, selectionEnd.x);
        const minY = Math.min(selectionStart.y, selectionEnd.y);
        const maxY = Math.max(selectionStart.y, selectionEnd.y);
        
        const strokesInArea = drawingStrokes.filter(stroke => {
          return stroke.points.some(point => 
            point.x >= minX && point.x <= maxX && 
            point.y >= minY && point.y <= maxY
          );
        });
        
        setSelectedStrokes(strokesInArea.map(s => s.id));
        console.log('Traços selecionados:', strokesInArea.length);
      }
      
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }

    if (!isDrawing || !currentStroke) return;

    const newStrokes = [...drawingStrokes, currentStroke];
    onDrawingChange(newStrokes);
    
    setCurrentStroke(null);
    setIsDrawing(false);
  }, [isDrawing, currentStroke, drawingStrokes, onDrawingChange, activeTool, isAreaSelecting, selectionStart, selectionEnd]);

  // Limpar canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onDrawingChange([]);
  }, [onDrawingChange]);

  // Redesenhar quando os traços mudarem
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Redesenhar quando os traços mudarem
  useEffect(() => {
    redrawCanvas();
  }, [drawingStrokes, redrawCanvas]);

  // Redesenhar quando o estilo atual mudar (para aplicar mudanças de cor/espessura imediatamente)
  useEffect(() => {
    if (isActive) {
      // Forçar redesenho imediato quando o estilo muda
      const timeoutId = setTimeout(() => {
        redrawCanvas();
      }, 10); // Pequeno delay para garantir que o estado foi atualizado
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeStyle, isActive, redrawCanvas]);

  // Só renderizar se estiver ativo ou se houver traços para permitir limpeza
  if (!isActive && drawingStrokes.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 ${isActive ? 'pointer-events-auto' : 'pointer-events-none'} ${className}`}
      style={{ 
        zIndex: isActive ? 1000 : -1,
        touchAction: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${isActive ? 'cursor-crosshair' : 'cursor-default'}`}
        onPointerDown={isActive ? startDrawing : undefined}
        onPointerMove={isActive ? draw : undefined}
        onPointerUp={isActive ? stopDrawing : undefined}
        onPointerLeave={isActive ? stopDrawing : undefined}
        style={{ 
          touchAction: 'none',
          pointerEvents: isActive ? 'auto' : 'none'
        }}
      />
      
      {/* Indicador de pressão */}
      {isDrawing && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
          Pressão: {Math.round(currentPressure * 100)}%
        </div>
      )}
    </div>
  );
}
