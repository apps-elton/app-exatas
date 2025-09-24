import React from 'react';
import DrawingOverlay3D from './DrawingOverlay3D';
import { DrawingStroke, DrawingStyle, DrawingTool } from './DrawingTablet';

interface DrawingOverlayWrapperProps {
  isTabletActive: boolean;
  drawingStrokes: DrawingStroke[];
  onDrawingChange: (strokes: DrawingStroke[]) => void;
  currentStyle?: DrawingStyle;
  currentTool?: DrawingTool;
  children: React.ReactNode;
  className?: string;
}

export default function DrawingOverlayWrapper({
  isTabletActive,
  drawingStrokes,
  onDrawingChange,
  currentStyle,
  currentTool,
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
      />
    </div>
  );
}
