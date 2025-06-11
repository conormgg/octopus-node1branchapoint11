
import { useState } from 'react';
import { WhiteboardState } from '@/types/whiteboard';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';

export const useSharedStateInitialization = (whiteboardId?: string) => {
  const { getWhiteboardState } = useWhiteboardStateContext();
  
  // Initialize state with shared state if available
  const [state, setState] = useState<WhiteboardState>(() => {
    // First try to get from context (for in-memory state)
    const sharedLines = whiteboardId ? getWhiteboardState(whiteboardId) : [];
    console.log(`[StateInit] Initializing whiteboard ${whiteboardId} with ${sharedLines.length} lines from context`);
    
    return {
      lines: sharedLines,
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
        lines: sharedLines,
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
  });

  return { state, setState };
};
