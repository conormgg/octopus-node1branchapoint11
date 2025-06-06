
import { useCallback, useRef } from 'react';
import { WhiteboardOperation } from '@/types/sync';
import { applyOperation } from '@/utils/operationSerializer';
import { LineObject } from '@/types/whiteboard';

export const useRemoteOperationHandler = (
  setState: (updater: (prev: any) => any) => void
) => {
  const isApplyingRemoteOperation = useRef(false);
  const operationQueue = useRef<WhiteboardOperation[]>([]);
  const isProcessingQueue = useRef(false);

  // Process queued operations sequentially to avoid race conditions
  const processOperationQueue = useCallback(() => {
    if (isProcessingQueue.current || operationQueue.current.length === 0) {
      return;
    }

    isProcessingQueue.current = true;
    isApplyingRemoteOperation.current = true;
    
    const operation = operationQueue.current.shift()!;
    
    setState(prev => {
      const updatedLines = applyOperation(prev.lines, operation);
      
      return {
        ...prev,
        lines: updatedLines
      };
    });
    
    // Process next operation in queue
    isProcessingQueue.current = false;
    isApplyingRemoteOperation.current = false;
    
    // Continue processing if there are more operations
    if (operationQueue.current.length > 0) {
      // Use requestAnimationFrame for smooth processing
      requestAnimationFrame(processOperationQueue);
    }
  }, [setState]);

  // Handle incoming operations from other clients
  const handleRemoteOperation = useCallback((operation: WhiteboardOperation) => {
    // Add to queue for sequential processing
    operationQueue.current.push(operation);
    
    // Start processing if not already running
    if (!isProcessingQueue.current) {
      processOperationQueue();
    }
  }, [processOperationQueue]);

  return {
    handleRemoteOperation,
    isApplyingRemoteOperation
  };
};
