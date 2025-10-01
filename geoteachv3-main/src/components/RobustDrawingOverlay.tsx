import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

interface DrawPath {
  id: number;
  points: Point[];
  settings: PenSettings;
  tool: string;
  timestamp: number;
}

interface PenSettings {
  color: string;
  thickness: number;
  opacity: number;
  smoothing: number;
  capStyle: CanvasLineCap;
  joinStyle: CanvasLineJoin;
}

interface RobustDrawingOverlayProps {
  isEnabled: boolean;
  tool: 'pen' | 'eraser';
  strokeColor: string;
  strokeWidth: number;
  opacity?: number;
  className?: string;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

export interface RobustDrawingOverlayRef {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  save: () => string;
  exportImage: () => void;
}

export const RobustDrawingOverlay = forwardRef<RobustDrawingOverlayRef, RobustDrawingOverlayProps>(
  ({ isEnabled, tool, strokeColor, strokeWidth, opacity = 1, className, onHistoryChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<Point[]>([]);
    const [paths, setPaths] = useState<DrawPath[]>([]);
    const [undoStack, setUndoStack] = useState<DrawPath[][]>([]);
    const [redoStack, setRedoStack] = useState<DrawPath[][]>([]);
    
    // Configurações da caneta
    const [penSettings] = useState<PenSettings>({
      color: strokeColor,
      thickness: strokeWidth,
      opacity: opacity,
      smoothing: 0.3,
      capStyle: 'round',
      joinStyle: 'round'
    });

    // Performance optimization
    const lastPoint = useRef<Point | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const pendingPoints = useRef<Point[]>([]);

    // Atualizar configurações quando props mudam
    useEffect(() => {
      penSettings.color = strokeColor;
      penSettings.thickness = strokeWidth;
      penSettings.opacity = opacity;
    }, [strokeColor, strokeWidth, opacity, penSettings]);

    // Atualizar cursor baseado na ferramenta
    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor = isEnabled ? (tool === 'eraser' ? 'crosshair' : 'crosshair') : 'default';
      }
    }, [isEnabled, tool]);

    // Inicializar canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !containerRef.current) return;

