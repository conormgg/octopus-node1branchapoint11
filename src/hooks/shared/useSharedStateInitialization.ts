
import { useState } from 'react';
import { WhiteboardState } from '@/types/whiteboard';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';

export const useSharedStateInitialization = (whiteboardId?: string) => {
  const { getWhiteboardState } = useWhiteboardStateContext();
  
  // Initialize state with context data or empty state - persistence will load data if needed
  const [state, setState] = useState<WhiteboardState>(() => {
    const contextState = whiteboardId ? getWhiteboardState(whiteboardId) : { lines: [], images: [] };
    console.log(`[StateInit] Initializing whiteboard ${whiteboardId} with context state: ${contextState.lines.length} lines, ${contextState.images.length} images`);
    
    return {
      lines: [...contextState.lines], // Start with context data if available
      images: [...contextState.images], // Include images from context
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
        lines: [...contextState.lines], // Start with context history
        images: [...contextState.images],
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
