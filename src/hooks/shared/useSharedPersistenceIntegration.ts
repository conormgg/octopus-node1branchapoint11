
import { useEffect } from 'react';
import { SyncConfig } from '@/types/sync';
import { WhiteboardState } from '@/types/whiteboard';
import { useDataLoader } from '../persistence/useDataLoader';
import { useHistoryReplayOrchestrator } from '../persistence/useHistoryReplayOrchestrator';
import { useStateContextSync } from '../persistence/useStateContextSync';

export const useSharedPersistenceIntegration = (
  state: WhiteboardState,
  setState: (updater: (prev: WhiteboardState) => WhiteboardState) => void,
  syncConfig?: SyncConfig,
  whiteboardId?: string,
  isApplyingRemoteOperation?: React.MutableRefObject<boolean>
) => {
  // Load data and track loading state
  const { persistence, hasLoadedInitialData } = useDataLoader(syncConfig, whiteboardId);
  
  // Coordinate history replay operations
  const { processHistoryReplay, processFallbackLoad } = useHistoryReplayOrchestrator();
  
  // Manage shared state context synchronization
  const { updateContextOnLoad, setInitialLineCount } = useStateContextSync(state, whiteboardId);

  // Update state when persisted data is loaded, but only once on initial load
  useEffect(() => {
    if (!persistence.isLoading && persistence.lines && !hasLoadedInitialData.current) {
      console.log(`[PersistenceIntegration] Loaded ${persistence.lines.length} lines and ${persistence.images?.length || 0} images from persistence for ${whiteboardId}`);
      console.log(`[PersistenceIntegration] Found ${persistence.orderedOperations?.length || 0} operations for history replay`);
      
      setState(prevState => {
        // Only load persisted data if we don't have any lines yet
        if (prevState.lines.length === 0) {
          console.log(`[PersistenceIntegration] Applying persisted data and replaying history for ${whiteboardId}`);
          
          // Mark that we've loaded initial data
          hasLoadedInitialData.current = true;
          
          // If we have operations to replay, use the pure history replay system
          if (persistence.orderedOperations && persistence.orderedOperations.length > 0) {
            const { finalState, historyStack, finalHistoryIndex } = processHistoryReplay(
              persistence.orderedOperations,
              prevState,
              whiteboardId
            );
            
            // Set the final line count for tracking
            setInitialLineCount(finalState.lines.length);
            
            return {
              ...prevState,
              lines: [...finalState.lines],
              images: [...finalState.images],
              history: [...historyStack], // Use the correctly simulated history stack
              historyIndex: finalHistoryIndex // Use the correct history index
            };
          } else {
            // Fallback to old behavior if no operations available
            const { finalState, historyStack, finalHistoryIndex } = processFallbackLoad(
              persistence,
              prevState,
              whiteboardId
            );
            
            setInitialLineCount(persistence.lines.length);
            
            return {
              ...finalState,
              history: historyStack,
              historyIndex: finalHistoryIndex
            };
          }
        }
        return prevState;
      });
      
      // Also update the shared state context if available and we don't have data
      updateContextOnLoad(whiteboardId || '', persistence.lines, state.lines.length > 0);
    }
  }, [persistence.isLoading, persistence.lines, persistence.images, persistence.lastActivity, persistence.orderedOperations, whiteboardId, setState, state.lines.length, processHistoryReplay, processFallbackLoad, updateContextOnLoad, setInitialLineCount]);

  return { persistence };
};
