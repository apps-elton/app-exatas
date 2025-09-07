import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, FabricText, PencilBrush, FabricObject } from 'fabric';
import { toast } from 'sonner';

export interface FabricDrawingCanvasRef {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  save: () => string;
  exportImage: () => void;
  addEquation: (latex: string, rendered: string) => void;
  setTool: (tool: 'select' | 'pen' | 'eraser' | 'text') => void;
  setBrushSettings: (settings: { color: string; width: number; opacity: number }) => void;
}

interface FabricDrawingCanvasProps {
  isEnabled: boolean;
  tool: 'select' | 'pen' | 'eraser' | 'text';
  strokeColor: string;
  strokeWidth: number;
  opacity?: number;
  className?: string;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

export const FabricDrawingCanvas = forwardRef<FabricDrawingCanvasRef, FabricDrawingCanvasProps>(
  ({ isEnabled, tool, strokeColor, strokeWidth, opacity = 1, className, onHistoryChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<FabricCanvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isDrawing, setIsDrawing] = useState(false);

    // Initialize Fabric canvas
    useEffect(() => {
      if (!canvasRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const canvas = new FabricCanvas(canvasRef.current, {
        isDrawingMode: tool === 'pen' || tool === 'eraser',
        selection: tool === 'select',
        backgroundColor: 'transparent',
        preserveObjectStacking: true,
      });

      // Configure brushes
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = strokeColor;
      canvas.freeDrawingBrush.width = strokeWidth;

      fabricCanvasRef.current = canvas;

      // Resize function
      const resizeCanvas = () => {
        const rect = container.getBoundingClientRect();
        canvas.setDimensions({
          width: rect.width,
          height: rect.height
        });
        canvas.renderAll();
      };

      resizeCanvas();
      
      const resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(container);

      // Save initial state
      saveState();

      // Event listeners
      canvas.on('path:created', () => {
        saveState();
      });

      canvas.on('object:added', () => {
        if (!isDrawing) {
          saveState();
        }
      });

      canvas.on('object:removed', () => {
        saveState();
      });

      canvas.on('object:modified', () => {
        saveState();
      });

      return () => {
        resizeObserver.disconnect();
        canvas.dispose();
      };
    }, []);

    // Update canvas settings when props change
    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      // Update drawing mode and selection
      canvas.isDrawingMode = isEnabled && (tool === 'pen' || tool === 'eraser');
      canvas.selection = isEnabled && tool === 'select';
      
      // Update cursor
      if (isEnabled) {
        switch (tool) {
          case 'select':
            canvas.defaultCursor = 'default';
            canvas.hoverCursor = 'move';
            break;
          case 'pen':
            canvas.defaultCursor = 'crosshair';
            break;
          case 'eraser':
            canvas.defaultCursor = 'crosshair';
            break;
          case 'text':
            canvas.defaultCursor = 'text';
            break;
        }
      } else {
        canvas.defaultCursor = 'not-allowed';
      }

      // Configure brushes
      if (tool === 'eraser') {
        // For eraser, we'll handle it differently - disable drawing mode and handle click events
        canvas.isDrawingMode = false;
        canvas.selection = true;
      } else if (tool === 'pen') {
        // Regular pen brush
        const pencilBrush = new PencilBrush(canvas);
        pencilBrush.color = strokeColor;
        pencilBrush.width = strokeWidth;
        canvas.freeDrawingBrush = pencilBrush;
      }

      canvas.renderAll();
    }, [isEnabled, tool, strokeColor, strokeWidth, opacity]);

    // Save state for undo/redo
    const saveState = useCallback(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const state = JSON.stringify(canvas.toJSON());
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(state);
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
      
      // Update history buttons
      onHistoryChange?.(true, false);
    }, [historyIndex, onHistoryChange]);

