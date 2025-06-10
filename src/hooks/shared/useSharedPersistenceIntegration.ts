
import { useEffect } from 'react';
import { SyncConfig } from '@/types/sync';
import { WhiteboardState } from '@/types/whiteboard';
import { useWhiteboardPersistence } from '../useWhiteboardPersistence';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';

export const useSharedPersistenceIntegration = (
  state: WhiteboardState,
  setState: (updater: (prev: WhiteboardState) => WhiteboardState) => void,
  syncConfig?: SyncConfig,
  whiteboardId?: string
) => {
  const { updateWhiteboardState } = useWhiteboardStateContext();
  
  // Load persisted whiteboard data if available
  const persistence = syncConfig && whiteboardId ? useWhiteboardPersistence({
    whiteboardId,
    sessionId: syncConfig.sessionId
  }) : { isLoading: false, error: null, lines: [], images: [] };

  // Update state when persisted data is loaded, but only if we don't already have data
  useEffect(() => {
    if (!persistence.isLoading && persistence.lines && persistence.lines.length > 0) {
      setState(prevState => {
        // Only load persisted data if we don't have any lines yet
        // This prevents overriding current state when component remounts
        if (prevState.lines.length === 0) {
          return {
            ...prevState,
            lines: persistence.lines,
            images: persistence.images || [],
            history: [{ 
              lines: persistence.lines, 
              images: persistence.images || [],
              selectionState: {
                selectedObjects: [],
                selectionBounds: null,
                isSelecting: false,
                transformationData: {}
              }
            }, ...prevState.history],
            historyIndex: 0
          };
        }
        return prevState;
      });
      
      // Also update the shared state context if available and we don't have data
      if (whiteboardId && updateWhiteboardState && state.lines.length === 0) {
        updateWhiteboardState(whiteboardId, persistence.lines);
      }
    }
  }, [persistence.isLoading, persistence.lines, persistence.images, whiteboardId, updateWhiteboardState, setState, state.lines.length]);

  // Update shared state whenever lines change
  useEffect(() => {
    if (whiteboardId && updateWhiteboardState) {
      updateWhiteboardState(whiteboardId, state.lines);
    }
  }, [state.lines, whiteboardId, updateWhiteboardState]);

  return { persistence };
};
