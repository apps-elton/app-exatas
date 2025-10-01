import React, { useRef, useCallback, useEffect, useState } from 'react';

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  id: string;
  tool: string;
  points: Point[];
  color: string;
  thickness: number;
  opacity: number;
  text?: string;
  graphFunction?: string;
}

interface Page {
  id: string;
  name: string;
  strokes: Stroke[];
}

const MIN_DISTANCE = 2;
const FRAME_TIME = 16;
const QUICK_COLORS = ['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];
const QUICK_THICKNESS = [1, 2, 4, 8, 16];

const distance = (p1: Point, p2: Point) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const smoothPoints = (points: Point[], factor: number): Point[] => {
  if (points.length < 3 || factor === 0) return points;
  const result: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    result.push({
      x: curr.x * (1 - factor) + (prev.x + next.x) * 0.5 * factor,
      y: curr.y * (1 - factor) + (prev.y + next.y) * 0.5 * factor,
      pressure: curr.pressure
    });
  }
  result.push(points[points.length - 1]);
  return result;
};

interface AdvancedDrawingTabletProps {
  isActive: boolean;
  className?: string;
}

export default function AdvancedDrawingTablet({ isActive, className = '' }: AdvancedDrawingTabletProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const lastTimeRef = useRef(0);
  
  const [pages, setPages] = useState<Page[]>([{ id: '1', name: 'Página 1', strokes: [] }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isTabletActive, setIsTabletActive] = useState(true);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ffffff');
  const [thickness, setThickness] = useState(2);
  const [opacity, setOpacity] = useState(1);
  const [smoothing, setSmoothing] = useState(0.8);
  const [pressure, setPressure] = useState(0.5);
  
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [gridColor] = useState('#333333');
  const [laserPoint, setLaserPoint] = useState<Point | null>(null);
  
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState<Point>({ x: 0, y: 0, pressure: 0.5 });
  const [textValue, setTextValue] = useState('');
  
  const [showGraphInput, setShowGraphInput] = useState(false);
  const [graphFunction, setGraphFunction] = useState('');
  
  const [showRuler, setShowRuler] = useState(false);
  const [rulerAngle, setRulerAngle] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  useEffect(() => {
    setStrokes(pages[currentPageIndex].strokes);
  }, [currentPageIndex]);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPages(prev => {
        const newPages = [...prev];
        newPages[currentPageIndex] = { ...newPages[currentPageIndex], strokes: strokes };
        return newPages;
      });
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [strokes, currentPageIndex]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!showGrid) return;
    ctx.save();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }, [showGrid, gridSize, gridColor]);
  
  const drawGraphFunction = useCallback((ctx: CanvasRenderingContext2D, func: string, centerX: number, centerY: number) => {
    try {
      ctx.save();
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(ctx.canvas.width, centerY);
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, ctx.canvas.height);
      ctx.stroke();
      
      ctx.strokeStyle = '#333333';
      const scale = 30;
      for (let i = -20; i <= 20; i++) {
        if (i === 0) continue;
        ctx.beginPath();
        ctx.moveTo(centerX + i * scale, centerY - 5);
        ctx.lineTo(centerX + i * scale, centerY + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX - 5, centerY - i * scale);
        ctx.lineTo(centerX + 5, centerY - i * scale);
        ctx.stroke();
      }
      
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let firstPoint = true;
      for (let x = -ctx.canvas.width / 2; x < ctx.canvas.width / 2; x += 2) {
        try {
          const xVal = x / scale;
          const yVal = eval(func.replace(/x/g, `(${xVal})`));
          if (isFinite(yVal)) {
            const canvasX = centerX + x;
            const canvasY = centerY - yVal * scale;
            if (firstPoint) {
              ctx.moveTo(canvasX, canvasY);
              firstPoint = false;
            } else {
              ctx.lineTo(canvasX, canvasY);
            }
          }
        } catch (e) {}
      }
      ctx.stroke();
      ctx.restore();
    } catch (e) {}
  }, []);
  
  const drawRuler = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!showRuler) return;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rulerAngle * Math.PI) / 180);
    ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
    ctx.fillRect(-300, -30, 600, 60);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-300, -30, 600, 60);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#000000';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let i = -300; i <= 300; i += 10) {
      const h = i % 50 === 0 ? 20 : (i % 25 === 0 ? 15 : 10);
      ctx.beginPath();
      ctx.moveTo(i, -30);
      ctx.lineTo(i, -30 + h);
      ctx.stroke();
      if (i % 50 === 0) {
        ctx.fillText(Math.abs(i / 10).toString(), i, -10);
      }
    }
    ctx.restore();
  }, [showRuler, rulerAngle]);
  
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);
    
    [...strokes, current].filter(Boolean).forEach((stroke) => {
      if (!stroke) return;
      
      if (stroke.tool === 'graph' && stroke.graphFunction) {
        drawGraphFunction(ctx, stroke.graphFunction, canvas.width / 2, canvas.height / 2);
        return;
      }
      
      if (['rectangle', 'circle', 'line', 'arrow', 'diamond'].includes(stroke.tool)) {
        if (stroke.points.length < 2) return;
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.thickness;
        ctx.globalAlpha = stroke.opacity;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (stroke.tool === 'rectangle') {
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else if (stroke.tool === 'circle') {
          ctx.beginPath();
          ctx.arc(start.x, start.y, distance(start, end), 0, Math.PI * 2);
          ctx.stroke();
        } else if (stroke.tool === 'line') {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        } else if (stroke.tool === 'arrow') {
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const headLength = 20;
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        } else if (stroke.tool === 'diamond') {
          const centerX = (start.x + end.x) / 2;
          const centerY = (start.y + end.y) / 2;
          ctx.beginPath();
          ctx.moveTo(centerX, start.y);
          ctx.lineTo(end.x, centerY);
          ctx.lineTo(centerX, end.y);
          ctx.lineTo(start.x, centerY);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
        return;
      }
      
      if (stroke.tool === 'text' && stroke.text) {
        ctx.save();
        ctx.fillStyle = stroke.color;
        ctx.font = `${stroke.thickness * 8}px Arial`;
        ctx.globalAlpha = stroke.opacity;
        const lines = stroke.text.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, stroke.points[0].x, stroke.points[0].y + (i * stroke.thickness * 10));
        });
        ctx.restore();
        return;
      }
      
      if (stroke.points.length < 2) return;
      const smoothed = smoothPoints(stroke.points, smoothing);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.color;
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.beginPath();
      ctx.moveTo(smoothed[0].x, smoothed[0].y);
      
      for (let i = 1; i < smoothed.length; i++) {
        const curr = smoothed[i - 1];
        const next = smoothed[i];
        const p = curr.pressure;
        const w = stroke.thickness * (0.5 + p * 1.5);
        ctx.lineWidth = w;
        ctx.globalAlpha = stroke.opacity;
        const cpx = (curr.x + next.x) / 2;
        const cpy = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, cpx, cpy);
      }
      ctx.stroke();
      ctx.restore();
      
      if (stroke.tool === 'pencil') {
        ctx.save();
        ctx.globalAlpha = stroke.opacity * 0.3;
        ctx.lineWidth = 1;
        for (let i = 0; i < smoothed.length - 1; i++) {
          const curr = smoothed[i];
          const next = smoothed[i + 1];
          const offset = Math.random() * 2 - 1;
          ctx.beginPath();
          ctx.moveTo(curr.x + offset, curr.y + offset);
          ctx.lineTo(next.x + offset, next.y + offset);
          ctx.stroke();
        }
        ctx.restore();
      }
    });
    
    if (laserPoint) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(laserPoint.x, laserPoint.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    
    drawRuler(ctx, canvas.width, canvas.height);
  }, [strokes, current, smoothing, laserPoint, drawGrid, drawRuler, drawGraphFunction]);
  
  useEffect(() => {
    redraw();
  }, [redraw]);
  
  const getPoint = useCallback((e: React.PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const p = e.pressure || (e.pointerType === 'pen' ? 0.7 : 0.5);
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: Math.max(0.3, Math.min(1, p))
    };
  }, []);
  
  const start = useCallback((e: React.PointerEvent) => {
    if (!isTabletActive) return;
    e.preventDefault();
    const point = getPoint(e);
    setPressure(point.pressure);
    
    if (tool === 'text') {
      setTextPosition(point);
      setTextValue('');
      setShowTextInput(true);
      setTimeout(() => textInputRef.current?.focus(), 10);
      return;
    }
    if (tool === 'graph') {
      setShowGraphInput(true);
      return;
    }
    if (tool === 'laser') {
      setLaserPoint(point);
      return;
    }
    
    setCurrent({
      id: Date.now().toString(),
      tool,
      points: [point],
      color,
      thickness,
      opacity
    });
    setIsDrawing(true);
  }, [isTabletActive, tool, color, thickness, opacity, getPoint]);
  
  const move = useCallback((e: React.PointerEvent) => {
    const point = getPoint(e);
    if (tool === 'laser') {
      setLaserPoint(point);
      return;
    }
    if (!isDrawing || !current) return;
    e.preventDefault();
    const now = performance.now();
    if (now - lastTimeRef.current < FRAME_TIME) return;
    lastTimeRef.current = now;
    setPressure(point.pressure);
    
    if (['rectangle', 'circle', 'line', 'arrow', 'diamond'].includes(tool)) {
      setCurrent({ ...current, points: [current.points[0], point] });
      return;
    }
    
    const last = current.points[current.points.length - 1];
    if (distance(last, point) < MIN_DISTANCE) return;
    setCurrent({ ...current, points: [...current.points, point] });
  }, [isDrawing, current, getPoint, tool]);
  
  const stop = useCallback(() => {
    if (tool === 'laser') {
      setLaserPoint(null);
      return;
    }
    if (!isDrawing || !current) return;
    if (current.points.length > 0) {
      setStrokes(prev => [...prev, current]);
    }
    setCurrent(null);
    setIsDrawing(false);
  }, [isDrawing, current, tool]);
  
  const handleTextSubmit = useCallback(() => {
    if (textValue.trim()) {
      setStrokes(prev => [...prev, {
        id: Date.now().toString(),
        tool: 'text',
        points: [textPosition],
        color,
        thickness,
        opacity,
        text: textValue
      }]);
    }
    setShowTextInput(false);
    setTextValue('');
  }, [textValue, textPosition, color, thickness, opacity]);
  
  const handleGraphSubmit = useCallback(() => {
    if (graphFunction.trim()) {
      setStrokes(prev => [...prev, {
        id: Date.now().toString(),
        tool: 'graph',
        points: [{ x: 0, y: 0, pressure: 0.5 }],
        color,
        thickness,
        opacity,
        graphFunction: graphFunction
      }]);
    }
    setShowGraphInput(false);
    setGraphFunction('');
  }, [graphFunction, color, thickness, opacity]);
  
  const addPage = useCallback(() => {
    const newPage: Page = {
      id: Date.now().toString(),
      name: `Página ${pages.length + 1}`,
      strokes: []
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
  }, [pages]);
  
  const deletePage = useCallback((index: number) => {
    if (pages.length === 1) return;
    setPages(prev => prev.filter((_, i) => i !== index));
    if (currentPageIndex >= pages.length - 1) {
      setCurrentPageIndex(Math.max(0, pages.length - 2));
    }
  }, [pages, currentPageIndex]);
  
  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `aula-pagina-${currentPageIndex + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setShowExportMenu(false);
  }, [currentPageIndex]);
  
  const exportAllPNG = useCallback(() => {
    pages.forEach((page, index) => {
      setTimeout(() => {
        setCurrentPageIndex(index);
        setTimeout(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const link = document.createElement('a');
          link.download = `aula-${page.name}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }, 100);
      }, index * 200);
    });
    setShowExportMenu(false);
  }, [pages]);
  
  const exportSVG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">`;
    svg += `<rect width="100%" height="100%" fill="#1a1a1a"/>`;
    strokes.forEach(stroke => {
      if (stroke.tool === 'text' && stroke.text) {
        svg += `<text x="${stroke.points[0].x}" y="${stroke.points[0].y}" fill="${stroke.color}" font-size="${stroke.thickness * 8}" opacity="${stroke.opacity}">${stroke.text}</text>`;
      } else if (stroke.points.length > 1) {
        svg += `<path d="M ${stroke.points[0].x} ${stroke.points[0].y}`;
        for (let i = 1; i < stroke.points.length; i++) {
          svg += ` L ${stroke.points[i].x} ${stroke.points[i].y}`;
        }
        svg += `" stroke="${stroke.color}" stroke-width="${stroke.thickness}" fill="none" opacity="${stroke.opacity}" stroke-linecap="round"/>`;
      }
    });
    svg += '</svg>';
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `aula-pagina-${currentPageIndex + 1}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }, [strokes, currentPageIndex]);
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); setStrokes(prev => prev.slice(0, -1)); }
      if (e.key === 'Delete') { e.preventDefault(); setStrokes([]); }
      if (e.key === 'g') setShowGrid(!showGrid);
      if (e.key === 'r') setShowRuler(!showRuler);
      if (e.key === 'p') setTool('pen');
      if (e.key === 'l') setTool('pencil');
      if (e.key === 'h') setTool('highlighter');
      if (e.key === 'e') setTool('eraser');
      if (e.key === 't') setTool('text');
      if (e.key === 'f') setTool('graph');
      if (e.key === 'q') setTool('rectangle');
      if (e.key === 'c') setTool('circle');
      if (e.key === 'a') setTool('arrow');
      if (e.key === 'd') setTool('diamond');
      if (e.key === 's' && !e.ctrlKey) setTool('line');
      if (e.key === 'k') setTool('laser');
      if (e.key === 'ArrowLeft' && e.ctrlKey) { e.preventDefault(); setCurrentPageIndex(prev => Math.max(0, prev - 1)); }
      if (e.key === 'ArrowRight' && e.ctrlKey) { e.preventDefault(); setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1)); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showGrid, showRuler, pages]);
  
  useEffect(() => {
    if (tool === 'highlighter') setOpacity(0.3);
    else if (opacity === 0.3) setOpacity(1);
  }, [tool, opacity]);
  
  if (!isActive) return null;

  return (
    <div className={`w-full h-full bg-transparent flex flex-col ${className}`}>
      <div className="bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-700 flex-wrap text-xs">
        <button onClick={() => setIsTabletActive(!isTabletActive)} title="Ativar/Desativar Mesa" className={`w-10 h-5 rounded-full relative ${isTabletActive ? 'bg-green-500' : 'bg-gray-600'}`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isTabletActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
        
        <div className="flex gap-1">
          {[
            { id: 'pen', icon: '🖊️', name: 'Caneta (P)' },
            { id: 'pencil', icon: '✏️', name: 'Lápis (L)' },
            { id: 'highlighter', icon: '🖍️', name: 'Marca-texto (H)' },
            { id: 'eraser', icon: '🧹', name: 'Borracha (E)' }
          ].map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.name} className={`px-2 py-1 rounded ${tool === t.id ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
              {t.icon}
            </button>
          ))}
        </div>
        
        <div className="w-px h-6 bg-gray-600"></div>
        
        <div className="flex gap-1">
          {[
            { id: 'rectangle', icon: '▭', name: 'Retângulo (Q)' },
            { id: 'circle', icon: '○', name: 'Círculo (C)' },
            { id: 'line', icon: '/', name: 'Linha (S)' },
            { id: 'arrow', icon: '→', name: 'Seta (A)' },
            { id: 'diamond', icon: '◇', name: 'Losango (D)' }
          ].map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.name} className={`px-2 py-1 rounded ${tool === t.id ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
              {t.icon}
            </button>
          ))}
        </div>
        
        <div className="w-px h-6 bg-gray-600"></div>
        
        <div className="flex gap-1">
          <button onClick={() => setTool('text')} title="Texto (T)" className={`px-2 py-1 rounded ${tool === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>T</button>
          <button onClick={() => setTool('graph')} title="Gráfico (F)" className={`px-2 py-1 rounded ${tool === 'graph' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>📈</button>
          <button onClick={() => setTool('laser')} title="Laser Pointer (K)" className={`px-2 py-1 rounded ${tool === 'laser' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}>🔴</button>
          <button onClick={() => setShowGrid(!showGrid)} title="Grade/Quadriculado (G)" className={`px-2 py-1 rounded ${showGrid ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>#</button>
          <button onClick={() => setShowRuler(!showRuler)} title="Régua (R)" className={`px-2 py-1 rounded ${showRuler ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>📏</button>
        </div>
        
        <div className="w-px h-6 bg-gray-600"></div>
        
        <div className="flex gap-1">
          {QUICK_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} title="Selecionar cor" className={`w-6 h-6 rounded border-2 ${color === c ? 'border-white' : 'border-gray-600'}`} style={{ backgroundColor: c }} />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} title="Seletor de cor personalizado" className="w-6 h-6 rounded border-2 border-gray-600" />
        </div>
        
        <div className="w-px h-6 bg-gray-600"></div>
        
        <div className="flex gap-1">
          {QUICK_THICKNESS.map(t => (
            <button key={t} onClick={() => setThickness(t)} title={`Espessura ${t}px`} className={`w-6 h-6 rounded flex items-center justify-center ${thickness === t ? 'bg-blue-500' : 'bg-gray-700'}`}>
              <div className="rounded-full bg-current" style={{ width: `${Math.min(t, 16)}px`, height: `${Math.min(t, 16)}px` }} />
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-white">Esp:</span>
          <input type="range" min="0.5" max="30" step="0.5" value={thickness} onChange={(e) => setThickness(parseFloat(e.target.value))} title="Ajustar espessura" className="w-20" />
          <span className="text-white w-8">{thickness}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-white">Op:</span>
          <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} title="Ajustar opacidade" className="w-20" />
          <span className="text-white w-8">{Math.round(opacity * 100)}%</span>
        </div>
        
        {showGrid && (
          <div className="flex items-center gap-1">
            <span className="text-white">Grid:</span>
            <input type="range" min="10" max="100" step="10" value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value))} title="Tamanho da grade" className="w-16" />
            <span className="text-white">{gridSize}</span>
          </div>
        )}
        
        {showRuler && (
          <div className="flex items-center gap-1">
            <span className="text-white">Ângulo:</span>
            <input type="range" min="0" max="180" value={rulerAngle} onChange={(e) => setRulerAngle(parseInt(e.target.value))} title="Rotação da régua" className="w-16" />
            <span className="text-white">{rulerAngle}°</span>
          </div>
        )}
        
        <div className="flex gap-1 ml-auto">
          <button onClick={() => setStrokes(prev => prev.slice(0, -1))} disabled={strokes.length === 0} title="Desfazer (Ctrl+Z)" className="px-2 py-1 bg-yellow-600 text-white rounded disabled:opacity-50">↶</button>
          <button onClick={() => setStrokes([])} title="Limpar tudo (Delete)" className="px-2 py-1 bg-red-600 text-white rounded">🗑️</button>
          <button onClick={() => setShowExportMenu(!showExportMenu)} title="Exportar" className="px-2 py-1 bg-green-600 text-white rounded">💾</button>
        </div>
      </div>
      
      <div className="bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-700 overflow-x-auto">
        <span className="text-white text-xs">Páginas:</span>
        {pages.map((page, index) => (
          <div key={page.id} className="flex items-center gap-1">
            <button onClick={() => setCurrentPageIndex(index)} title={`Ir para ${page.name}`} className={`px-3 py-1 rounded text-xs ${currentPageIndex === index ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
              {page.name}
            </button>
            {pages.length > 1 && <button onClick={() => deletePage(index)} title="Deletar página" className="w-5 h-5 bg-red-600 text-white rounded text-xs">×</button>}
          </div>
        ))}
        <button onClick={addPage} title="Adicionar nova página" className="px-3 py-1 bg-green-600 text-white rounded text-xs">+ Nova</button>
      </div>
      
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="absolute inset-0" style={{ touchAction: 'none', cursor: isTabletActive ? (tool === 'laser' ? 'none' : 'crosshair') : 'default' }}
          onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerLeave={stop} />
        
        {showTextInput && (
          <div className="absolute bg-white/95 p-1 rounded shadow-2xl z-50 border-2 border-blue-500" style={{ left: textPosition.x, top: textPosition.y, minWidth: '250px' }}>
            <textarea
              ref={textInputRef}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { 
                  handleTextSubmit();
                }
                e.stopPropagation();
              }}
              onBlur={handleTextSubmit}
              autoFocus
              className="w-full px-2 py-1 border-0 outline-none resize-none"
              style={{ 
                fontSize: `${thickness * 8}px`,
                color: color,
                background: 'transparent',
                minHeight: '40px',
                fontFamily: 'Arial'
              }}
              placeholder="Digite aqui... (ESC para finalizar)"
            />
          </div>
        )}
        
        {showGraphInput && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-lg z-50">
            <div className="text-sm font-bold mb-2">Função Matemática</div>
            <div className="text-xs text-gray-600 mb-2">Use 'x'. Ex: x**2, Math.sin(x), x**3 - 2*x</div>
            <input type="text" value={graphFunction} onChange={(e) => setGraphFunction(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGraphSubmit(); if (e.key === 'Escape') { setShowGraphInput(false); setGraphFunction(''); }}}
              autoFocus className="px-2 py-1 border rounded w-64" placeholder="Ex: x**2" />
            <div className="flex gap-1 mt-2">
              <button onClick={handleGraphSubmit} className="px-3 py-1 bg-green-500 text-white rounded text-xs">Plotar</button>
              <button onClick={() => { setShowGraphInput(false); setGraphFunction(''); }} className="px-3 py-1 bg-gray-500 text-white rounded text-xs">Cancelar</button>
            </div>
          </div>
        )}
        
        {showExportMenu && (
          <div className="absolute top-12 right-4 bg-gray-800 p-2 rounded shadow-lg z-50 text-xs">
            <button onClick={exportPNG} className="block w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded">💾 Exportar Página (PNG)</button>
            <button onClick={exportAllPNG} className="block w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded">📚 Exportar Todas (PNG)</button>
            <button onClick={exportSVG} className="block w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded">📐 Exportar (SVG)</button>
            <button onClick={() => setShowExportMenu(false)} className="block w-full text-left px-3 py-2 text-gray-400 hover:bg-gray-700 rounded">✕ Fechar</button>
          </div>
        )}
        
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          <div>Página: {currentPageIndex + 1}/{pages.length}</div>
          <div>Traços: {strokes.length}</div>
          <div>Ferramenta: {tool}</div>
        </div>
      </div>
    </div>
  );
}