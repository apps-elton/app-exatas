import React, { useRef, useEffect, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, Line, IText, Image as FabricImage } from 'fabric';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Pencil, Eraser, Type, Square, Circle as CircleIcon, Minus, Palette, Download, Unlock, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { RobustDrawingOverlay, RobustDrawingOverlayRef } from './RobustDrawingOverlay';

interface FrozenCanvasProps {
  frozenImage: string;
  onUnfreeze: () => void;
  onAnnotationChange?: (hasAnnotations: boolean) => void;
}

interface DrawingTool {
  type: 'pen' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line';
  color: string;
  width: number;
}

export function FrozenCanvas({ frozenImage, onUnfreeze, onAnnotationChange }: FrozenCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingOverlayRef = useRef<RobustDrawingOverlayRef>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [currentTool, setCurrentTool] = useState<DrawingTool>({
    type: 'pen',
    color: '#ff0000',
    width: 3
  });

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: 'transparent'
    });

    // Load frozen image as background
    const img = new Image();
    img.onload = () => {
      const fabricImg = new FabricImage(img, {
        left: 0,
        top: 0,
        scaleX: canvas.width! / img.width,
        scaleY: canvas.height! / img.height,
        selectable: false,
        evented: false
      });
      canvas.backgroundImage = fabricImg;
      canvas.renderAll();
    };
    img.src = frozenImage;

    // Setup drawing
    canvas.isDrawingMode = currentTool.type === 'pen';
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = currentTool.color;
      canvas.freeDrawingBrush.width = currentTool.width;
    }

    // Listen for changes
    canvas.on('path:created', () => {
      onAnnotationChange?.(true);
      toast('Anotação adicionada');
    });

    canvas.on('object:added', () => {
      onAnnotationChange?.(true);
    });

    setFabricCanvas(canvas);

    const handleResize = () => {
      canvas.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [frozenImage]);

  useEffect(() => {
    if (!fabricCanvas) return;

    // Reset all modes first
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = true;
    fabricCanvas.defaultCursor = 'default';
    
    // Configure based on tool
    switch (currentTool.type) {
      case 'pen':
        fabricCanvas.isDrawingMode = true;
        fabricCanvas.selection = false;
        if (fabricCanvas.freeDrawingBrush) {
          fabricCanvas.freeDrawingBrush.color = currentTool.color;
          fabricCanvas.freeDrawingBrush.width = currentTool.width;
        }
        break;
        
      case 'eraser':
        fabricCanvas.isDrawingMode = true;
        fabricCanvas.selection = false;
        if (fabricCanvas.freeDrawingBrush) {
          fabricCanvas.freeDrawingBrush.color = 'rgba(0,0,0,0)';
          fabricCanvas.freeDrawingBrush.width = currentTool.width * 2;
        }
        break;
        
      case 'rectangle':
      case 'circle':
      case 'line':
      case 'text':
        fabricCanvas.defaultCursor = 'crosshair';
        fabricCanvas.selection = false;
        break;
        
      default:
        fabricCanvas.selection = true;
        break;
    }
  }, [currentTool, fabricCanvas]);

  const handleToolChange = (type: DrawingTool['type']) => {
    setCurrentTool(prev => ({ ...prev, type }));
  };

  const handleColorChange = (color: string) => {
    setCurrentTool(prev => ({ ...prev, color }));
  };

  const handleWidthChange = (width: number) => {
    setCurrentTool(prev => ({ ...prev, width }));
  };

  // Shape drawing state
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStartPoint, setShapeStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentShape, setCurrentShape] = useState<any>(null);

  // Add mouse event handlers for shape drawing
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (e: any) => {
      if (['rectangle', 'circle', 'line'].includes(currentTool.type)) {
        e.e.preventDefault();
        e.e.stopPropagation();
        
        const pointer = fabricCanvas.getPointer(e.e);
        setShapeStartPoint({ x: pointer.x, y: pointer.y });
        setIsDrawingShape(true);
        
        // Create initial shape
        let shape;
        switch (currentTool.type) {
          case 'rectangle':
            shape = new Rect({
              left: pointer.x,
              top: pointer.y,
              width: 1,
              height: 1,
              fill: 'transparent',
              stroke: currentTool.color,
              strokeWidth: currentTool.width,
              selectable: false
            });
            break;
          case 'circle':
            shape = new Circle({
              left: pointer.x,
              top: pointer.y,
              radius: 1,
              fill: 'transparent',
              stroke: currentTool.color,
              strokeWidth: currentTool.width,
              selectable: false
            });
            break;
          case 'line':
            shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
              stroke: currentTool.color,
              strokeWidth: currentTool.width,
              selectable: false
            });
            break;
        }
        
        if (shape) {
          fabricCanvas.add(shape);
          setCurrentShape(shape);
        }
      } else if (currentTool.type === 'text') {
        e.e.preventDefault();
        e.e.stopPropagation();
        
        const pointer = fabricCanvas.getPointer(e.e);
        const text = new IText('Texto', {
          left: pointer.x,
          top: pointer.y,
          fill: currentTool.color,
          fontSize: 20,
          fontFamily: 'Arial'
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
        text.enterEditing();
      }
    };

    const handleMouseMove = (e: any) => {
      if (isDrawingShape && shapeStartPoint && currentShape) {
        e.e.preventDefault();
        e.e.stopPropagation();
        
        const pointer = fabricCanvas.getPointer(e.e);
        
        switch (currentTool.type) {
          case 'rectangle':
            const width = Math.abs(pointer.x - shapeStartPoint.x);
            const height = Math.abs(pointer.y - shapeStartPoint.y);
            currentShape.set({
              width,
              height,
              left: Math.min(pointer.x, shapeStartPoint.x),
              top: Math.min(pointer.y, shapeStartPoint.y)
            });
            break;
          case 'circle':
            const radius = Math.sqrt(
              Math.pow(pointer.x - shapeStartPoint.x, 2) + 
              Math.pow(pointer.y - shapeStartPoint.y, 2)
            );
            currentShape.set({
              radius,
              left: shapeStartPoint.x - radius,
              top: shapeStartPoint.y - radius
            });
            break;
          case 'line':
            currentShape.set({
              x2: pointer.x,
              y2: pointer.y
            });
            break;
        }
        fabricCanvas.renderAll();
      }
    };

    const handleMouseUp = (e: any) => {
      if (isDrawingShape) {
        e.e.preventDefault();
        e.e.stopPropagation();
        
        setIsDrawingShape(false);
        setShapeStartPoint(null);
        if (currentShape) {
          currentShape.set({ selectable: true });
          setCurrentShape(null);
        }
        onAnnotationChange?.(true);
      }
    };

    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:up', handleMouseUp);

    return () => {
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:move', handleMouseMove);
      fabricCanvas.off('mouse:up', handleMouseUp);
    };
  }, [fabricCanvas, currentTool, isDrawingShape, shapeStartPoint, currentShape, onAnnotationChange]);

  const clearCanvas = () => {
    if (currentTool.type === 'pen' || currentTool.type === 'eraser') {
      // Limpar overlay de desenho para caneta e borracha
      drawingOverlayRef.current?.clear();
    } else {
      // Limpar fabric canvas para outras ferramentas
      if (!fabricCanvas) return;
      fabricCanvas.clear();
      
      // Reload background image
      const img = new Image();
      img.onload = () => {
        const fabricImg = new FabricImage(img, {
          left: 0,
          top: 0,
          scaleX: fabricCanvas.width! / img.width,
          scaleY: fabricCanvas.height! / img.height,
          selectable: false,
          evented: false
        });
        fabricCanvas.backgroundImage = fabricImg;
        fabricCanvas.renderAll();
      };
      img.src = frozenImage;
    }
    
    onAnnotationChange?.(false);
    toast('Anotações removidas');
  };

  const downloadImage = async () => {
    if (!fabricCanvas) return;
    
    try {
      // Criar canvas temporário para combinar tudo
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;

      tempCanvas.width = fabricCanvas.width!;
      tempCanvas.height = fabricCanvas.height!;

      // Desenhar conteúdo do fabric canvas (imagem + formas)
      const fabricDataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });

      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          resolve();
        };
        img.src = fabricDataURL;
      });

      // Desenhar overlay de desenho (caneta/borracha) por cima
      const overlayDataURL = drawingOverlayRef.current?.save();
      if (overlayDataURL) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            resolve();
          };
          img.src = overlayDataURL;
        });
      }

      // Download da imagem combinada
      const finalDataURL = tempCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `geometria-anotada-completa-${Date.now()}.png`;
      link.href = finalDataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast('Imagem completa baixada com sucesso!');
    } catch (error) {
      toast.error('Erro ao baixar imagem');
    }
  };

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff'];
  const widths = [1, 2, 3, 5, 8, 12];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-card border-b">
        <Button
          variant={currentTool.type === 'pen' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleToolChange('pen')}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        
        <Button
          variant={currentTool.type === 'eraser' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleToolChange('eraser')}
        >
          <Eraser className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant={currentTool.type === 'rectangle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleToolChange('rectangle')}
        >
          <Square className="w-4 h-4" />
        </Button>

        <Button
          variant={currentTool.type === 'circle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleToolChange('circle')}
        >
          <CircleIcon className="w-4 h-4" />
        </Button>

        <Button
          variant={currentTool.type === 'line' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleToolChange('line')}
        >
          <Minus className="w-4 h-4" />
        </Button>

        <Button
          variant={currentTool.type === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleToolChange('text')}
        >
          <Type className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Colors */}
        <div className="flex gap-1">
          {colors.map(color => (
            <button
              key={color}
              className={`w-6 h-6 rounded border-2 ${
                currentTool.color === color ? 'border-primary' : 'border-border'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
            />
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Width */}
        <div className="flex gap-1">
          {widths.map(width => (
            <Button
              key={width}
              variant={currentTool.width === width ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleWidthChange(width)}
            >
              {width}px
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="outline"
          size="sm"
          onClick={clearCanvas}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={downloadImage}
        >
          <Download className="w-4 h-4" />
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onUnfreeze}
        >
          <Unlock className="w-4 h-4 mr-2" />
          Descongelar
        </Button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none' }}
        />
        
        {/* Overlay para desenho com caneta e borracha */}
        <RobustDrawingOverlay
          ref={drawingOverlayRef}
          isEnabled={currentTool.type === 'pen' || currentTool.type === 'eraser'}
          tool={currentTool.type === 'pen' ? 'pen' : 'eraser'}
          strokeColor={currentTool.color}
          strokeWidth={currentTool.width}
          opacity={1}
          onHistoryChange={(canUndo, canRedo) => {
            if (canUndo || canRedo) {
              onAnnotationChange?.(true);
            }
          }}
        />
      </div>
    </div>
  );
}