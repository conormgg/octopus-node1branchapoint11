
import { useCallback, useRef } from 'react';
import { WhiteboardOperation } from '@/types/sync';
import { applyOperation } from '@/utils/operationSerializer';

export const useRemoteOperationHandler = (
  setState: (updater: (prev: any) => any) => void
) => {
  const isApplyingRemoteOperation = useRef(false);

  // Handle incoming operations from other clients
  const handleRemoteOperation = useCallback((operation: WhiteboardOperation) => {
    isApplyingRemoteOperation.current = true;
    
    setState(prev => {
      const updatedState = applyOperation(prev, operation);
      
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
