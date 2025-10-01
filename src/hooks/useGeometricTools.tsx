import { useState, useRef, useEffect } from 'react';

// ==========================================
// TIPOS
// ==========================================

type Tool = 'circle' | 'rectangle' | 'line';

interface Point {
  x: number;
  y: number;
}

interface BaseShape {
  id: string;
  type: string;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
}

interface Rectangle extends BaseShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Circle extends BaseShape {
  type: 'circle';
  cx: number;
  cy: number;
  radius: number;
}

interface Line extends BaseShape {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

type Shape = Rectangle | Circle | Line;

// ==========================================
// HOOK PARA FERRAMENTAS GEOMÉTRICAS
// ==========================================

export const useGeometricTools = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  currentTool: Tool,
  strokeColor: string,
  strokeWidth: number,
  fillColor: string
) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [previewShape, setPreviewShape] = useState<Shape | null>(null);

  // Função para obter coordenadas do mouse/pointer
  const getPointerPosition = (e: PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Desenhar uma forma no canvas
  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape, isPreview: boolean = false) => {
    ctx.save();

    if (isPreview) {
      ctx.setLineDash([5, 5]);
    }

    if (shape.type === 'rectangle') {
      // Desenhar retângulo
      if (shape.fillColor && shape.fillColor !== 'transparent') {
        ctx.fillStyle = shape.fillColor;
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      }
      
      ctx.strokeStyle = shape.strokeColor;
      ctx.lineWidth = shape.strokeWidth;
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      
    } else if (shape.type === 'circle') {
      // Desenhar círculo
      ctx.beginPath();
      ctx.arc(shape.cx, shape.cy, shape.radius, 0, Math.PI * 2);
      
      if (shape.fillColor && shape.fillColor !== 'transparent') {
        ctx.fillStyle = shape.fillColor;
        ctx.fill();
      }
      
      ctx.strokeStyle = shape.strokeColor;
      ctx.lineWidth = shape.strokeWidth;
      ctx.stroke();
      
    } else if (shape.type === 'line') {
      // Desenhar linha
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      
      ctx.strokeStyle = shape.strokeColor;
      ctx.lineWidth = shape.strokeWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.restore();
  };

  // Renderizar canvas
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar todas as formas salvas
    shapes.forEach(shape => drawShape(ctx, shape));

    // Desenhar preview da forma sendo criada
    if (previewShape) {
      drawShape(ctx, previewShape, true);
    }
  };

  // Effect para renderizar sempre que houver mudanças
  useEffect(() => {
    render();
  }, [shapes, previewShape]);

  // Handler: Início do desenho
  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    const point = getPointerPosition(e);
    setIsDrawing(true);
    setStartPoint(point);
  };

  // Handler: Movimento durante o desenho
  const handlePointerMove = (e: PointerEvent) => {
    if (!isDrawing || !startPoint) return;
    e.preventDefault();

    const currentPoint = getPointerPosition(e);
    
    const baseShape = {
      id: `temp-${Date.now()}`,
      strokeColor,
      strokeWidth,
      fillColor,
    };

    let preview: Shape | null = null;

    if (currentTool === 'rectangle') {
      // Criar preview do retângulo
      const width = currentPoint.x - startPoint.x;
      const height = currentPoint.y - startPoint.y;
      
      preview = {
        ...baseShape,
        type: 'rectangle',
        x: width >= 0 ? startPoint.x : currentPoint.x,
        y: height >= 0 ? startPoint.y : currentPoint.y,
        width: Math.abs(width),
        height: Math.abs(height),
      } as Rectangle;
      
    } else if (currentTool === 'circle') {
      // Criar preview do círculo
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      preview = {
        ...baseShape,
        type: 'circle',
        cx: startPoint.x,
        cy: startPoint.y,
        radius,
      } as Circle;
      
    } else if (currentTool === 'line') {
      // Criar preview da linha
      preview = {
        ...baseShape,
        type: 'line',
        x1: startPoint.x,
        y1: startPoint.y,
        x2: currentPoint.x,
        y2: currentPoint.y,
      } as Line;
    }

    setPreviewShape(preview);
  };

  // Handler: Fim do desenho
  const handlePointerUp = (e: PointerEvent) => {
    if (!isDrawing || !previewShape) {
      setIsDrawing(false);
      return;
    }

    e.preventDefault();

    // Adicionar forma finalizada à lista
    const finalShape = {
      ...previewShape,
      id: `shape-${Date.now()}-${Math.random()}`,
    };

    setShapes(prev => [...prev, finalShape]);

    // Resetar estados
    setIsDrawing(false);
    setStartPoint(null);
    setPreviewShape(null);
  };

  // Handler: Mouse sai do canvas
  const handlePointerLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setStartPoint(null);
      setPreviewShape(null);
    }
  };

  // Registrar event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [isDrawing, startPoint, currentTool, strokeColor, strokeWidth, fillColor]);

  return {
    shapes,
    setShapes,
    clearCanvas: () => setShapes([]),
  };
};

