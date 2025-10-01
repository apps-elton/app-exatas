import { useState, useCallback } from 'react';
import { DrawingStroke } from '@/components/DrawingOverlay3D';

interface HistoryState {
  strokes: DrawingStroke[];
  index: number;
}

export function useTabletHistory(maxHistorySize: number = 50) {
  const [history, setHistory] = useState<HistoryState[]>([{ strokes: [], index: 0 }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const addToHistory = useCallback((strokes: DrawingStroke[]) => {
    setHistory(prev => {
      // Remove estados futuros se estamos no meio do histórico
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Adiciona novo estado
      const newState = { strokes: [...strokes], index: newHistory.length };
      newHistory.push(newState);
      
      // Limita o tamanho do histórico
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        return newHistory.map((state, index) => ({ ...state, index }));
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [currentIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1]?.strokes || [];
    }
    return history[currentIndex]?.strokes || [];
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1]?.strokes || [];
    }
    return history[currentIndex]?.strokes || [];
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const currentStrokes = history[currentIndex]?.strokes || [];

  const clearHistory = useCallback(() => {
    setHistory([{ strokes: [], index: 0 }]);
    setCurrentIndex(0);
  }, []);

  return {
    currentStrokes,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historySize: history.length,
    currentIndex
  };
}

