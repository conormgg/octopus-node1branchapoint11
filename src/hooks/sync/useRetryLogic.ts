
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardOperation } from '@/types/sync';
import { useSession } from '@/contexts/SessionContext';
import { RETRY_DELAY } from './types';

export const useRetryLogic = (
  setSyncState: React.Dispatch<React.SetStateAction<any>>
) => {
  const { sessionId } = useSession();
  const pendingOperationsRef = useRef<WhiteboardOperation[]>([]);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const retryPendingOperations = useCallback(async () => {
    if (pendingOperationsRef.current.length === 0) return;

    const operationsToRetry = [...pendingOperationsRef.current];
    pendingOperationsRef.current = [];

    for (const operation of operationsToRetry) {
      try {
        const { error } = await supabase
          .from('whiteboard_data')
          .insert({
            action_type: operation.operation_type,
            board_id: operation.whiteboard_id,
            object_data: operation.data,
            object_id: `${operation.operation_type}_${Date.now()}_retry`,
            session_id: sessionId,
            user_id: operation.sender_id
          });

        if (error) {
          console.error('Retry failed for operation:', error);
          // Add back to pending if retry limit not reached
          pendingOperationsRef.current.push(operation);
        }
      } catch (retryError) {
        console.error('Network error during retry:', retryError);
        pendingOperationsRef.current.push(operation);
      }
    }

    // Update sync state
    setSyncState(prev => ({
      ...prev,
      pendingOperations: [...pendingOperationsRef.current]
    }));

    // Schedule next retry if there are still pending operations
    if (pendingOperationsRef.current.length > 0) {
      retryTimeoutRef.current = setTimeout(retryPendingOperations, RETRY_DELAY * 2);
    }
  }, [sessionId, setSyncState]);

  const addToPendingOperations = useCallback((operation: WhiteboardOperation) => {
    pendingOperationsRef.current.push(operation);
    setSyncState(prev => ({
      ...prev,
      pendingOperations: [...prev.pendingOperations, operation]
    }));
    
    // Start retry process if not already running
    if (!retryTimeoutRef.current) {
      retryTimeoutRef.current = setTimeout(retryPendingOperations, RETRY_DELAY);
    }
  }, [retryPendingOperations, setSyncState]);

  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  return {
    addToPendingOperations,
    cleanup
  };
};
