
import React, { createContext, useContext, useState, useCallback } from 'react';
import { LineObject, ImageObject } from '@/types/whiteboard';

interface WhiteboardFullState {
  lines: LineObject[];
  images: ImageObject[];
}

interface WhiteboardStateStore {
  [whiteboardId: string]: WhiteboardFullState;
}

interface WhiteboardStateContextType {
  getWhiteboardState: (whiteboardId: string) => WhiteboardFullState;
  updateWhiteboardState: (whiteboardId: string, lines: LineObject[], images?: ImageObject[]) => void;
  clearWhiteboardState: (whiteboardId: string) => void;
}

const WhiteboardStateContext = createContext<WhiteboardStateContextType | undefined>(undefined);

export const WhiteboardStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stateStore, setStateStore] = useState<WhiteboardStateStore>({});

  const getWhiteboardState = useCallback((whiteboardId: string): WhiteboardFullState => {
    return stateStore[whiteboardId] || { lines: [], images: [] };
  }, [stateStore]);

  const updateWhiteboardState = useCallback((whiteboardId: string, lines: LineObject[], images: ImageObject[] = []) => {
    setStateStore(prev => {
      const existingState = prev[whiteboardId] || { lines: [], images: [] };
      
      // Merge with existing state to prevent data loss
      const mergedLines = [...lines];
      const mergedImages = [...images];
      
      // Deduplicate by ID
      const uniqueLines = mergedLines.filter((line, index, arr) => 
        arr.findIndex(l => l.id === line.id) === index
      );
      const uniqueImages = mergedImages.filter((img, index, arr) => 
        arr.findIndex(i => i.id === img.id) === index
      );
      
      return {
        ...prev,
        [whiteboardId]: {
          lines: uniqueLines,
          images: uniqueImages
        }
      };
    });
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
