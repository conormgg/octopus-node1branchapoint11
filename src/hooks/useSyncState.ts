
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardOperation, SyncConfig, SyncState, OperationType } from '@/types/sync';

export const useSyncState = (
  config: SyncConfig,
  onReceiveOperation: (operation: WhiteboardOperation) => void
) => {
  const [syncState, setSyncState] = useState<SyncState>({
    isConnected: false,
    isReceiveOnly: config.isReceiveOnly || false,
    lastSyncTimestamp: Date.now(),
    pendingOperations: []
  });

  const pendingOperationsRef = useRef<WhiteboardOperation[]>([]);
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Send operation to other clients
  const sendOperation = useCallback((operation: Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'>) => {
    if (syncState.isReceiveOnly) return null;

    const fullOperation: WhiteboardOperation = {
      ...operation,
      whiteboard_id: config.whiteboardId,
      timestamp: Date.now(),
      sender_id: config.senderId
    };

    console.log('Sending operation to Supabase:', fullOperation);

    // Send to Supabase
    supabase
      .from('whiteboard_data')
      .insert({
        action_type: fullOperation.operation_type,
        board_id: fullOperation.whiteboard_id,
        object_data: fullOperation.data,
        object_id: `${fullOperation.operation_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id: config.sessionId,
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
        } else {
          console.log('Operation sent successfully');
          // Remove from pending operations if it was there
          setSyncState(prev => ({
            ...prev,
            pendingOperations: prev.pendingOperations.filter(op => op !== fullOperation)
          }));
        }
      });

    return fullOperation;
  }, [config.whiteboardId, config.senderId, config.sessionId, syncState.isReceiveOnly]);

  // Retry pending operations
  const retryPendingOperations = useCallback(() => {
    if (pendingOperationsRef.current.length === 0) return;

    console.log(`Retrying ${pendingOperationsRef.current.length} pending operations`);
    const operationsToRetry = [...pendingOperationsRef.current];
    pendingOperationsRef.current = [];

    operationsToRetry.forEach(operation => {
      sendOperation(operation);
    });
  }, [sendOperation]);

  // Setup realtime subscription with reconnection logic
  const setupSubscription = useCallback(() => {
    // Clean up existing channel
    if (channelRef.current) {
      console.log('Cleaning up existing channel');
      supabase.removeChannel(channelRef.current);
    }

    console.log(`Setting up realtime subscription for whiteboard: ${config.whiteboardId}`);
    
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
          console.log('Received operation from Supabase:', payload);
          const data = payload.new as any;
          
          // Don't process our own operations
          if (data.user_id === config.senderId) {
            console.log('Ignoring own operation');
            return;
          }
          
          // Convert to our internal operation format
          const operation: WhiteboardOperation = {
            whiteboard_id: data.board_id,
            operation_type: data.action_type as OperationType,
            timestamp: new Date(data.created_at).getTime(),
            sender_id: data.user_id,
            data: data.object_data
          };
          
          console.log('Processing remote operation:', operation);
          onReceiveOperation(operation);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setSyncState(prev => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED'
        }));

        // Handle reconnection
        if (status === 'SUBSCRIBED') {
          console.log('Successfully connected to realtime');
          retryPendingOperations();
          
          // Clear any pending reconnection timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.log('Connection error, scheduling reconnection');
          setSyncState(prev => ({ ...prev, isConnected: false }));
          
          // Schedule reconnection attempt
          if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Attempting to reconnect...');
              setupSubscription();
              reconnectTimeoutRef.current = null;
            }, 3000);
          }
        }
      });

    channelRef.current = channel;
  }, [config.whiteboardId, config.senderId, onReceiveOperation, retryPendingOperations]);

  // Set up subscription on mount and config changes
  useEffect(() => {
    setupSubscription();

    return () => {
      console.log('Cleaning up realtime subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [setupSubscription]);

  return {
    syncState,
    sendOperation: syncState.isReceiveOnly ? null : sendOperation
  };
};
