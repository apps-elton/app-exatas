// ==========================================
// hooks/useDrawingCanvas.ts - Lógica de estado
// ==========================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { RefObject } from 'react';
import { Stroke, Point, ToolType } from '../types/drawing';
import { PERFORMANCE, PRESSURE } from '../constants/drawing';
import { DrawingRenderer } from '../rendering/DrawingRenderer';
import { normalizePressure, shouldAddPoint } from '../utils/geometry';

interface UseDrawingCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  isActive: boolean;
  currentTool: ToolType;
  currentColor: string;
  currentThickness: number;
  smoothingFactor: number;
}

export const useDrawingCanvas = ({
  canvasRef,
  isActive,
  currentTool,
  currentColor,
  currentThickness,
  smoothingFactor
}: UseDrawingCanvasProps) => {
  
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const rendererRef = useRef<DrawingRenderer | null>(null);
  const lastFrameTimeRef = useRef(0);
  const rafIdRef = useRef<number>();
  
  // Inicializar renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true // Performance hint
    });
    
    if (ctx) {
      rendererRef.current = new DrawingRenderer(ctx);
    }
  }, [canvasRef]);
  
  // Throttled render
  const scheduleRender = useCallback(() => {
    if (rafIdRef.current) return;
    
    rafIdRef.current = requestAnimationFrame((timestamp) => {
      rafIdRef.current = undefined;
      
      if (timestamp - lastFrameTimeRef.current < PERFORMANCE.FRAME_TIME) {
        return;
      }
      
      lastFrameTimeRef.current = timestamp;
      
      const renderer = rendererRef.current;
      if (!renderer) return;
      
      renderer.clear();
      strokes.forEach(stroke => renderer.renderStroke(stroke, smoothingFactor));
      
      if (currentStroke) {
        renderer.renderStroke(currentStroke, smoothingFactor);
      }
    });
  }, [strokes, currentStroke, smoothingFactor]);
  
  // Event handlers
  const getPoint = useCallback((e: PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: PRESSURE.DEFAULT, timestamp: Date.now() };
    
    const rect = canvas.getBoundingClientRect();
    const rawPressure = e.pressure || (e.pointerType === 'pen' ? 0.7 : PRESSURE.DEFAULT);
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: normalizePressure(rawPressure),
      timestamp: Date.now()
    };
  }, [canvasRef]);
  
  const startDrawing = useCallback((e: PointerEvent) => {
    if (!isActive) return;
    
    const point = getPoint(e);
    
    const newStroke: Stroke = {
      id: `${Date.now()}-${Math.random()}`,
      tool: currentTool,
      points: [point],
      color: currentColor,
      baseThickness: currentThickness
    };
    
    setCurrentStroke(newStroke);
    setIsDrawing(true);
    scheduleRender();
  }, [isActive, currentTool, currentColor, currentThickness, getPoint, scheduleRender]);
  
  const continueDrawing = useCallback((e: PointerEvent) => {
    if (!isDrawing || !currentStroke) return;
    
    const point = getPoint(e);
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    
    if (!shouldAddPoint(lastPoint, point)) return;
    
    if (currentStroke.points.length >= PERFORMANCE.MAX_POINTS_PER_STROKE) {
      // Auto-finish stroke para prevenir memory leak
      finishDrawing();
      return;
    }
    
    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, point]
    });
    
    scheduleRender();
  }, [isDrawing, currentStroke, getPoint, scheduleRender]);
  
  const finishDrawing = useCallback(() => {
    if (!currentStroke || currentStroke.points.length < 2) {
      setCurrentStroke(null);
      setIsDrawing(false);
      return;
    }
    
    setStrokes(prev => [...prev, currentStroke]);
    setCurrentStroke(null);
    setIsDrawing(false);
    scheduleRender();
  }, [currentStroke, scheduleRender]);
  
  const undo = useCallback(() => {
    setStrokes(prev => prev.slice(0, -1));
    scheduleRender();
  }, [scheduleRender]);
  
  const clear = useCallback(() => {
    setStrokes([]);
    setCurrentStroke(null);
    scheduleRender();
  }, [scheduleRender]);
  
  return {
    strokes,
    startDrawing,
    continueDrawing,
    finishDrawing,
    undo,
    clear,
    canUndo: strokes.length > 0
  };
};

