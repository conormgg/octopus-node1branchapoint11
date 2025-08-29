
import { useState } from 'react';
import { WhiteboardState } from '@/types/whiteboard';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';
import { useComponentStabilization } from '../performance/useComponentStabilization';
import { persistenceLogger } from '@/utils/logging/persistenceLogger';

export const useSharedStateInitialization = (whiteboardId?: string) => {
  const { getWhiteboardState } = useWhiteboardStateContext();
  
  // Component stabilization for state initialization
  const { restorePreservedState } = useComponentStabilization('StateInitialization', whiteboardId);
  
  // Initialize state with context data or empty state - persistence will load data if needed
  const [state, setState] = useState<WhiteboardState>(() => {
    // First try to restore preserved state from previous mount
    const preservedState = restorePreservedState();
    if (preservedState) {
      persistenceLogger.log(
        whiteboardId || 'unknown',
        'state_restored_from_preservation',
        {
          linesCount: preservedState.lines.length,
          imagesCount: preservedState.images.length,
          historyLength: preservedState.history.length
        }
      );
      console.log(`[StateInit] Restored whiteboard ${whiteboardId} from preserved state: ${preservedState.lines.length} lines, ${preservedState.images.length} images`);
      return preservedState;
    }
    // Fallback to context state or empty state
    const contextState = whiteboardId ? getWhiteboardState(whiteboardId) : { lines: [], images: [] };
    console.log(`[StateInit] Initializing whiteboard ${whiteboardId} with context state: ${contextState.lines.length} lines, ${contextState.images.length} images`);
    
    persistenceLogger.log(
      whiteboardId || 'unknown',
      'state_initialized_from_context',
      {
        linesCount: contextState.lines.length,
        imagesCount: contextState.images.length,
        source: 'context'
      }
    );
    
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