// ==========================================
// COMPONENTE DE EXEMPLO
// ==========================================

export default function GeometricToolsDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [currentTool, setCurrentTool] = useState<Tool>('rectangle');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fillColor, setFillColor] = useState('transparent');

  const { shapes, clearCanvas } = useGeometricTools(
    canvasRef,
    currentTool,
    strokeColor,
    strokeWidth,
    fillColor
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 p-4 flex items-center gap-4 shadow-sm">
        {/* Ferramentas */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setCurrentTool('rectangle')}
            className={`px-4 py-2 rounded transition-colors ${
              currentTool === 'rectangle'
                ? 'bg-blue-500 text-white'
                : 'bg-white hover:bg-gray-200'
            }`}
          >
            ⬜ Retângulo
          </button>
          <button
            onClick={() => setCurrentTool('circle')}
            className={`px-4 py-2 rounded transition-colors ${
              currentTool === 'circle'
                ? 'bg-blue-500 text-white'
                : 'bg-white hover:bg-gray-200'
            }`}
          >
            ⭕ Círculo
          </button>
          <button
            onClick={() => setCurrentTool('line')}
            className={`px-4 py-2 rounded transition-colors ${
              currentTool === 'line'
                ? 'bg-blue-500 text-white'
                : 'bg-white hover:bg-gray-200'
            }`}
          >
            ➖ Linha
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300" />

        {/* Cor do traço */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Cor:</label>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
          />
        </div>

        {/* Espessura */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Espessura:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm w-8">{strokeWidth}px</span>
        </div>

        {/* Preenchimento */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Preenchimento:</label>
          <button
            onClick={() => setFillColor('transparent')}
            className={`px-3 py-1 text-sm rounded border ${
              fillColor === 'transparent'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white border-gray-300'
            }`}
          >
            Vazio
          </button>
          <input
            type="color"
            value={fillColor === 'transparent' ? '#ffffff' : fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
          />
        </div>

        <div className="w-px h-8 bg-gray-300" />

        {/* Limpar */}
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Limpar
        </button>

        <div className="ml-auto text-sm text-gray-600">
          Formas: <strong>{shapes.length}</strong>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-8">
        <canvas
          ref={canvasRef}
          width={1200}
          height={700}
          className="border-2 border-gray-300 bg-white shadow-lg rounded cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Info */}
      <div className="bg-white border-t border-gray-300 px-4 py-2 text-sm text-gray-600">
        <strong>Instruções:</strong> Clique e arraste para desenhar. 
        {currentTool === 'rectangle' && ' Arraste para criar um retângulo.'}
        {currentTool === 'circle' && ' Arraste a partir do centro para definir o raio.'}
        {currentTool === 'line' && ' Arraste de um ponto a outro para criar uma linha.'}
      </div>
    </div>
  );
}

