
import { useEffect, useRef } from 'react';
import { SyncConfig } from '@/types/sync';
import { WhiteboardState } from '@/types/whiteboard';
import { useWhiteboardPersistence } from '../useWhiteboardPersistence';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';

export const useSharedPersistenceIntegration = (
  state: WhiteboardState,
  setState: (updater: (prev: WhiteboardState) => WhiteboardState) => void,
  syncConfig?: SyncConfig,
  whiteboardId?: string,
  isApplyingRemoteOperation?: React.MutableRefObject<boolean>
) => {
  const { updateWhiteboardState } = useWhiteboardStateContext();
  
  // Track if we've loaded initial data to prevent re-loading
  const hasLoadedInitialData = useRef(false);
  // Track previous line count to detect deletions
  const previousLineCount = useRef(0);
  // Track if we're currently processing a delete operation
  const isProcessingDelete = useRef(false);
  
  // Load persisted whiteboard data if available
  const persistence = syncConfig && whiteboardId ? useWhiteboardPersistence({
    whiteboardId,
    sessionId: syncConfig.sessionId
  }) : { isLoading: false, error: null, lines: [], images: [] };

  // Update state when persisted data is loaded, but only once on initial load
  useEffect(() => {
    if (!persistence.isLoading && persistence.lines && !hasLoadedInitialData.current) {
      console.log(`[PersistenceIntegration] Loaded ${persistence.lines.length} lines and ${persistence.images?.length || 0} images from persistence for ${whiteboardId}`);
      
      setState(prevState => {
        // Only load persisted data if we don't have any lines yet
        // This prevents overriding current state when component remounts
        if (prevState.lines.length === 0) {
          console.log(`[PersistenceIntegration] Applying persisted data to state for ${whiteboardId}`);
          
          // Mark that we've loaded initial data
          hasLoadedInitialData.current = true;
          previousLineCount.current = persistence.lines.length;
          
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

  // Update shared state only for additions, not deletions (to prevent race condition)
  useEffect(() => {
    if (whiteboardId && updateWhiteboardState && hasLoadedInitialData.current) {
      const currentLineCount = state.lines.length;
      
      // Detect if this is a deletion operation
      if (currentLineCount < previousLineCount.current) {
        console.log(`[PersistenceIntegration] Detected deletion: ${previousLineCount.current} -> ${currentLineCount} lines. NOT updating shared context to prevent race condition.`);
        isProcessingDelete.current = true;
        
        // Clear the delete flag after a short delay
        setTimeout(() => {
          isProcessingDelete.current = false;
        }, 100);
      } else if (currentLineCount > previousLineCount.current && !isProcessingDelete.current) {
        // Only update shared context for additions, not deletions
        console.log(`[PersistenceIntegration] Detected addition: ${previousLineCount.current} -> ${currentLineCount} lines. Updating shared context.`);
        updateWhiteboardState(whiteboardId, state.lines);
      }
      
      // Update the previous count
      previousLineCount.current = currentLineCount;
    }
  }, [state.lines, whiteboardId, updateWhiteboardState]);

  return { persistence };
};
