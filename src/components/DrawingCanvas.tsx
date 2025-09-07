import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, Textbox, Line, PencilBrush } from 'fabric';
import { DrawingOptions } from '@/types/drawing';
import { toast } from 'sonner';

interface DrawingCanvasProps {
  options: DrawingOptions;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  className?: string;
}

export interface DrawingCanvasRef {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  save: () => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({ 
  options, 
  onHistoryChange, 
  className 
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: Math.max(window.innerWidth - 350, 800), // Maximizar largura
      height: Math.max(window.innerHeight - 180, 600), // Maximizar altura
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
      selection: options.tool === 'select',
      preserveObjectStacking: true
    });

    // Configure drawing brush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = options.color;
    canvas.freeDrawingBrush.width = options.strokeWidth;

    // Save initial state
    const initialState = canvas.toJSON();
    setHistory([JSON.stringify(initialState)]);
    setHistoryIndex(0);

    // Listen to canvas changes for history
    const saveState = () => {
      const currentState = JSON.stringify(canvas.toJSON());
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(currentState);
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
    };

    canvas.on('path:created', saveState);
    canvas.on('object:added', saveState);
    canvas.on('object:removed', saveState);
    canvas.on('object:modified', saveState);

    setFabricCanvas(canvas);

    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: Math.max(window.innerWidth - 350, 800),
        height: Math.max(window.innerHeight - 180, 600)
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  // Update history change callback
  useEffect(() => {
    onHistoryChange(historyIndex > 0, historyIndex < history.length - 1);
  }, [historyIndex, history.length, onHistoryChange]);

  // Handle tool changes
  useEffect(() => {
    if (!fabricCanvas) return;

    // Reset selection
    fabricCanvas.selection = options.tool === 'select';
    fabricCanvas.discardActiveObject();

    switch (options.tool) {
      case 'select':
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.defaultCursor = 'default';
        break;

      case 'pen':
        fabricCanvas.isDrawingMode = true;
        fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
        fabricCanvas.freeDrawingBrush.color = options.color;
        fabricCanvas.freeDrawingBrush.width = options.strokeWidth;
        break;

      case 'highlighter':
        fabricCanvas.isDrawingMode = true;
        const highlighterBrush = new PencilBrush(fabricCanvas);
        highlighterBrush.color = options.color;
        highlighterBrush.width = Math.max(options.strokeWidth, 10);
        fabricCanvas.freeDrawingBrush = highlighterBrush;
        break;

      case 'eraser':
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.defaultCursor = 'crosshair';
        // Enable eraser mode by allowing object selection and deletion
        fabricCanvas.selection = true;
        break;

      default:
        fabricCanvas.isDrawingMode = false;
        break;
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, options.tool, options.color, options.strokeWidth]);

  // Handle shape creation
  const createShape = useCallback((shapeType: string, x: number = 100, y: number = 100) => {
    if (!fabricCanvas) return;

    let shape;
    switch (shapeType) {
      case 'rectangle':
        shape = new Rect({
          left: x,
          top: y,
          fill: 'transparent',
          stroke: options.color,
          strokeWidth: options.strokeWidth,
          width: 100,
          height: 60,
          opacity: options.opacity
        });
        break;

      case 'circle':
        shape = new Circle({
          left: x,
          top: y,
          fill: 'transparent',
          stroke: options.color,
          strokeWidth: options.strokeWidth,
          radius: 50,
          opacity: options.opacity
        });
        break;

      case 'line':
        shape = new Line([x, y, x + 100, y], {
          stroke: options.color,
          strokeWidth: options.strokeWidth,
          opacity: options.opacity
        });
        break;

      case 'text':
        shape = new Textbox('Digite aqui...', {
          left: x,
          top: y,
          fill: options.color,
          fontSize: Math.max(options.strokeWidth * 3, 16),
          opacity: options.opacity
        });
        break;
    }

    if (shape) {
      fabricCanvas.add(shape);
      fabricCanvas.setActiveObject(shape);
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas, options]);

  // Handle clicks for shape tools and eraser
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleCanvasClick = (e: any) => {
      if (options.tool === 'eraser' && e.target) {
        // Remove clicked object when in eraser mode
        fabricCanvas.remove(e.target);
        fabricCanvas.renderAll();
        return;
      }

      if (!e.target && ['rectangle', 'circle', 'line', 'text'].includes(options.tool)) {
        const pointer = fabricCanvas.getPointer(e.e);
        createShape(options.tool, pointer.x, pointer.y);
      }
    };

    fabricCanvas.on('mouse:down', handleCanvasClick);

    return () => {
      fabricCanvas.off('mouse:down', handleCanvasClick);
    };
  }, [fabricCanvas, options.tool, createShape]);

  // Undo function
  const undo = useCallback(() => {
    if (!fabricCanvas || historyIndex <= 0) return;

    const prevIndex = historyIndex - 1;
    const prevState = JSON.parse(history[prevIndex]);
    
    fabricCanvas.loadFromJSON(prevState).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(prevIndex);
    });
  }, [fabricCanvas, history, historyIndex]);

  // Redo function
  const redo = useCallback(() => {
    if (!fabricCanvas || historyIndex >= history.length - 1) return;

    const nextIndex = historyIndex + 1;
    const nextState = JSON.parse(history[nextIndex]);
    
    fabricCanvas.loadFromJSON(nextState).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(nextIndex);
    });
  }, [fabricCanvas, history, historyIndex]);

  // Clear function
  const clear = useCallback(() => {
    if (!fabricCanvas) return;
    
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = 'rgba(0, 0, 0, 0.02)';
    fabricCanvas.renderAll();
    
    const clearedState = JSON.stringify(fabricCanvas.toJSON());
    setHistory([clearedState]);
    setHistoryIndex(0);
    
    toast.success('Quadro limpo!');
  }, [fabricCanvas]);

  // Save function
  const save = useCallback(() => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1
    });

    const link = document.createElement('a');
    link.download = `anotacoes-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataURL;
    link.click();

    toast.success('Anotações salvas!');
  }, [fabricCanvas]);

  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    undo,
    redo,
    clear,
    save
  }), [undo, redo, clear, save]);

  return (
    <div className={className}>
      <canvas 
        ref={canvasRef} 
        className="border border-border/30 rounded-lg bg-transparent"
        style={{ touchAction: 'none' }} // Important for tablet/stylus support
      />
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;