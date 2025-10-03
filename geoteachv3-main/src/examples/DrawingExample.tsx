// ==========================================
// examples/DrawingExample.tsx - Exemplo de uso
// ==========================================

import React, { useState } from 'react';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { ToolType } from '../types/drawing';

export const DrawingExample: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentThickness, setCurrentThickness] = useState(2);
  const [smoothingFactor, setSmoothingFactor] = useState(0.8);

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-gray-100 p-4 flex gap-4 items-center">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-4 py-2 rounded ${
            isActive ? 'bg-blue-500 text-white' : 'bg-gray-300'
          }`}
        >
          {isActive ? 'Desativar' : 'Ativar'} Mesa
        </button>
        
        <div className="flex gap-2">
          {(['pen', 'pencil', 'highlighter', 'eraser'] as ToolType[]).map(tool => (
            <button
              key={tool}
              onClick={() => setCurrentTool(tool)}
              className={`px-3 py-1 rounded text-sm ${
                currentTool === tool ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {tool}
            </button>
          ))}
        </div>
        
        <input
          type="color"
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
          className="w-8 h-8 rounded border"
        />
        
        <div className="flex items-center gap-2">
          <label>Espessura:</label>
          <input
            type="range"
            min="1"
            max="10"
            value={currentThickness}
            onChange={(e) => setCurrentThickness(Number(e.target.value))}
            className="w-20"
          />
          <span>{currentThickness}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <label>Suavização:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={smoothingFactor}
            onChange={(e) => setSmoothingFactor(Number(e.target.value))}
            className="w-20"
          />
          <span>{smoothingFactor.toFixed(1)}</span>
        </div>
      </div>
      
      {/* Canvas */}
      <div className="flex-1 relative">
        <DrawingCanvas
          isActive={isActive}
          currentTool={currentTool}
          currentColor={currentColor}
          currentThickness={currentThickness}
          smoothingFactor={smoothingFactor}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};