    // Handle eraser tool clicks
    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || tool !== 'eraser' || !isEnabled) return;

      const handleEraserClick = (e: any) => {
        if (tool !== 'eraser') return;
        
        const target = e.target;
        if (target && target !== canvas) {
          canvas.remove(target);
          canvas.renderAll();
          toast.success('Elemento apagado!');
        }
      };

      canvas.on('mouse:down', handleEraserClick);
      
      return () => {
        canvas.off('mouse:down', handleEraserClick);
      };
    }, [tool, isEnabled]);

    // Handle text tool clicks
    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || tool !== 'text' || !isEnabled) return;

      const handleCanvasClick = (e: any) => {
        if (tool !== 'text') return;
        
        const pointer = canvas.getPointer(e.e);
        const text = new FabricText('Texto', {
          left: pointer.x,
          top: pointer.y,
          fill: strokeColor,
          fontSize: strokeWidth * 4, // Scale font size based on stroke width
          fontFamily: 'Arial',
          selectable: true,
          editable: true,
        });
        
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
      };

      canvas.on('mouse:down', handleCanvasClick);
      
      return () => {
        canvas.off('mouse:down', handleCanvasClick);
      };
    }, [tool, isEnabled, strokeColor, strokeWidth]);

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isEnabled) return;

        // Delete selected objects
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const canvas = fabricCanvasRef.current;
          if (canvas) {
            const activeObjects = canvas.getActiveObjects();
            if (activeObjects.length > 0) {
              activeObjects.forEach(obj => canvas.remove(obj));
              canvas.discardActiveObject();
              canvas.renderAll();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEnabled]);

    // Imperative methods
    const clear = useCallback(() => {
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        canvas.clear();
        canvas.backgroundColor = 'transparent';
        canvas.renderAll();
        saveState();
        toast.success('Canvas limpo!');
      }
    }, [saveState]);

    const undo = useCallback(() => {
      if (historyIndex <= 0) return;
      
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        const previousState = history[historyIndex - 1];
        setIsDrawing(true);
        
        // Temporarily enable canvas interaction for undo
        const wasDisabled = !isEnabled;
        if (wasDisabled) {
          canvas.upperCanvasEl.style.pointerEvents = 'auto';
        }
        
        canvas.loadFromJSON(previousState, () => {
          canvas.renderAll();
          setIsDrawing(false);
          
          // Restore original interaction state
          if (wasDisabled) {
            canvas.upperCanvasEl.style.pointerEvents = 'none';
          }
        });
        setHistoryIndex(prev => prev - 1);
        onHistoryChange?.(historyIndex > 1, true);
      }
    }, [history, historyIndex, onHistoryChange, isEnabled]);

    const redo = useCallback(() => {
      if (historyIndex >= history.length - 1) return;
      
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        const nextState = history[historyIndex + 1];
        setIsDrawing(true);
        
        // Temporarily enable canvas interaction for redo
        const wasDisabled = !isEnabled;
        if (wasDisabled) {
          canvas.upperCanvasEl.style.pointerEvents = 'auto';
        }
        
        canvas.loadFromJSON(nextState, () => {
          canvas.renderAll();
          setIsDrawing(false);
          
          // Restore original interaction state
          if (wasDisabled) {
            canvas.upperCanvasEl.style.pointerEvents = 'none';
          }
        });
        setHistoryIndex(prev => prev + 1);
        onHistoryChange?.(true, historyIndex < history.length - 2);
      }
    }, [history, historyIndex, onHistoryChange, isEnabled]);

    const save = useCallback(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return '';
      
      return canvas.toDataURL({ 
        format: 'png',
        multiplier: 1
      });
    }, []);

    const exportImage = useCallback(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      
      // Create temporary canvas with white background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width || 800;
      tempCanvas.height = canvas.height || 600;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // White background
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw canvas content
        const dataURL = canvas.toDataURL({ 
          format: 'png',
          multiplier: 1
        });
        const img = new Image();
        img.onload = () => {
          tempCtx.drawImage(img, 0, 0);
          
          // Download
          const link = document.createElement('a');
          link.download = `drawing_${Date.now()}.png`;
          link.href = tempCanvas.toDataURL();
          link.click();
          toast.success('Desenho exportado!');
        };
        img.src = dataURL;
      }
    }, []);

    const addEquation = useCallback((latex: string, rendered: string) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const text = new FabricText(rendered, {
        left: 100,
        top: 100,
        fill: strokeColor,
        fontSize: 20,
        fontFamily: 'Times New Roman, serif',
        selectable: true,
        editable: false,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 5,
      });
      
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      toast.success('Equação adicionada!');
    }, [strokeColor]);

    const setTool = useCallback((newTool: 'select' | 'pen' | 'eraser' | 'text') => {
      // This will be handled by the parent component
    }, []);

    const setBrushSettings = useCallback((settings: { color: string; width: number; opacity: number }) => {
      const canvas = fabricCanvasRef.current;
      if (canvas && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = settings.color;
        canvas.freeDrawingBrush.width = settings.width;
      }
    }, []);

    useImperativeHandle(ref, () => ({
      clear,
      undo,
      redo,
      save,
      exportImage,
      addEquation,
      setTool,
      setBrushSettings
    }), [clear, undo, redo, save, exportImage, addEquation, setTool, setBrushSettings]);

    return (
      <div 
        ref={containerRef} 
        className={`absolute inset-0 ${className || ''}`}
        style={{ 
          pointerEvents: isEnabled ? 'auto' : 'none',
          cursor: isEnabled ? 'default' : 'not-allowed',
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ 
            pointerEvents: isEnabled ? 'auto' : 'none',
          }}
        />
      </div>
    );
  }
);

FabricDrawingCanvas.displayName = 'FabricDrawingCanvas';