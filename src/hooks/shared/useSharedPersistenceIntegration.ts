
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
        // Load persisted data and merge with current state to prevent data loss
        console.log(`[PersistenceIntegration] Merging persisted data for ${whiteboardId}. Current: ${prevState.lines.length} lines, ${prevState.images.length} images. Persisted: ${persistence.lines.length} lines, ${persistence.images?.length || 0} images`);
        
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
            
            // Merge persisted and current state with deduplication
            const mergedLines = [...prevState.lines, ...finalState.lines];
            const mergedImages = [...prevState.images, ...finalState.images];
            
            const uniqueLines = mergedLines.filter((line, index, arr) => 
              arr.findIndex(l => l.id === line.id) === index
            );
            const uniqueImages = mergedImages.filter((img, index, arr) => 
              arr.findIndex(i => i.id === img.id) === index
            );
            
            return {
              ...prevState,
              lines: uniqueLines,
              images: uniqueImages,
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
            
            // Merge fallback data with current state
            const mergedLines = [...prevState.lines, ...finalState.lines];
            const mergedImages = [...prevState.images, ...finalState.images];
            
            const uniqueLines = mergedLines.filter((line, index, arr) => 
              arr.findIndex(l => l.id === line.id) === index
            );
            const uniqueImages = mergedImages.filter((img, index, arr) => 
              arr.findIndex(i => i.id === img.id) === index
            );
            
            return {
              ...finalState,
              lines: uniqueLines,
              images: uniqueImages,
              history: historyStack,
              historyIndex: finalHistoryIndex
            };
          }
      });
      
      // Also update the shared state context with both lines and images
      updateContextOnLoad(whiteboardId || '', persistence.lines, persistence.images || [], state.lines.length > 0 || state.images.length > 0);
    }
  }, [persistence.isLoading, persistence.lines, persistence.images, persistence.lastActivity, persistence.orderedOperations, whiteboardId, setState, state.lines.length, processHistoryReplay, processFallbackLoad, updateContextOnLoad, setInitialLineCount]);

  return { persistence };
};
