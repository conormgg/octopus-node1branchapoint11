
import React, { createContext, useContext, useState, useCallback } from 'react';
import { LineObject } from '@/types/whiteboard';

interface WhiteboardStateStore {
  [whiteboardId: string]: LineObject[];
}

interface WhiteboardStateContextType {
  getWhiteboardState: (whiteboardId: string) => LineObject[];
  updateWhiteboardState: (whiteboardId: string, lines: LineObject[]) => void;
  clearWhiteboardState: (whiteboardId: string) => void;
}

const WhiteboardStateContext = createContext<WhiteboardStateContextType | undefined>(undefined);

export const WhiteboardStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stateStore, setStateStore] = useState<WhiteboardStateStore>({});

  const getWhiteboardState = useCallback((whiteboardId: string): LineObject[] => {
    return stateStore[whiteboardId] || [];
  }, [stateStore]);

  const updateWhiteboardState = useCallback((whiteboardId: string, lines: LineObject[]) => {
    setStateStore(prev => ({
      ...prev,
      [whiteboardId]: lines
    }));
  }, []);

  const clearWhiteboardState = useCallback((whiteboardId: string) => {
    setStateStore(prev => {
      const { [whiteboardId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  return (
    <WhiteboardStateContext.Provider value={{
      getWhiteboardState,
      updateWhiteboardState,
      clearWhiteboardState
    }}>
      {children}
    </WhiteboardStateContext.Provider>
  );
};

export const useWhiteboardStateContext = () => {
  const context = useContext(WhiteboardStateContext);
  if (context === undefined) {
    throw new Error('useWhiteboardStateContext must be used within a WhiteboardStateProvider');
  }
  return context;
};
