
import { useCallback, useRef } from 'react';
import { WhiteboardOperation } from '@/types/sync';
import { applyOperation } from '@/utils/operationSerializer';

export const useRemoteOperationHandler = (
  setState: (updater: (prev: any) => any) => void
) => {
  const isApplyingRemoteOperation = useRef(false);

  // Handle incoming operations from other clients
  const handleRemoteOperation = useCallback((operation: WhiteboardOperation) => {
    console.log(`[RemoteOperationHandler] Processing operation: ${operation.operation_type} from sender: ${operation.sender_id}`);
    
    isApplyingRemoteOperation.current = true;
    
    setState(prev => {
      // First, make sure we have the original state saved to apply the operation to
      const originalState = {
        lines: [...prev.lines],
        images: [...prev.images]
      };
      
      // Apply the operation to get the updated state
      const updatedState = applyOperation(originalState, operation);
      
      console.log(`[RemoteOperationHandler] State updated - Lines: ${prev.lines.length} -> ${updatedState.lines.length}, Images: ${prev.images.length} -> ${updatedState.images.length}`);
      
      // Check for deletions
      if (operation.operation_type === 'delete_objects' || operation.operation_type === 'erase') {
        console.log('[RemoteOperationHandler] Processing deletion operation', operation.data);
      }
      
      // Ensure we do a deep copy of the state to force a re-render
      return {
        ...prev,
        lines: [...updatedState.lines],
        images: [...updatedState.images],
        // Update history to reflect the new state
        history: [
          {
            lines: [...updatedState.lines],
            images: [...updatedState.images],
            selectionState: prev.selectionState
          },
          ...prev.history.slice(0, 9) // Keep only the last 10 history entries
        ],
        historyIndex: 0
      };
    });
    
    // Keep the flag set longer for delete operations to prevent persistence interference
    const clearDelay = (operation.operation_type === 'delete_objects' || operation.operation_type === 'erase') ? 200 : 0;
    setTimeout(() => {
      isApplyingRemoteOperation.current = false;
    }, clearDelay);
  }, [setState]);

  return {
    handleRemoteOperation,
    isApplyingRemoteOperation
  };
};
