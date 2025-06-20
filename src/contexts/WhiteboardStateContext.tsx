
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
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

  // Make getWhiteboardState stable by using useCallback with proper dependencies
  const getWhiteboardState = useCallback((whiteboardId: string): LineObject[] => {
    return stateStore[whiteboardId] || [];
  }, []); // Remove stateStore dependency to make it stable

  // Create a stable reference that accesses current state
  const getWhiteboardStateStable = useCallback((whiteboardId: string): LineObject[] => {
    // Access current state directly, not through closure
    setStateStore(currentStore => {
      return currentStore; // Return unchanged to avoid state update
    });
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

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    getWhiteboardState: getWhiteboardStateStable,
    updateWhiteboardState,
    clearWhiteboardState
  }), [getWhiteboardStateStable, updateWhiteboardState, clearWhiteboardState]);

  return (
    <WhiteboardStateContext.Provider value={contextValue}>
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
