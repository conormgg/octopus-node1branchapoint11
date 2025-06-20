
import { useState, useMemo } from 'react';
import { WhiteboardState } from '@/types/whiteboard';

export const useSharedStateInitialization = (whiteboardId?: string) => {
  // Create a stable initial state that doesn't depend on external functions
  const initialState = useMemo<WhiteboardState>(() => {
    console.log(`[StateInit] Initializing whiteboard ${whiteboardId} with empty state - persistence will load data if available`);
    
    return {
      lines: [], // Start with empty lines - persistence will populate if needed
      images: [],
      currentTool: 'pencil',
      currentColor: '#000000',
      currentStrokeWidth: 5,
      pencilSettings: {
        color: '#000000',
        strokeWidth: 5
      },
      highlighterSettings: {
        color: '#FFFF00',
        strokeWidth: 12
      },
      isDrawing: false,
      panZoomState: { x: 0, y: 0, scale: 1 },
      selectionState: {
        selectedObjects: [],
        selectionBounds: null,
        isSelecting: false,
        transformationData: {}
      },
      history: [{
        lines: [], // Start with empty history
        images: [],
        selectionState: {
          selectedObjects: [],
          selectionBounds: null,
          isSelecting: false,
          transformationData: {}
        }
      }],
      historyIndex: 0
    };
  }, [whiteboardId]); // Only depend on whiteboardId

  const [state, setState] = useState<WhiteboardState>(initialState);

  return { state, setState };
};
