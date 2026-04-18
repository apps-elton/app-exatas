import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, FabricText, PencilBrush } from 'fabric';
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
  /**
   * Optional initial canvas JSON to restore strokes on mount. Useful when the
   * component is conditionally rendered or when a parent wants to persist
   * strokes across unrelated UI changes (e.g. switching the 3D solid).
   */
  initialCanvasJSON?: string | null;
  /**
   * Fires whenever the canvas content changes (path created, object added,
   * modified or removed). Parents can store the JSON to persist strokes.
   */
  onCanvasChange?: (json: string) => void;
}

export const FabricDrawingCanvas = forwardRef<FabricDrawingCanvasRef, FabricDrawingCanvasProps>(
  ({ isEnabled, tool, strokeColor, strokeWidth, opacity = 1, className, onHistoryChange, initialCanvasJSON, onCanvasChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<FabricCanvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Store history in refs so the Fabric event handlers (registered once)
    // always see fresh values and don't corrupt the history due to stale
    // closures. `historyIndexRef` tracks the pointer into `historyRef`.
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef<number>(-1);
    // True while we are programmatically mutating the canvas (undo/redo/load)
    // so the `object:added`/`object:removed` handlers don't record intermediate
    // states as new history entries.
    const isRestoringRef = useRef<boolean>(false);

    const onHistoryChangeRef = useRef(onHistoryChange);
    const onCanvasChangeRef = useRef(onCanvasChange);
    useEffect(() => {
      onHistoryChangeRef.current = onHistoryChange;
    }, [onHistoryChange]);
    useEffect(() => {
      onCanvasChangeRef.current = onCanvasChange;
    }, [onCanvasChange]);

    // Keep the most recent initialCanvasJSON in a ref so the one-shot init
    // effect doesn't need it as a dependency. Loading is explicitly performed
    // once on mount from this ref.
    const initialCanvasJSONRef = useRef(initialCanvasJSON);

    const notifyHistory = useCallback(() => {
      const canUndo = historyIndexRef.current > 0;
      const canRedo = historyIndexRef.current < historyRef.current.length - 1;
      onHistoryChangeRef.current?.(canUndo, canRedo);
    }, []);

    const saveState = useCallback(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const state = JSON.stringify(canvas.toJSON());

      // Drop any redo tail and append the new state.
      const truncated = historyRef.current.slice(0, historyIndexRef.current + 1);
      truncated.push(state);
      historyRef.current = truncated;
      historyIndexRef.current = truncated.length - 1;

      notifyHistory();
      onCanvasChangeRef.current?.(state);
    }, [notifyHistory]);

    // Initialize Fabric canvas (once)
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

      // If the parent provided persisted strokes, restore them before
      // recording the initial state so undo returns to the restored snapshot.
      const pendingInitialJSON = initialCanvasJSONRef.current;
      if (pendingInitialJSON) {
        isRestoringRef.current = true;
        canvas.loadFromJSON(pendingInitialJSON, () => {
          canvas.renderAll();
          isRestoringRef.current = false;
          saveState();
        });
      } else {
        saveState();
      }

      // Event listeners — these close over refs, not state, so they always
      // read fresh values.
      canvas.on('path:created', () => {
        if (isRestoringRef.current) return;
        saveState();
      });

      canvas.on('object:added', () => {
        // `path:created` fires separately and also records the state; skip
        // `object:added` for freehand paths to avoid double entries. We
        // still need to record when other code adds objects (text, equations,
        // eraser removals, etc.) outside of a restore operation.
        // To keep behaviour consistent with the previous implementation we
        // rely on `path:created` / `object:modified` / `object:removed` and
        // do not record `object:added` here.
      });

      canvas.on('object:removed', () => {
        if (isRestoringRef.current) return;
        saveState();
      });

      canvas.on('object:modified', () => {
        if (isRestoringRef.current) return;
        saveState();
      });

      return () => {
        resizeObserver.disconnect();
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Text additions bypass path:created, so record explicitly.
        saveState();
      };

      canvas.on('mouse:down', handleCanvasClick);

      return () => {
        canvas.off('mouse:down', handleCanvasClick);
      };
    }, [tool, isEnabled, strokeColor, strokeWidth, saveState]);

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
        isRestoringRef.current = true;
        canvas.clear();
        canvas.backgroundColor = 'transparent';
        canvas.renderAll();
        isRestoringRef.current = false;
        saveState();
        toast.success('Canvas limpo!');
      }
    }, [saveState]);

    const undo = useCallback(() => {
      if (historyIndexRef.current <= 0) return;

      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const previousState = historyRef.current[historyIndexRef.current - 1];
      isRestoringRef.current = true;

      // Temporarily enable canvas interaction for undo
      const wasDisabled = !isEnabled;
      if (wasDisabled) {
        canvas.upperCanvasEl.style.pointerEvents = 'auto';
      }

      canvas.loadFromJSON(previousState, () => {
        canvas.renderAll();
        isRestoringRef.current = false;

        // Restore original interaction state
        if (wasDisabled) {
          canvas.upperCanvasEl.style.pointerEvents = 'none';
        }

        historyIndexRef.current -= 1;
        notifyHistory();
        onCanvasChangeRef.current?.(previousState);
      });
    }, [isEnabled, notifyHistory]);

    const redo = useCallback(() => {
      if (historyIndexRef.current >= historyRef.current.length - 1) return;

      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const nextState = historyRef.current[historyIndexRef.current + 1];
      isRestoringRef.current = true;

      const wasDisabled = !isEnabled;
      if (wasDisabled) {
        canvas.upperCanvasEl.style.pointerEvents = 'auto';
      }

      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
        isRestoringRef.current = false;

        if (wasDisabled) {
          canvas.upperCanvasEl.style.pointerEvents = 'none';
        }

        historyIndexRef.current += 1;
        notifyHistory();
        onCanvasChangeRef.current?.(nextState);
      });
    }, [isEnabled, notifyHistory]);

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
      // Persist the new equation to history.
      saveState();
      toast.success('Equação adicionada!');
    }, [strokeColor, saveState]);

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
