
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
    if (!persistence.isLoading && persistence.lines) {
      console.log(`[PersistenceIntegration] Loaded ${persistence.lines.length} lines and ${persistence.images?.length || 0} images from persistence for ${whiteboardId}`);
      
      setState(prevState => {
        // Only load persisted data if we don't have any lines yet
        // This prevents overriding current state when component remounts
        if (prevState.lines.length === 0) {
          console.log(`[PersistenceIntegration] Applying persisted data to state for ${whiteboardId}`);
          
          // Create a new history snapshot with the loaded data
          const newHistory = [{
            lines: [...persistence.lines], 
            images: [...(persistence.images || [])],
            selectionState: {
              selectedObjects: [],
              selectionBounds: null,
              isSelecting: false,
              transformationData: {}
            }
          }];
          
          // Check if we already have history entries and append them
          if (prevState.history.length > 0) {
            newHistory.push(...prevState.history.slice(1));
          }
          
          return {
            ...prevState,
            lines: [...persistence.lines],
            images: [...(persistence.images || [])],
            history: newHistory,
            historyIndex: 0
          };
        }
        return prevState;
      });
      
      // Also update the shared state context if available and we don't have data
      if (whiteboardId && updateWhiteboardState && state.lines.length === 0 && persistence.lines.length > 0) {
        console.log(`[PersistenceIntegration] Updating shared context for ${whiteboardId} with ${persistence.lines.length} lines`);
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
