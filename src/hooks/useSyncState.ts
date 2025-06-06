
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardOperation, SyncConfig, SyncState, OperationType } from '@/types/sync';
import { useSession } from '@/contexts/SessionContext';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

export const useSyncState = (
  config: SyncConfig,
  onReceiveOperation: (operation: WhiteboardOperation) => void
) => {
  const { sessionId } = useSession();
  const [syncState, setSyncState] = useState<SyncState>({
    isConnected: false,
    isReceiveOnly: config.isReceiveOnly || false,
    lastSyncTimestamp: Date.now(),
    pendingOperations: []
  });

  const pendingOperationsRef = useRef<WhiteboardOperation[]>([]);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Retry failed operations with exponential backoff
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
  }, [sessionId]);

  // Send operation with retry logic
  const sendOperation = useCallback(async (operation: Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'>) => {
    if (syncState.isReceiveOnly) return null;

    const fullOperation: WhiteboardOperation = {
      ...operation,
      whiteboard_id: config.whiteboardId,
      timestamp: Date.now(),
      sender_id: config.senderId
    };

    try {
      const { error } = await supabase
        .from('whiteboard_data')
        .insert({
          action_type: fullOperation.operation_type,
          board_id: fullOperation.whiteboard_id,
          object_data: fullOperation.data,
          object_id: `${fullOperation.operation_type}_${Date.now()}`,
          session_id: sessionId,
          user_id: fullOperation.sender_id
        });

      if (error) {
        console.error('Error sending operation:', error);
        // Add to pending operations for retry
        pendingOperationsRef.current.push(fullOperation);
        setSyncState(prev => ({
          ...prev,
          pendingOperations: [...prev.pendingOperations, fullOperation]
        }));
        
        // Start retry process if not already running
        if (!retryTimeoutRef.current) {
          retryTimeoutRef.current = setTimeout(retryPendingOperations, RETRY_DELAY);
        }
      } else {
        // Success - update last sync timestamp
        setSyncState(prev => ({
          ...prev,
          lastSyncTimestamp: Date.now()
        }));
      }
    } catch (networkError) {
      console.error('Network error sending operation:', networkError);
      pendingOperationsRef.current.push(fullOperation);
      setSyncState(prev => ({
        ...prev,
        pendingOperations: [...prev.pendingOperations, fullOperation],
        isConnected: false
      }));
    }

    return fullOperation;
  }, [config.whiteboardId, config.senderId, syncState.isReceiveOnly, sessionId, retryPendingOperations]);

  // Set up real-time subscription with error handling
  useEffect(() => {
    let channel: any;
    
    const setupSubscription = () => {
      try {
        channel = supabase
          .channel(`whiteboard-${config.whiteboardId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'whiteboard_data',
              filter: `board_id=eq.${config.whiteboardId}`
            },
            (payload) => {
              try {
                const data = payload.new as any;
                
                // Don't process our own operations
                if (data.user_id === config.senderId) return;
                
                // Convert to our internal operation format
                const operation: WhiteboardOperation = {
                  whiteboard_id: data.board_id,
                  operation_type: data.action_type as OperationType,
                  timestamp: new Date(data.created_at).getTime(),
                  sender_id: data.user_id,
                  data: data.object_data
                };
                
                onReceiveOperation(operation);
                
                // Update last sync timestamp
                setSyncState(prev => ({
                  ...prev,
                  lastSyncTimestamp: Date.now(),
                  isConnected: true
                }));
              } catch (operationError) {
                console.error('Error processing received operation:', operationError);
              }
            }
          )
          .subscribe((status) => {
            setSyncState(prev => ({
              ...prev,
              isConnected: status === 'SUBSCRIBED'
            }));
            
            if (status === 'CHANNEL_ERROR') {
              console.error('Subscription error, attempting to reconnect...');
              // Attempt to reconnect after a delay
              setTimeout(setupSubscription, 2000);
            }
          });
      } catch (subscriptionError) {
        console.error('Error setting up subscription:', subscriptionError);
        setSyncState(prev => ({ ...prev, isConnected: false }));
      }
    };

    setupSubscription();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [config.whiteboardId, config.senderId, onReceiveOperation]);

  return {
    syncState,
    sendOperation: syncState.isReceiveOnly ? null : sendOperation
  };
};
