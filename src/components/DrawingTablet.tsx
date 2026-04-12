import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const MIN_DISTANCE = 2;
const FRAME_TIME = 16;
const QUICK_COLORS_DARK = ['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];
const QUICK_COLORS_LIGHT = ['#000000', '#ff0000', '#00aa00', '#0000ff', '#cccc00', '#cc00cc', '#00aaaa', '#ff8800'];

const distance = (p1: any, p2: any) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

interface DrawingTabletProps {
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export default function DrawingTablet({ isActive, onToggle, className = '' }: DrawingTabletProps) {
  const { t: tr } = useTranslation();
  console.log('🎨 DrawingTablet renderizado - isActive:', isActive);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const lastTimeRef = useRef(0);

  const [pages, setPages] = useState([{ id: '1', name: 'Página 1', strokes: [] }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [strokes, setStrokes] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ffffff');
  const [thickness, setThickness] = useState(3);
  const [opacity, setOpacity] = useState(1);

  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);

  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [gridOpacity, setGridOpacity] = useState(0.15);
  const [laserPoint, setLaserPoint] = useState<any>(null);
  const [laserColor, setLaserColor] = useState('#ff0000');
  const [laserMode, setLaserMode] = useState('pointer');
  const [temporaryStrokes, setTemporaryStrokes] = useState<any[]>([]);

  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0, pressure: 0.5 });
  const [textValue, setTextValue] = useState('');
  const [editingText, setEditingText] = useState<any>(null);
  const [textColor, setTextColor] = useState('#ffffff');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShapesMenu, setShowShapesMenu] = useState(false);

  const [polygonSides, setPolygonSides] = useState(6);
  const [showApothem, setShowApothem] = useState(false);
  const [isDashed, setIsDashed] = useState(false);

  const [theme, setTheme] = useState('dark');

  const [selectedStroke, setSelectedStroke] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const shapes = [
    { id: 'square', icon: '□', name: 'Quadrado', key: 'W' },
    { id: 'rectangle', icon: '▭', name: 'Retângulo', key: 'Q' },
    { id: 'circle', icon: '○', name: 'Círculo', key: 'C' },
    { id: 'diamond', icon: '◇', name: 'Losango', key: 'D' },
    { id: 'polygon', icon: '⬡', name: 'Polígono', key: 'F' }
  ];

  const getCurrentShapeIcon = () => {
    const shape = shapes.find(s => s.id === tool);
    return shape ? shape.icon : '▭';
  };

  const themeColors = {
    dark: {
      bg: 'from-slate-950 via-slate-900 to-slate-950',
      toolbar: 'bg-slate-900/80 backdrop-blur-2xl border-slate-800/50',
      border: 'border-slate-800/50',
      text: 'text-slate-50',
      textMuted: 'text-slate-400',
      buttonActive: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-500/50',
      buttonInactive: 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 backdrop-blur-xl',
      card: 'bg-slate-900/90 backdrop-blur-2xl',
      cardBorder: 'border-slate-800/50'
    },
    light: {
      bg: 'from-slate-50 via-white to-slate-100',
      toolbar: 'bg-white/80 backdrop-blur-2xl border-slate-200/60',
      border: 'border-slate-200/60',
      text: 'text-slate-900',
      textMuted: 'text-slate-500',
      buttonActive: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/50',
      buttonInactive: 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 backdrop-blur-xl',
      card: 'bg-white/90 backdrop-blur-2xl',
      cardBorder: 'border-slate-200/60'
    }
  };

  const t = themeColors[theme as keyof typeof themeColors];

  const isPointInStroke = useCallback((point: any, stroke: any) => {
    if (stroke.tool === 'text' && stroke.text) {
      const lines = stroke.text.split('\n');
      const longestLine = lines.reduce((max: string, line: string) => line.length > max.length ? line : max, '');
      const textWidth = Math.max(longestLine.length * stroke.thickness * 5, 50);
      const textHeight = lines.length * stroke.thickness * 10;
      return point.x >= stroke.points[0].x - 5 &&
             point.x <= stroke.points[0].x + textWidth + 5 &&
             point.y >= stroke.points[0].y - textHeight &&
             point.y <= stroke.points[0].y + 10;
    }

    if (['rectangle', 'square'].includes(stroke.tool) && stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);
      const margin = 10;
      return point.x >= minX - margin && point.x <= maxX + margin &&
             point.y >= minY - margin && point.y <= maxY + margin;
    }

    if (stroke.tool === 'circle' && stroke.points.length >= 2) {
      const center = stroke.points[0];
      const radiusStroke = distance(center, stroke.points[stroke.points.length - 1]);
      const dist = distance(point, center);
      return Math.abs(dist - radiusStroke) < 15;
    }

    if (['line', 'arrow'].includes(stroke.tool) && stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      const lineDist = Math.abs((end.y - start.y) * point.x - (end.x - start.x) * point.y + end.x * start.y - end.y * start.x) / 
                       Math.sqrt(Math.pow(end.y - start.y, 2) + Math.pow(end.x - start.x, 2));
      return lineDist < 15;
    }

    if (stroke.tool === 'diamond' && stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      const centerX = (start.x + end.x) / 2;
      const centerY = (start.y + end.y) / 2;
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      return point.x >= centerX - width/2 - 10 && point.x <= centerX + width/2 + 10 &&
             point.y >= centerY - height/2 - 10 && point.y <= centerY + height/2 + 10;
    }

    if (stroke.tool === 'polygon' && stroke.points.length >= 2) {
      const center = stroke.points[0];
      const dist = distance(point, center);
      const radiusStroke = distance(center, stroke.points[stroke.points.length - 1]);
      return Math.abs(dist - radiusStroke) < 15;
    }

    return stroke.points.some((p: any) => distance(p, point) < 15);
  }, []);

  const getPoint = useCallback((e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const p = e.pressure || (e.pointerType === 'pen' ? 0.7 : 0.5);

    const x = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
    const y = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
    
    return {
      x,
      y,
      pressure: Math.max(0.3, Math.min(1, p))
    };
  }, [canvasOffset, canvasScale]);

  const start = useCallback((e: any) => {
    if (!isActive) return;
    e.preventDefault();
    const point = getPoint(e);

    if (tool === 'select') {
      for (let i = strokes.length - 1; i >= 0; i--) {
        if (isPointInStroke(point, strokes[i])) {
          setSelectedStroke(strokes[i]);
          setIsDragging(true);
          if (strokes[i].tool === 'text') {
            setDragOffset({ x: point.x - strokes[i].points[0].x, y: point.y - strokes[i].points[0].y });
          } else if (['rectangle', 'square', 'circle', 'diamond', 'polygon', 'line', 'arrow'].includes(strokes[i].tool)) {
            setDragOffset({ x: point.x - strokes[i].points[0].x, y: point.y - strokes[i].points[0].y });
          }
          return;
        }
      }
      setSelectedStroke(null);
      return;
    }

    if (tool === 'eraser') {
      for (let i = strokes.length - 1; i >= 0; i--) {
        if (isPointInStroke(point, strokes[i])) {
          setStrokes(prev => prev.filter((_, index) => index !== i));
          return;
        }
      }
      return;
    }

    if (tool === 'laser') {
      if (laserMode === 'pointer') {
        setLaserPoint(point);
        return;
      } else {
        setCurrent({
          id: Date.now().toString(),
          tool: 'laser-pen',
          points: [point],
          color: laserColor,
          thickness: 3,
          opacity: 0.8,
          timestamp: Date.now()
        });
        setIsDrawing(true);
        return;
      }
    }

    if (tool === 'text') {
      const clickedText = strokes.find(stroke => 
        stroke.tool === 'text' && 
        stroke.points[0] && 
        Math.abs(stroke.points[0].x - point.x) < 50 && 
        Math.abs(stroke.points[0].y - point.y) < 50
      );
      
      if (clickedText) {
        setEditingText(clickedText);
        setTextValue(clickedText.text || '');
        setTextPosition(clickedText.points[0]);
        setTextColor(clickedText.color);
        setShowTextInput(true);
        setTimeout(() => {
          if (textInputRef.current) textInputRef.current.focus();
        }, 10);
        return;
      }
      
      setTextPosition(point);
      setTextValue('');
      setTextColor(color);
      setEditingText(null);
      setShowTextInput(true);
      setTimeout(() => {
        if (textInputRef.current) textInputRef.current.focus();
      }, 10);
      return;
    }

    setCurrent({
      id: Date.now().toString(),
      tool,
      points: [point],
      color,
      thickness,
      opacity,
      sides: polygonSides,
      showApothem: showApothem,
      dashed: isDashed
    });
    setIsDrawing(true);
  }, [isActive, tool, color, thickness, opacity, getPoint, polygonSides, showApothem, isDashed, strokes, isPointInStroke, laserMode, laserColor]);
    
  const move = useCallback((e: any) => {
    const point = getPoint(e);

    if (tool === 'select' && isDragging && selectedStroke) {
      const newX = point.x - dragOffset.x;
      const newY = point.y - dragOffset.y;

      setStrokes(prev => prev.map(stroke => {
        if (stroke.id === selectedStroke.id) {
          if (stroke.tool === 'text') {
            return { ...stroke, points: [{ ...stroke.points[0], x: newX, y: newY }] };
          } else if (['rectangle', 'square', 'circle', 'diamond', 'polygon', 'line', 'arrow'].includes(stroke.tool)) {
            const deltaX = newX - stroke.points[0].x;
            const deltaY = newY - stroke.points[0].y;
            return { ...stroke, points: stroke.points.map((p: any) => ({ ...p, x: p.x + deltaX, y: p.y + deltaY })) };
          } else {
            const deltaX = newX - stroke.points[0].x;
            const deltaY = newY - stroke.points[0].y;
            return { ...stroke, points: stroke.points.map((p: any) => ({ ...p, x: p.x + deltaX, y: p.y + deltaY })) };
          }
        }
        return stroke;
      }));

      setSelectedStroke(prev => {
        if (prev.tool === 'text') {
          return { ...prev, points: [{ ...prev.points[0], x: newX, y: newY }] };
        } else if (['rectangle', 'square', 'circle', 'diamond', 'polygon', 'line', 'arrow'].includes(prev.tool)) {
          const deltaX = newX - prev.points[0].x;
          const deltaY = newY - prev.points[0].y;
          return { ...prev, points: prev.points.map((p: any) => ({ ...p, x: p.x + deltaX, y: p.y + deltaY })) };
        } else {
          const deltaX = newX - prev.points[0].x;
          const deltaY = newY - prev.points[0].y;
          return { ...prev, points: prev.points.map((p: any) => ({ ...p, x: p.x + deltaX, y: p.y + deltaY })) };
        }
      });
      return;
    }

    if (tool === 'laser' && laserMode === 'pointer') {
      setLaserPoint(point);
      return;
    }

    if (!isDrawing || !current) return;
    e.preventDefault();
    const now = performance.now();
    if (now - lastTimeRef.current < FRAME_TIME) return;
    lastTimeRef.current = now;
    
    if (['rectangle', 'square', 'circle', 'diamond', 'polygon', 'line', 'arrow'].includes(tool)) {
      setCurrent((c: any) => c ? { ...c, points: [c.points[0], point] } : null);
      return;
    }
    
    const last = current.points[current.points.length - 1];
    if (distance(last, point) < MIN_DISTANCE) return;
    setCurrent((c: any) => c ? { ...c, points: [...c.points, point] } : null);
  }, [isDrawing, current, getPoint, tool, laserMode, isDragging, selectedStroke, dragOffset]);

  const stop = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }

    if (tool === 'laser') {
      if (laserMode === 'pointer') {
        setLaserPoint(null);
      } else if (current && current.tool === 'laser-pen' && current.points.length > 0) {
        setTemporaryStrokes(prev => [...prev, current]);
      }
      setCurrent(null);
      setIsDrawing(false);
      return;
    }

    if (!isDrawing || !current) return;
    if (current.points.length > 0) {
      setStrokes(prev => [...prev, current]);
    }
    setCurrent(null);
    setIsDrawing(false);
  }, [isDrawing, current, tool, laserMode, isDragging]);

  const handleTextSubmit = useCallback(() => {
    if (textValue.trim()) {
      if (editingText) {
        setStrokes(prev => prev.map(stroke => 
          stroke.id === editingText.id 
            ? { ...stroke, text: textValue, color: textColor, points: [textPosition] }
            : stroke
        ));
      } else {
        setStrokes(prev => [...prev, {
          id: Date.now().toString(),
          tool: 'text',
          points: [textPosition],
          color: textColor,
          thickness,
          opacity,
          text: textValue
        }]);
      }
    }
    setShowTextInput(false);
    setTextValue('');
    setEditingText(null);
  }, [textValue, textPosition, textColor, thickness, opacity, editingText]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = theme === 'dark' ? `rgba(255, 255, 255, ${gridOpacity})` : `rgba(0, 0, 0, ${gridOpacity})`;
      ctx.lineWidth = 1;

      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.restore();
    }
    
    ctx.save();
    ctx.translate(canvasOffset.x, canvasOffset.y);
    ctx.scale(canvasScale, canvasScale);
    
    const allStrokes = [...strokes];
    if (current) allStrokes.push(current);

    const now = Date.now();
    temporaryStrokes.forEach(tempStroke => {
      const age = now - tempStroke.timestamp;
      const maxAge = 800;
      if (age < maxAge) {
        const fadeStart = maxAge - 200;
        const opacity = age > fadeStart ? (maxAge - age) / 200 : tempStroke.opacity;
        allStrokes.push({ ...tempStroke, opacity });
      }
    });

    allStrokes.forEach((stroke) => {
      if (!stroke) return;

      if (stroke.tool === 'polygon' && stroke.points.length >= 2) {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        const centerX = start.x;
        const centerY = start.y;
        const radius = distance(start, end);
        const sides = stroke.sides || 6;

        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.thickness;
        ctx.globalAlpha = stroke.opacity;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.dashed) {
          ctx.setLineDash([15, 10]);
        }

        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        if (stroke.showApothem) {
          const angle1 = -Math.PI / 2;
          const angle2 = -Math.PI / 2 + (2 * Math.PI) / sides;
          const x1 = centerX + radius * Math.cos(angle1);
          const y1 = centerY + radius * Math.sin(angle1);
          const x2 = centerX + radius * Math.cos(angle2);
          const y2 = centerY + radius * Math.sin(angle2);
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          ctx.setLineDash([8, 5]);
          ctx.strokeStyle = stroke.color;
          ctx.globalAlpha = stroke.opacity * 0.7;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(midX, midY);
          ctx.stroke();

          ctx.fillStyle = stroke.color;
          ctx.beginPath();
          ctx.arc(midX, midY, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        return;
      }

      if (['rectangle', 'square', 'circle', 'diamond', 'line', 'arrow'].includes(stroke.tool)) {
        if (stroke.points.length < 2) return;
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.thickness;
        ctx.globalAlpha = stroke.opacity;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.dashed) {
          ctx.setLineDash([15, 10]);
        }

        if (stroke.tool === 'rectangle') {
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else if (stroke.tool === 'square') {
          const size = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
          const signX = end.x > start.x ? 1 : -1;
          const signY = end.y > start.y ? 1 : -1;
          ctx.strokeRect(start.x, start.y, size * signX, size * signY);
        } else if (stroke.tool === 'circle') {
          ctx.beginPath();
          ctx.arc(start.x, start.y, distance(start, end), 0, Math.PI * 2);
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
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }
        ctx.restore();
        return;
      }

      if (stroke.tool === 'text' && stroke.text) {
        ctx.save();
        ctx.fillStyle = stroke.color;
        ctx.font = stroke.thickness * 8 + 'px "Comic Sans MS", "Segoe Print", "Bradley Hand", cursive';
        ctx.globalAlpha = stroke.opacity;
        const lines = stroke.text.split('\n');
        lines.forEach((line: string, i: number) => {
          ctx.fillText(line, stroke.points[0].x, stroke.points[0].y + (i * stroke.thickness * 10));
        });
        ctx.restore();
        return;
      }

      if (stroke.points.length < 2) return;
      
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.color;
      ctx.globalAlpha = stroke.opacity;

      if (stroke.tool === 'laser-pen') {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.lineWidth = stroke.thickness;
        ctx.stroke();
        ctx.restore();
        return;
      }
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        const prevPoint = stroke.points[i - 1];
        
        const midX = (prevPoint.x + point.x) / 2;
        const midY = (prevPoint.y + point.y) / 2;
        
        ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, midY);
      }
      
      if (stroke.points.length > 1) {
        const lastPoint = stroke.points[stroke.points.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
      }

      const avgPressure = stroke.points.reduce((sum: number, p: any) => sum + p.pressure, 0) / stroke.points.length;
      ctx.lineWidth = stroke.thickness * (0.7 + avgPressure * 0.6);
      ctx.stroke();
      ctx.restore();
    });

    if (laserPoint) {
      ctx.save();
      const gradient = ctx.createRadialGradient(laserPoint.x, laserPoint.y, 0, laserPoint.x, laserPoint.y, 25);
      if (laserColor === '#ff0000') {
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      } else if (laserColor === '#ffff00') {
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(0, 100, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(laserPoint.x, laserPoint.y, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = laserColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(laserPoint.x, laserPoint.y, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (selectedStroke) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      if (selectedStroke.tool === 'text' && selectedStroke.text) {
        const lines = selectedStroke.text.split('\n');
        const longestLine = lines.reduce((max: string, line: string) => line.length > max.length ? line : max, '');
        const textWidth = longestLine.length * selectedStroke.thickness * 5;
        const textHeight = lines.length * selectedStroke.thickness * 10;
        ctx.strokeRect(selectedStroke.points[0].x - 5, selectedStroke.points[0].y - textHeight, textWidth + 10, textHeight + 10);
      } else if (['rectangle', 'square'].includes(selectedStroke.tool) && selectedStroke.points.length >= 2) {
        const start = selectedStroke.points[0];
        const end = selectedStroke.points[selectedStroke.points.length - 1];
        ctx.strokeRect(Math.min(start.x, end.x) - 5, Math.min(start.y, end.y) - 5, 
                      Math.abs(end.x - start.x) + 10, Math.abs(end.y - start.y) + 10);
      } else if (selectedStroke.tool === 'circle' && selectedStroke.points.length >= 2) {
        const center = selectedStroke.points[0];
        const radius = distance(center, selectedStroke.points[selectedStroke.points.length - 1]);
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.restore();
    }

    ctx.restore();
  }, [strokes, current, theme, canvasOffset, canvasScale, isActive, laserPoint, laserColor, temporaryStrokes, showGrid, gridSize, gridOpacity, selectedStroke]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    if (temporaryStrokes.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setTemporaryStrokes(prev => prev.filter(stroke => now - stroke.timestamp < 800));
    }, 100);

    return () => clearInterval(interval);
  }, [temporaryStrokes]);

  useEffect(() => {
    if (tool === 'highlighter') {
      setOpacity(0.3);
    } else if (opacity === 0.3 && tool !== 'highlighter') {
      setOpacity(1);
    }
  }, [tool]);

  return (
    <div className={`w-full h-screen bg-transparent flex flex-col relative overflow-hidden ${className}`} style={{ zIndex: isActive ? 10 : 5, backgroundColor: 'transparent', marginTop: 0, paddingTop: 0, marginBottom: 0, paddingBottom: 0, top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className={`${t.toolbar} border-b ${t.border} shadow-2xl shadow-black/5 ${isActive ? 'bg-opacity-90' : 'bg-opacity-30'} pointer-events-auto`} style={{ zIndex: 20, marginTop: 0, paddingTop: 0, top: 0 }}>
        <div className="px-6 py-2 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className={`${t.text} font-semibold text-base tracking-tight`}>
              {tr('tablet.name')}
            </div>

            <div className={`h-5 w-px ${t.border}`}></div>

            <button
              onClick={() => {
                console.log('🎨 Switch Mesa Digitalizadora clicado - isActive atual:', isActive);
                onToggle();
                console.log('🎨 Novo valor isActive:', !isActive);
              }}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                isActive ? 'bg-blue-600 shadow-lg shadow-blue-600/30' : 'bg-slate-600/50'
              }`}
              title="Ativar/Desativar"
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${
                isActive ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg ${t.buttonInactive} transition-all duration-200 hover:scale-105`}
              title="Tema"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'pen', icon: '✒️', name: 'Caneta (P)' },
              { id: 'pencil', icon: '✏️', name: 'Lápis (L)' },
              { id: 'highlighter', icon: '🖍️', name: 'Marca-texto (H)' },
              { id: 'eraser', icon: '🧹', name: 'Borracha (E)' },
              { id: 'select', icon: '↖️', name: 'Selecionar (V)' }
            ].map(tt => (
              <button
                key={tt.id}
                onClick={() => {
                  if (tt.id === 'select' && tool === 'select') {
                    setTool('pen');
                    setSelectedStroke(null);
                  } else {
                    setTool(tt.id);
                    if (tt.id !== 'select') {
                      setSelectedStroke(null);
                    }
                  }
                }}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${tool === tt.id ? t.buttonActive : t.buttonInactive}`}
                title={tt.name}
              >
                {tt.icon}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setTool('text')}
              className={`px-2 py-1 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 ${tool === 'text' ? t.buttonActive : t.buttonInactive}`}
              title="Texto (T)"
            >
              Aa
            </button>

            <div className="relative">
              <button
                onClick={() => setShowShapesMenu(s => !s)}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-1 ${(['square', 'rectangle', 'circle', 'diamond', 'polygon'].includes(tool) ? t.buttonActive : t.buttonInactive)}`}
                title="Formas"
              >
                <span className="text-base">{getCurrentShapeIcon()}</span>
                <span className="text-xs">▼</span>
              </button>

              {showShapesMenu && (
                <div className={`absolute top-full mt-2 left-0 ${t.card} border ${t.cardBorder} rounded-xl shadow-2xl z-50 p-3 min-w-[280px]`}>
                  <div className={`flex items-center justify-between mb-2 pb-2 border-b ${t.border}`}>
                    <div className={`${t.text} font-semibold text-sm`}>Formas</div>
                    <button onClick={() => setShowShapesMenu(false)} className="text-slate-400 hover:text-slate-200 text-sm">✕</button>
                  </div>

                  <div className="space-y-1">
                    {shapes.map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => { setTool(shape.id); setShowShapesMenu(false); }}
                        className={`w-full rounded-lg p-2 flex items-center gap-2 transition-all duration-200 ${
                          tool === shape.id ? 'bg-blue-600 text-white' : (theme === 'dark' ? 'bg-slate-800/40 hover:bg-slate-800/70' : 'bg-slate-50 hover:bg-slate-100') + ' ' + t.text
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xl ${
                          tool === shape.id ? 'bg-white/20' : theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200'
                        }`}>
                          {shape.icon}
                        </div>
                        <div className="flex-1 text-left text-xs font-medium">{shape.name}</div>
                        <kbd className={`px-1 py-0.5 rounded text-xs ${tool === shape.id ? 'bg-white/20' : 'bg-slate-500/20'}`}>{shape.key}</kbd>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setTool('line')} className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${tool === 'line' ? t.buttonActive : t.buttonInactive}`} title="Linha (S)">⎯</button>
            <button onClick={() => setTool('arrow')} className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${tool === 'arrow' ? t.buttonActive : t.buttonInactive}`} title="Seta (A)">→</button>
            <button onClick={() => setTool('laser')} className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${tool === 'laser' ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' : t.buttonInactive}`} title="Laser (K)">◉</button>
            <button onClick={() => setShowGrid(s => !s)} className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${showGrid ? t.buttonActive : t.buttonInactive}`} title="Grade (G)">⊞</button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setStrokes(prev => prev.slice(0, -1))} disabled={strokes.length === 0} className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-105 ${strokes.length === 0 ? 'opacity-40 cursor-not-allowed ' + t.buttonInactive : 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30'}`} title={tr('button.undo')}>↶</button>
            <button onClick={() => setStrokes([])} className="p-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-red-500/30" title={tr('button.clear')}>🗑️</button>
          </div>
        </div>

        <div className={`px-4 py-2 border-t ${t.border} flex items-center gap-3 flex-wrap text-xs`}>
          {tool === 'laser' && (
            <>
              <div className="flex items-center gap-2">
                <span className={`${t.textMuted} font-medium`}>Modo:</span>
                <button onClick={() => setLaserMode('pointer')} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${laserMode === 'pointer' ? t.buttonActive : t.buttonInactive}`}>Ponteiro</button>
                <button onClick={() => setLaserMode('pen')} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${laserMode === 'pen' ? t.buttonActive : t.buttonInactive}`}>Caneta (0.8s)</button>
              </div>
              <div className={`h-4 w-px ${t.border}`}></div>
              <div className="flex items-center gap-2">
                <span className={`${t.textMuted} font-medium`}>{tr('label.color')}</span>
                {[{ color: '#ff0000', name: 'Vermelho' }, { color: '#ffff00', name: 'Amarelo' }, { color: '#0064ff', name: 'Azul' }, { color: '#00ff00', name: 'Verde' }].map(l => (
                  <button key={l.color} onClick={() => setLaserColor(l.color)} className={`w-7 h-7 rounded-lg transition-all duration-200 hover:scale-110 ${laserColor === l.color ? 'ring-2 ring-offset-1 ring-blue-500' : 'ring-1 ring-gray-400'}`} style={{ backgroundColor: l.color }} title={l.name} />
                ))}
              </div>
            </>
          )}

          {tool === 'polygon' && (
            <>
              <div className="flex items-center gap-2">
                <span className={`${t.textMuted} font-medium`}>Lados:</span>
                <input type="range" min="3" max="12" value={polygonSides} onChange={(e) => setPolygonSides(parseInt(e.target.value))} className="w-20" />
                <span className={`${t.text} font-semibold w-6`}>{polygonSides}</span>
                <button onClick={() => setShowApothem(s => !s)} className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${showApothem ? t.buttonActive : t.buttonInactive}`}>Apótema</button>
              </div>
              <div className={`h-4 w-px ${t.border}`}></div>
            </>
          )}

          {(['line', 'arrow', 'square', 'rectangle', 'circle', 'diamond', 'polygon'].includes(tool)) && (
            <>
              <button onClick={() => setIsDashed(s => !s)} className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${isDashed ? t.buttonActive : t.buttonInactive}`}>{isDashed ? '⋯ ⋯' : '━━'}</button>
              <div className={`h-4 w-px ${t.border}`}></div>
            </>
          )}

          {showGrid && (
            <>
              <div className="flex items-center gap-2">
                <span className={`${t.textMuted} font-medium`}>Opacidade Grade:</span>
                <input type="range" min="0.05" max="0.5" step="0.05" value={gridOpacity} onChange={(e) => setGridOpacity(parseFloat(e.target.value))} className="w-20" />
                <span className={`${t.text} font-semibold w-8`}>{Math.round(gridOpacity * 100)}%</span>
              </div>
              <div className={`h-4 w-px ${t.border}`}></div>
            </>
          )}

          {tool !== 'laser' && tool !== 'select' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className={`${t.textMuted} font-medium`}>{tr('label.color')}</span>
                {(theme === 'dark' ? QUICK_COLORS_DARK : QUICK_COLORS_LIGHT).map(c => (
                  <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-lg transition-all duration-200 hover:scale-110 ${color === c ? 'ring-2 ring-offset-1 ring-blue-500' : 'ring-1 ring-gray-300'}`} style={{ backgroundColor: c }} />
                ))}
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 rounded-lg cursor-pointer" />
              </div>

              <div className="flex items-center gap-2">
                <span className={`${t.textMuted} font-medium`}>{tr('label.thickness')}</span>
                <input type="range" min="0.5" max="30" step="0.5" value={thickness} onChange={(e) => setThickness(parseFloat(e.target.value))} className="w-20" />
                <span className={`${t.text} font-semibold w-8`}>{thickness}px</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`${t.textMuted} font-medium`}>{tr('label.opacity')}</span>
                <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-20" />
                <span className={`${t.text} font-semibold w-8`}>{Math.round(opacity * 100)}%</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ pointerEvents: isActive ? 'auto' : 'none', opacity: 1 }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            touchAction: 'none',
            cursor: isActive ? (tool === 'laser' ? 'none' : tool === 'eraser' ? 'pointer' : tool === 'select' ? 'move' : 'crosshair') : 'default',
            pointerEvents: isActive ? 'auto' : 'none',
            opacity: 1
          }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerLeave={stop}
        />

        {showTextInput && (
          <div className={`absolute ${t.card} border-2 border-blue-500 rounded-xl shadow-2xl z-50 p-2`} style={{ left: (textPosition.x * canvasScale + canvasOffset.x) + 'px', top: (textPosition.y * canvasScale + canvasOffset.y) + 'px', minWidth: '200px', maxWidth: '400px' }}>
            <div className="flex gap-1 mb-2">
              {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(c => (
                <button key={c} className={`w-5 h-5 rounded-full border-2 transition-all ${textColor === c ? 'border-white ring-2 ring-white/50 scale-110' : 'border-gray-600 hover:scale-110'}`} style={{ backgroundColor: c }} onClick={() => setTextColor(c)} />
              ))}
            </div>
            <textarea ref={textInputRef} value={textValue} onChange={(e) => setTextValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') { handleTextSubmit(); e.stopPropagation(); } if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); e.stopPropagation(); } }} onBlur={handleTextSubmit} autoFocus className={`w-full px-2 py-1 border-0 outline-none resize-none bg-transparent ${t.text}`} style={{ fontSize: (thickness * 8) + 'px', color: textColor, minHeight: '40px', fontFamily: '"Comic Sans MS", "Segoe Print", "Bradley Hand", cursive' }} placeholder="Digite..." rows={1} />
          </div>
        )}

        <div className={`absolute bottom-4 right-4 ${t.card} border ${t.cardBorder} ${t.text} px-3 py-1.5 rounded-lg shadow-lg text-xs space-y-0.5`}>
          <div className="font-semibold">Página {currentPageIndex + 1}/{pages.length}</div>
          <div className={t.textMuted}>Traços: {strokes.length}</div>
        </div>
      </div>
    </div>
  );
}