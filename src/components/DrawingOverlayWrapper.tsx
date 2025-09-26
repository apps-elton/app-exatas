import React from 'react';
import DrawingOverlay3D from './DrawingOverlay3D';
import { DrawingStroke, DrawingStyle, DrawingTool } from './DrawingTablet';

interface DrawingOverlayWrapperProps {
  isTabletActive: boolean;
  drawingStrokes: DrawingStroke[];
  onDrawingChange: (strokes: DrawingStroke[]) => void;
  currentStyle?: DrawingStyle;
  currentTool?: DrawingTool;
  activeTool?: string;
  textSettings?: {
    active: boolean;
    color: string;
    size: number;
    fontFamily: string;
  };
  onTextChange?: (key: string, value: any) => void;
  children: React.ReactNode;
  className?: string;
}

export default function DrawingOverlayWrapper({
  isTabletActive,
  drawingStrokes,
  onDrawingChange,
  currentStyle,
  currentTool,
  activeTool,
  textSettings,
  onTextChange,
  children,
  className = ''
}: DrawingOverlayWrapperProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <DrawingOverlay3D
        isActive={isTabletActive}
        drawingStrokes={drawingStrokes}
        onDrawingChange={onDrawingChange}
        currentStyle={currentStyle}
        currentTool={currentTool}
        activeTool={activeTool}
        textSettings={textSettings}
        onTextChange={onTextChange}
      />
    </div>
  );
}
