
import { useEffect } from 'react';
import { SyncConfig } from '@/types/sync';
import { WhiteboardState } from '@/types/whiteboard';
import { useDataLoader } from '../persistence/useDataLoader';
import { useHistoryReplayOrchestrator } from '../persistence/useHistoryReplayOrchestrator';
import { useStateContextSync } from '../persistence/useStateContextSync';
import { useDataValidationRecovery } from '../persistence/useDataValidationRecovery';
import { useComponentStabilization } from '../performance/useComponentStabilization';
import { persistenceLogger } from '@/utils/logging/persistenceLogger';

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
  
  // Data validation and recovery
  const { 
    validateState, 
    validateStateTransition, 
    attemptRecovery, 
    updateValidStateBackup 
  } = useDataValidationRecovery(whiteboardId);
  
  // Component stabilization
  const { 
    preserveState, 
    restorePreservedState, 
    setLoadingState, 
    shouldSkipOperation 
  } = useComponentStabilization('PersistenceIntegration', whiteboardId);

  // Update state when persisted data is loaded, but only once on initial load
  useEffect(() => {
    if (!persistence.isLoading && persistence.lines && !hasLoadedInitialData.current) {
      // Check if we should skip this operation due to instability
      if (shouldSkipOperation('data_load')) {
        persistenceLogger.logStabilityIssue(
          whiteboardId || 'unknown',
          'PersistenceIntegration',
          'loading_timeout',
          { reason: 'Component instability detected during data load' }
        );
        return;
      }

      setLoadingState(true, 'Loading persisted data');
      
      // Log data loading
      persistenceLogger.logDataLoad(
        whiteboardId || 'unknown',
        'persistence',
        persistence.lines.length,
        persistence.images?.length || 0,
        persistence.orderedOperations?.length
      );
      
      console.log(`[PersistenceIntegration] Loaded ${persistence.lines.length} lines and ${persistence.images?.length || 0} images from persistence for ${whiteboardId}`);
      console.log(`[PersistenceIntegration] Found ${persistence.orderedOperations?.length || 0} operations for history replay`);
      
      setState(prevState => {
        // Preserve current state before transition
        preserveState(prevState);
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
            
            const newState = {
              ...prevState,
              lines: uniqueLines,
              images: uniqueImages,
              history: [...historyStack], // Use the correctly simulated history stack
              historyIndex: finalHistoryIndex // Use the correct history index
            };

            // Validate state transition
            if (!validateStateTransition(prevState, newState)) {
              console.warn(`[PersistenceIntegration] State transition validation failed for ${whiteboardId}`);
              
              // Attempt recovery
              const recoveredState = attemptRecovery(newState);
              if (recoveredState) {
                persistenceLogger.logRecovery(whiteboardId || 'unknown', true, {
                  lines: recoveredState.lines.length,
                  images: recoveredState.images.length
                }, 'history_replay_recovery');
                
                updateValidStateBackup(recoveredState);
                return recoveredState;
              }
            } else {
              // Update valid state backup
              updateValidStateBackup(newState);
            }

            // Log merge operation
            persistenceLogger.logDataMerge(
              whiteboardId || 'unknown',
              { lines: prevState.lines.length, images: prevState.images.length },
              { lines: uniqueLines.length, images: uniqueImages.length },
              { 
                lines: mergedLines.length - uniqueLines.length, 
                images: mergedImages.length - uniqueImages.length 
              }
            );
            
            return newState;
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
            
            const newState = {
              ...finalState,
              lines: uniqueLines,
              images: uniqueImages,
              history: historyStack,
              historyIndex: finalHistoryIndex
            };

            // Validate fallback state transition
            if (!validateStateTransition(prevState, newState)) {
              console.warn(`[PersistenceIntegration] Fallback state transition validation failed for ${whiteboardId}`);
              
              // Attempt recovery
              const recoveredState = attemptRecovery(newState);
              if (recoveredState) {
                persistenceLogger.logRecovery(whiteboardId || 'unknown', true, {
                  lines: recoveredState.lines.length,
                  images: recoveredState.images.length
                }, 'fallback_recovery');
                
                updateValidStateBackup(recoveredState);
                return recoveredState;
              }
            } else {
              // Update valid state backup
              updateValidStateBackup(newState);
            }

            // Log fallback merge operation
            persistenceLogger.logDataMerge(
              whiteboardId || 'unknown',
              { lines: prevState.lines.length, images: prevState.images.length },
              { lines: uniqueLines.length, images: uniqueImages.length },
              { 
                lines: mergedLines.length - uniqueLines.length, 
                images: mergedImages.length - uniqueImages.length 
              }
            );
            
            return newState;
          }
      });
      
      // Also update the shared state context with both lines and images
      updateContextOnLoad(whiteboardId || '', persistence.lines, persistence.images || [], state.lines.length > 0 || state.images.length > 0);
      
      setLoadingState(false, 'Data loading completed');
    }
  }, [persistence.isLoading, persistence.lines, persistence.images, persistence.lastActivity, persistence.orderedOperations, whiteboardId, setState, state.lines.length, processHistoryReplay, processFallbackLoad, updateContextOnLoad, setInitialLineCount, shouldSkipOperation, setLoadingState, preserveState, validateStateTransition, attemptRecovery, updateValidStateBackup]);

  return { persistence };
};
