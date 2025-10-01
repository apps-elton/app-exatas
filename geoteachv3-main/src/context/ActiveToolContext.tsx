import React, { createContext, useContext, useState, ReactNode } from 'react';
import { VisualizationOptions } from '@/types/geometry';

export type ActiveTool = NonNullable<VisualizationOptions['activeTool']>;

interface ActiveToolContextValue {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
}

const ActiveToolContext = createContext<ActiveToolContextValue | undefined>(undefined);

export function ActiveToolProvider({ children, defaultTool = 'none' as ActiveTool }: { children: ReactNode; defaultTool?: ActiveTool }) {
  const [activeTool, setActiveTool] = useState<ActiveTool>(defaultTool);
  return (
    <ActiveToolContext.Provider value={{ activeTool, setActiveTool }}>
      {children}
    </ActiveToolContext.Provider>
  );
}

export function useActiveTool(): ActiveToolContextValue {
  const ctx = useContext(ActiveToolContext);
  if (!ctx) throw new Error('useActiveTool must be used within ActiveToolProvider');
  return ctx;
}



