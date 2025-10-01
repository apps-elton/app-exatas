import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Canvas as FabricCanvas, PencilBrush } from 'fabric';
import { toast } from 'sonner';

function hexToRgba(hex: string, alpha: number) {
  const cleaned = hex.replace('#', '');
  const bigint = parseInt(cleaned.length === 3 ? cleaned.split('').map(c => c + c).join('') : cleaned, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


export interface DrawingOverlayRef {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  save: () => void;
  exportImage: () => void;
  getImageDataURL: () => string | null;
}

interface DrawingOverlayProps {
  isEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  className?: string;
}

const DrawingOverlay = forwardRef<DrawingOverlayRef, DrawingOverlayProps>(
  ({ isEnabled, strokeColor, strokeWidth, opacity, onHistoryChange, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<FabricCanvas | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    useEffect(() => {
      if (!canvasRef.current) return;

      // Get parent dimensions
      const parent = canvasRef.current.parentElement;
      if (!parent) return;

      const width = parent.clientWidth;
      const height = parent.clientHeight;

      const canvas = new FabricCanvas(canvasRef.current, {
        isDrawingMode: isEnabled,
        backgroundColor: 'transparent',
        width: width,
        height: height,
        selection: !isEnabled,
        defaultCursor: isEnabled ? 'crosshair' : 'default',
        hoverCursor: isEnabled ? 'crosshair' : 'move',
        moveCursor: isEnabled ? 'crosshair' : 'move',
        preserveObjectStacking: true,
        stateful: false
      });

      fabricCanvasRef.current = canvas;

      // Configure brush
      const brush = new PencilBrush(canvas);
      brush.color = hexToRgba(strokeColor, opacity);
      brush.width = strokeWidth;
      canvas.freeDrawingBrush = brush;

      // Save state after drawing
      const saveState = () => {
        const canvasState = JSON.stringify(canvas.toJSON());
        setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(canvasState);
          return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
      };

      canvas.on('path:created', saveState);
      canvas.on('object:added', saveState);
      canvas.on('object:removed', saveState);
      canvas.on('object:modified', saveState);

      // Initial state
      saveState();

      // Cleanup
      return () => {
        canvas.dispose();
      };
    }, []);

    // Update drawing mode
    useEffect(() => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.isDrawingMode = isEnabled;
        fabricCanvasRef.current.defaultCursor = isEnabled ? 'crosshair' : 'default';
        fabricCanvasRef.current.hoverCursor = isEnabled ? 'crosshair' : 'move';
        fabricCanvasRef.current.moveCursor = isEnabled ? 'crosshair' : 'move';
        fabricCanvasRef.current.selection = !isEnabled;
      }
    }, [isEnabled]);

    // Update brush properties
    useEffect(() => {
      if (fabricCanvasRef.current) {
        const brush = new PencilBrush(fabricCanvasRef.current);
        brush.color = hexToRgba(strokeColor, opacity);
        brush.width = strokeWidth;
        fabricCanvasRef.current.freeDrawingBrush = brush;
      }
    }, [strokeColor, strokeWidth, opacity]);

    // Update history change callback
    useEffect(() => {
      const canUndo = historyIndex > 0;
      const canRedo = historyIndex < history.length - 1;
      onHistoryChange?.(canUndo, canRedo);
    }, [historyIndex, history.length, onHistoryChange]);

    // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        if (fabricCanvasRef.current && canvasRef.current) {
          const parent = canvasRef.current.parentElement;
          if (parent) {
            const width = parent.clientWidth;
            const height = parent.clientHeight;
            fabricCanvasRef.current.setDimensions({
              width: width,
              height: height
            });
            fabricCanvasRef.current.renderAll();
          }
        }
      };

      // Use ResizeObserver for better performance
      const resizeObserver = new ResizeObserver(handleResize);
      if (canvasRef.current?.parentElement) {
        resizeObserver.observe(canvasRef.current.parentElement);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    useImperativeHandle(ref, () => ({
      clear: () => {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.clear();
          fabricCanvasRef.current.backgroundColor = 'transparent';
          fabricCanvasRef.current.renderAll();
          setHistory(['']);
          setHistoryIndex(0);
          toast.success('Desenho limpo!');
        }
      },
      undo: () => {
        if (historyIndex > 0 && fabricCanvasRef.current) {
          const prevState = history[historyIndex - 1];
          fabricCanvasRef.current.loadFromJSON(prevState, () => {
            fabricCanvasRef.current?.renderAll();
          });
          setHistoryIndex(prev => prev - 1);
        }
      },
      redo: () => {
        if (historyIndex < history.length - 1 && fabricCanvasRef.current) {
          const nextState = history[historyIndex + 1];
          fabricCanvasRef.current.loadFromJSON(nextState, () => {
            fabricCanvasRef.current?.renderAll();
          });
          setHistoryIndex(prev => prev + 1);
        }
      },
      save: () => {
        if (fabricCanvasRef.current) {
          const dataURL = fabricCanvasRef.current.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2
          });
          const link = document.createElement('a');
          link.download = `desenho-anotado-${Date.now()}.png`;
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Desenho salvo com sucesso!');
        }
      },
      exportImage: () => {
        if (fabricCanvasRef.current) {
          const dataURL = fabricCanvasRef.current.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2
          });
          const link = document.createElement('a');
          link.download = `geometria-anotada-${Date.now()}.png`;
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Imagem exportada com sucesso!');
        }
      },
      getImageDataURL: () => {
        if (!fabricCanvasRef.current) return null;
        return fabricCanvasRef.current.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 1
        });
      }
    }));

    return (
      <div 
        className={`absolute inset-0 ${className || ''}`} 
        style={{ 
          pointerEvents: isEnabled ? 'auto' : 'none',
          zIndex: isEnabled ? 1000 : 0,
          width: '100%',
          height: '100%'
        }}
        onMouseDown={(e) => {
          if (isEnabled) {
            e.stopPropagation();
          }
        }}
        onMouseMove={(e) => {
          if (isEnabled) {
            e.stopPropagation();
          }
        }}
        onMouseUp={(e) => {
          if (isEnabled) {
            e.stopPropagation();
          }
        }}
        onWheel={(e) => {
          if (isEnabled) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
        onTouchStart={(e) => {
          if (isEnabled) {
            e.stopPropagation();
          }
        }}
        onTouchMove={(e) => {
          if (isEnabled) {
            e.stopPropagation();
          }
        }}
        onTouchEnd={(e) => {
          if (isEnabled) {
            e.stopPropagation();
          }
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ 
            cursor: isEnabled ? 'crosshair' : 'default',
            pointerEvents: isEnabled ? 'auto' : 'none',
            width: '100%',
            height: '100%',
            display: 'block',
            touchAction: isEnabled ? 'none' : 'auto'
          }}
        />
      </div>
    );
  }
);

DrawingOverlay.displayName = 'DrawingOverlay';

export default DrawingOverlay;