      const container = containerRef.current;
      const resizeCanvas = () => {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineCap = penSettings.capStyle;
          ctx.lineJoin = penSettings.joinStyle;
          ctx.imageSmoothingEnabled = true;
          redrawCanvas();
        }
      };

      resizeCanvas();
      
      const resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
      };
    }, [penSettings.capStyle, penSettings.joinStyle]);

    // Função para obter coordenadas precisas
    const getCanvasCoordinates = useCallback((event: MouseEvent | TouchEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, pressure: 1, timestamp: Date.now() };
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      let clientX: number, clientY: number, pressure = 1;
      
      if (event.type.includes('touch')) {
        const touchEvent = event as TouchEvent;
        const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
        pressure = (touch as any).force || 1;
      } else {
        const mouseEvent = event as MouseEvent;
        clientX = mouseEvent.clientX;
        clientY = mouseEvent.clientY;
        pressure = (mouseEvent as any).pressure || 1;
      }
      
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
        pressure: pressure,
        timestamp: Date.now()
      };
    }, []);

    // Suavização de pontos
    const smoothPoint = useCallback((point: Point, lastPoint: Point, smoothing: number): Point => {
      if (!lastPoint) return point;
      
      return {
        x: lastPoint.x + (point.x - lastPoint.x) * (1 - smoothing),
        y: lastPoint.y + (point.y - lastPoint.y) * (1 - smoothing),
        pressure: lastPoint.pressure + (point.pressure - lastPoint.pressure) * (1 - smoothing),
        timestamp: point.timestamp
      };
    }, []);

    // Desenhar linha otimizada
    const drawLine = useCallback((ctx: CanvasRenderingContext2D, from: Point, to: Point, settings: PenSettings, isEraser = false) => {
      const distance = Math.sqrt(
        Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
      );
      
      if (distance < 1) return; // Evitar pontos muito próximos
      
      // Ajustar espessura baseada na pressão
      const thickness = settings.thickness * to.pressure;
      
      if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 1;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = settings.opacity;
        ctx.strokeStyle = settings.color;
      }
      
      ctx.lineWidth = thickness;
      
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
    }, []);

    // Redesenhar todo o canvas
    const redrawCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Desenhar todos os caminhos salvos
      paths.forEach(path => {
        if (path.points.length < 2) return;
        
        ctx.lineCap = path.settings.capStyle;
        ctx.lineJoin = path.settings.joinStyle;
        
        for (let i = 1; i < path.points.length; i++) {
          drawLine(ctx, path.points[i - 1], path.points[i], path.settings, path.tool === 'eraser');
        }
      });
      
      // Desenhar caminho atual
      if (currentPath.length > 1) {
        ctx.lineCap = penSettings.capStyle;
        ctx.lineJoin = penSettings.joinStyle;
        
        for (let i = 1; i < currentPath.length; i++) {
          drawLine(ctx, currentPath[i - 1], currentPath[i], penSettings, tool === 'eraser');
        }
      }
    }, [paths, currentPath, penSettings, drawLine]);

    // Processamento otimizado de pontos
    const processDrawing = useCallback(() => {
      if (pendingPoints.current.length === 0) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const points = [...pendingPoints.current];
      pendingPoints.current = [];
      
      points.forEach(point => {
        const smoothedPoint = penSettings.smoothing > 0 && lastPoint.current
          ? smoothPoint(point, lastPoint.current, penSettings.smoothing)
          : point;
        
        if (lastPoint.current) {
          drawLine(ctx, lastPoint.current, smoothedPoint, penSettings, tool === 'eraser');
        }
        
        setCurrentPath(prev => [...prev, smoothedPoint]);
        lastPoint.current = smoothedPoint;
      });
      
      animationFrameId.current = null;
    }, [penSettings, smoothPoint, drawLine]);

    // Iniciar desenho
    const startDrawing = useCallback((event: MouseEvent | TouchEvent) => {
      if (!isEnabled) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      const point = getCanvasCoordinates(event);
      
      setIsDrawing(true);
      setCurrentPath([point]);
      lastPoint.current = point;
      
      // Salvar estado para undo
      setUndoStack(prev => [...prev, [...paths]]);
      setRedoStack([]);
    }, [isEnabled, getCanvasCoordinates, paths]);

    // Continuar desenho
    const continueDrawing = useCallback((event: MouseEvent | TouchEvent) => {
      if (!isDrawing || !isEnabled) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      const point = getCanvasCoordinates(event);
      pendingPoints.current.push(point);
      
      // Otimização: usar requestAnimationFrame para batch processing
      if (!animationFrameId.current) {
        animationFrameId.current = requestAnimationFrame(processDrawing);
      }
    }, [isDrawing, isEnabled, getCanvasCoordinates, processDrawing]);

    // Finalizar desenho
    const stopDrawing = useCallback((event: MouseEvent | TouchEvent) => {
      if (!isDrawing || !isEnabled) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      setIsDrawing(false);
      
      // Processar pontos pendentes
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        processDrawing();
      }
      
      // Salvar caminho
      if (currentPath.length > 0) {
        const newPath: DrawPath = {
          id: Date.now(),
          points: [...currentPath],
          settings: { ...penSettings },
          tool: tool,
          timestamp: Date.now()
        };
        
        setPaths(prev => [...prev, newPath]);
        onHistoryChange?.(true, redoStack.length > 0);
      }
      
      setCurrentPath([]);
      lastPoint.current = null;
    }, [isDrawing, isEnabled, currentPath, penSettings, processDrawing, onHistoryChange, redoStack.length]);

    // Event listeners
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Mouse events
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', continueDrawing);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);

      // Touch events
      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', continueDrawing, { passive: false });
      canvas.addEventListener('touchend', stopDrawing, { passive: false });

      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', continueDrawing);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseleave', stopDrawing);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', continueDrawing);
        canvas.removeEventListener('touchend', stopDrawing);
        
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
      };
    }, [startDrawing, continueDrawing, stopDrawing]);

    // Redraw when paths change
    useEffect(() => {
      redrawCanvas();
    }, [redrawCanvas]);

    // Funções imperative
    const clear = useCallback(() => {
      setUndoStack(prev => [...prev, [...paths]]);
      setPaths([]);
      setCurrentPath([]);
      setRedoStack([]);
      onHistoryChange?.(true, false);
      
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, [paths, onHistoryChange]);

    const undo = useCallback(() => {
      if (undoStack.length === 0) return;
      
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [paths, ...prev]);
      setPaths(previousState);
      setUndoStack(prev => prev.slice(0, -1));
      onHistoryChange?.(undoStack.length > 1, true);
    }, [undoStack, paths, onHistoryChange]);

    const redo = useCallback(() => {
      if (redoStack.length === 0) return;
      
      const nextState = redoStack[0];
      setUndoStack(prev => [...prev, paths]);
      setPaths(nextState);
      setRedoStack(prev => prev.slice(1));
      onHistoryChange?.(true, redoStack.length > 1);
    }, [redoStack, paths, onHistoryChange]);

    const save = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return '';
      
      return canvas.toDataURL('image/png');
    }, []);

    const exportImage = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Criar canvas temporário com fundo branco
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Fundo branco
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Desenhar conteúdo
        tempCtx.drawImage(canvas, 0, 0);
        
        // Download
        const link = document.createElement('a');
        link.download = `drawing_${Date.now()}.png`;
        link.href = tempCanvas.toDataURL();
        link.click();
      }
    }, []);

    useImperativeHandle(ref, () => ({
      clear,
      undo,
      redo,
      save,
      exportImage
    }), [clear, undo, redo, save, exportImage]);

    return (
      <div 
        ref={containerRef} 
        className={`absolute inset-0 ${className || ''}`}
        style={{ 
          pointerEvents: isEnabled ? 'auto' : 'none',
          cursor: isEnabled ? 'crosshair' : 'default',
          touchAction: 'none'
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ 
            pointerEvents: isEnabled ? 'auto' : 'none',
            touchAction: 'none'
          }}
        />
      </div>
    );
  }
);

RobustDrawingOverlay.displayName = 'RobustDrawingOverlay';