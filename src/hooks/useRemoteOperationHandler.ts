
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
      
      return {
        ...prev,
        lines: updatedState.lines,
        images: updatedState.images
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
