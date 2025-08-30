
import { useState } from 'react';
import { WhiteboardState } from '@/types/whiteboard';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';

export const useSharedStateInitialization = (whiteboardId?: string) => {
  const { getWhiteboardState } = useWhiteboardStateContext();
  
  // Initialize state with empty state - persistence will load data if needed
  const [state, setState] = useState<WhiteboardState>(() => {
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
        isSelecting: false
      },
      history: [{
        lines: [], // Start with empty history
        images: [],
        selectionState: {
          selectedObjects: [],
          selectionBounds: null,
          isSelecting: false
        }
      }],
      historyIndex: 0
    };
  });

  return { state, setState };
};
