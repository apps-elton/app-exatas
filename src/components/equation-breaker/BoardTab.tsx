import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, MousePointer2, Eraser, Download, Trash2, Square, Circle } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";

type ToolType = 'pen' | 'eraser' | 'rect' | 'circle' | 'line';

export function BoardTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#2563eb');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
  const [canvasData, setCanvasData] = useState<ImageData | null>(null);

  useEffect(() => {
    // Inicializa canvas em tela cheia com fundo branco
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set real size to match display size
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });

    // Salvar estado atual para preview de formas
    if (tool !== 'pen' && tool !== 'eraser') {
      setCanvasData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas || !startPos) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = tool === 'eraser' ? strokeWidth * 3 : strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // If erasing, we actually just draw white since background isn't guaranteed white
      // For a transparent background, we'd use globalCompositeOperation = 'destination-out'
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.stroke();
    } else if (canvasData) {
      // Restore previous state
      ctx.putImageData(canvasData, 0, 0);
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      
      if (tool === 'rect') {
        ctx.rect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      } else if (tool === 'line') {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setStartPos(null);
    setCanvasData(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvas, 0, 0);
    
    const link = document.createElement('a');
    link.download = `lousa-equacao-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL();
    link.click();
  };

  return (
    <div className="h-full flex flex-col w-full">
      {/* Barra de Ferramentas Superior */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-card border-b shrink-0">
        <ToggleGroup type="single" value={tool} onValueChange={(v) => v && setTool(v as ToolType)}>
          <ToggleGroupItem value="pen" aria-label="Caneta livre">
            <PenTool className="w-4 h-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="line" aria-label="Linha reta">
            <MousePointer2 className="w-4 h-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="rect" aria-label="Retângulo">
            <Square className="w-4 h-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="circle" aria-label="Círculo">
            <Circle className="w-4 h-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="eraser" aria-label="Borracha">
            <Eraser className="w-4 h-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="h-6 w-px bg-border/50 mx-2" />

        <div className="flex items-center gap-3">
          <input 
            type="color" 
            value={color} 
            onChange={e => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
          />
          <div className="w-32 flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-4">{strokeWidth}</span>
            <Slider 
              min={1} max={20} step={1} 
              value={[strokeWidth]} 
              onValueChange={v => setStrokeWidth(v[0])}
            />
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearCanvas} className="gap-2 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" /> Limpar
          </Button>
          <Button variant="default" size="sm" onClick={downloadCanvas} className="gap-2">
            <Download className="w-4 h-4" /> Salvar
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-background/50 cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
}
