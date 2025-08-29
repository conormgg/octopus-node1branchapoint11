
import React, { createContext, useContext, useState, useCallback } from 'react';
import { LineObject, ImageObject } from '@/types/whiteboard';
import { persistenceLogger } from '@/utils/logging/persistenceLogger';

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
  validateContextIntegrity: (whiteboardId: string) => boolean;
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
      
      // Validate incoming data
      const validLines = lines.filter(line => line && line.id && line.points && Array.isArray(line.points));
      const validImages = images.filter(img => img && img.id && img.src);
      
      if (validLines.length !== lines.length || validImages.length !== images.length) {
        persistenceLogger.log(whiteboardId, 'invalid_data_filtered', {
          originalLines: lines.length,
          validLines: validLines.length,
          originalImages: images.length,
          validImages: validImages.length
        }, 'warning');
      }
      
      // Merge with existing state to prevent data loss
      const mergedLines = [...validLines];
      const mergedImages = [...validImages];
      
      // Deduplicate by ID
      const uniqueLines = mergedLines.filter((line, index, arr) => 
        arr.findIndex(l => l.id === line.id) === index
      );
      const uniqueImages = mergedImages.filter((img, index, arr) => 
        arr.findIndex(i => i.id === img.id) === index
      );
      
      // Log context update
      persistenceLogger.log(whiteboardId, 'context_updated', {
        beforeCount: { lines: existingState.lines.length, images: existingState.images.length },
        afterCount: { lines: uniqueLines.length, images: uniqueImages.length },
        duplicatesRemoved: { 
          lines: mergedLines.length - uniqueLines.length, 
          images: mergedImages.length - uniqueImages.length 
        }
      });
      
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
      const removedState = prev[whiteboardId];
      if (removedState) {
        persistenceLogger.log(whiteboardId, 'context_cleared', {
          clearedCount: { lines: removedState.lines.length, images: removedState.images.length }
        });
      }
      
      const { [whiteboardId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const validateContextIntegrity = useCallback((whiteboardId: string): boolean => {
    const state = stateStore[whiteboardId];
    if (!state) return true; // Empty state is valid
    
    const hasValidLines = Array.isArray(state.lines) && state.lines.every(line => 
      line && line.id && line.points && Array.isArray(line.points)
    );
    
    const hasValidImages = Array.isArray(state.images) && state.images.every(img => 
      img && img.id && img.src
    );
    
    const isValid = hasValidLines && hasValidImages;
    
    if (!isValid) {
      persistenceLogger.logValidation(whiteboardId, isValid, [
        !hasValidLines ? 'Invalid lines detected' : '',
        !hasValidImages ? 'Invalid images detected' : ''
      ].filter(Boolean), false);
    }
    
    return isValid;
  }, [stateStore]);

  return (
    <WhiteboardStateContext.Provider value={{
      getWhiteboardState,
      updateWhiteboardState,
      clearWhiteboardState,
      validateContextIntegrity
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
