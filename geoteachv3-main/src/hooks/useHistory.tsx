import { useState, useCallback } from 'react';

interface HistoryState {
  id: string;
  timestamp: number;
  action: string;
  data: any;
}

export function useHistory(maxHistorySize: number = 3) {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const addToHistory = useCallback((action: string, data: any) => {
    const newState: HistoryState = {
      id: `action-${Date.now()}`,
      timestamp: Date.now(),
      action,
      data
    };

    setHistory(prev => {
      const newHistory = [...prev.slice(0, currentIndex + 1), newState];
      
      // Manter apenas os últimos maxHistorySize itens
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize);
      }
      
      return newHistory;
    });

    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, maxHistorySize - 1);
      return newIndex;
    });
  }, [currentIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  const getCurrentState = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return history[currentIndex];
    }
    return null;
  }, [currentIndex, history]);

  return {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getCurrentState,
    historyLength: history.length,
    currentIndex
  };
}

