
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardOperation, SyncConfig, SyncState, OperationType } from '@/types/sync';
import { useSession } from '@/contexts/SessionContext';

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

  // Send operation to other clients
  const sendOperation = useCallback((operation: Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'>) => {
    if (syncState.isReceiveOnly) return null;

    const fullOperation: WhiteboardOperation = {
      ...operation,
      whiteboard_id: config.whiteboardId,
      timestamp: Date.now(),
      sender_id: config.senderId
    };

    // Send to Supabase with proper session ID
    supabase
      .from('whiteboard_data')
      .insert({
        action_type: fullOperation.operation_type,
        board_id: fullOperation.whiteboard_id,
        object_data: fullOperation.data,
        object_id: `${fullOperation.operation_type}_${Date.now()}`,
        session_id: sessionId, // Use proper session ID from context
        user_id: fullOperation.sender_id
      })
      .then(({ error }) => {
        if (error) {
          console.error('Error sending operation:', error);
          // Add to pending operations for retry
          pendingOperationsRef.current.push(fullOperation);
          setSyncState(prev => ({
            ...prev,
            pendingOperations: [...prev.pendingOperations, fullOperation]
          }));
        }
      });

    return fullOperation;
  }, [config.whiteboardId, config.senderId, syncState.isReceiveOnly, sessionId]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
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
        }
      )
      .subscribe();

    setSyncState(prev => ({
      ...prev,
      isConnected: true
    }));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config.whiteboardId, config.senderId, onReceiveOperation]);

  return {
    syncState,
    sendOperation: syncState.isReceiveOnly ? null : sendOperation
  };
};
