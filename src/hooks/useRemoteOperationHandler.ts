
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
      const updatedState = applyOperation(prev, operation);
      
      console.log(`[RemoteOperationHandler] State updated - Lines: ${prev.lines.length} -> ${updatedState.lines.length}, Images: ${prev.images.length} -> ${updatedState.images.length}`);
      
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
    
    setTimeout(() => {
      isApplyingRemoteOperation.current = false;
    }, 0);
  }, [setState]);

  return {
    handleRemoteOperation,
    isApplyingRemoteOperation
  };
};
