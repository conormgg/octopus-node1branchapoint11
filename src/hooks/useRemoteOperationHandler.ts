import { useCallback, useRef } from 'react';
import { WhiteboardOperation } from '@/types/sync';
import { applyOperation } from '@/utils/operationSerializer';
import { LineObject } from '@/types/whiteboard';

export const useRemoteOperationHandler = (
  setState: (updater: (prev: any) => any) => void
) => {
  const isApplyingRemoteOperation = useRef(false);

  // Handle incoming operations from other clients
  const handleRemoteOperation = useCallback((operation: WhiteboardOperation) => {
    isApplyingRemoteOperation.current = true;
    
    setState(prev => {
      const updatedLines = applyOperation(prev.lines, operation);
      
      return {
        ...prev,
        lines: updatedLines
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
