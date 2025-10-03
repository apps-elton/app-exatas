import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Equation {
  id: string;
  latex: string;
  rendered: string;
  position: { x: number; y: number };
}

interface EquationRendererProps {
  equations: Equation[];
  onRemoveEquation: (id: string) => void;
  onMoveEquation: (id: string, position: { x: number; y: number }) => void;
}

export default function EquationRenderer({ 
  equations, 
  onRemoveEquation, 
  onMoveEquation 
}: EquationRendererProps) {
  const handleMouseDown = (e: React.MouseEvent, equation: Equation) => {
    e.preventDefault();
    const startX = e.clientX - equation.position.x;
    const startY = e.clientY - equation.position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;
      onMoveEquation(equation.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      {equations.map((equation) => (
        <Card
          key={equation.id}
          className="absolute bg-background/95 backdrop-blur-sm border border-border/50 p-3 cursor-move min-w-[120px] z-50"
          style={{
            left: equation.position.x,
            top: equation.position.y,
          }}
          onMouseDown={(e) => handleMouseDown(e, equation)}
        >
          <div className="flex items-start justify-between gap-2">
            <div 
              className="equation-preview flex-1 text-base"
              dangerouslySetInnerHTML={{ __html: equation.rendered }}
              style={{ 
                fontFamily: 'Times New Roman, serif',
                lineHeight: '1.4'
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveEquation(equation.id);
              }}
              className="flex-shrink-0 h-6 w-6 p-0 hover:bg-destructive/20"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </Card>
      ))}
    </>
  );
}