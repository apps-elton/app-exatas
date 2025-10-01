// ==========================================
// components/DrawingCanvas.tsx - Componente React
// ==========================================

import React, { useRef, useEffect } from 'react';
import { ToolType } from '../types/drawing';
import { useDrawingCanvas } from '../hooks/useDrawingCanvas';

interface DrawingCanvasProps {
  isActive: boolean;
  currentTool: ToolType;
  currentColor: string;
  currentThickness: number;
  smoothingFactor?: number;
  className?: string;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isActive,
  currentTool,
  currentColor,
  currentThickness,
  smoothingFactor = 0.8,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const {
    startDrawing,
    continueDrawing,
    finishDrawing,
    undo,
    clear,
    canUndo
  } = useDrawingCanvas({
    canvasRef,
    isActive,
    currentTool,
    currentColor,
    currentThickness,
    smoothingFactor
  });
  
  // Resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      canvas.width = entry.contentRect.width;
      canvas.height = entry.contentRect.height;
    });
    
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      if (e.key === 'Delete') {
        e.preventDefault();
        clear();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, clear]);
  
  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        touchAction: 'none',
        cursor: isActive ? 'crosshair' : 'default'
      }}
      onPointerDown={isActive ? startDrawing : undefined}
      onPointerMove={isActive ? continueDrawing : undefined}
      onPointerUp={finishDrawing}
      onPointerLeave={finishDrawing}
    />
  );
};