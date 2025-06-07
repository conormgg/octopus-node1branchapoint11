
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
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);

  // Stable config values to prevent unnecessary re-subscriptions
  const stableConfig = useRef(config);
  
  // Update stable config only when essential values change
  useEffect(() => {
    const configChanged = 
      stableConfig.current.whiteboardId !== config.whiteboardId ||
      stableConfig.current.senderId !== config.senderId ||
      stableConfig.current.sessionId !== config.sessionId ||
      stableConfig.current.isReceiveOnly !== config.isReceiveOnly;
    
    if (configChanged) {
      stableConfig.current = config;
    }
  }, [config.whiteboardId, config.senderId, config.sessionId, config.isReceiveOnly]);

  // Send operation to other clients
  const sendOperation = useCallback((operation: Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'>) => {
    if (syncState.isReceiveOnly) return null;

    const fullOperation: WhiteboardOperation = {
      ...operation,
      whiteboard_id: stableConfig.current.whiteboardId,
      timestamp: Date.now(),
      sender_id: stableConfig.current.senderId
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
        session_id: stableConfig.current.sessionId,
        user_id: fullOperation.sender_id
      })
      .then(({ error }) => {
        if (error) {
          console.error('Error sending operation:', error);
          // Add to pending operations for retry
          if (!isUnmountedRef.current) {
            pendingOperationsRef.current.push(fullOperation);
            setSyncState(prev => ({
              ...prev,
              pendingOperations: [...prev.pendingOperations, fullOperation]
            }));
          }
        } else {
          console.log('Operation sent successfully');
          // Remove from pending operations if it was there
          if (!isUnmountedRef.current) {
            setSyncState(prev => ({
              ...prev,
              pendingOperations: prev.pendingOperations.filter(op => op !== fullOperation)
            }));
          }
        }
      });

    return fullOperation;
  }, [syncState.isReceiveOnly]);

  // Retry pending operations
  const retryPendingOperations = useCallback(() => {
    if (pendingOperationsRef.current.length === 0 || isUnmountedRef.current) return;

    console.log(`Retrying ${pendingOperationsRef.current.length} pending operations`);
    const operationsToRetry = [...pendingOperationsRef.current];
    pendingOperationsRef.current = [];

    operationsToRetry.forEach(operation => {
      sendOperation(operation);
    });
  }, [sendOperation]);

  // Setup subscription with reconnection logic
  const setupSubscription = useCallback(() => {
    if (isUnmountedRef.current) return;

    // Clear any existing channel
    if (channelRef.current) {
      console.log('Cleaning up existing channel before reconnection');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(`Setting up realtime subscription for whiteboard: ${stableConfig.current.whiteboardId}`);
    
    const channel = supabase
      .channel(`whiteboard-${stableConfig.current.whiteboardId}-${Date.now()}`) // Add timestamp to ensure unique channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whiteboard_data',
          filter: `board_id=eq.${stableConfig.current.whiteboardId}`
        },
        (payload) => {
          if (isUnmountedRef.current) return;
          
          console.log('Received operation from Supabase:', payload);
          const data = payload.new as any;
          
          // Don't process our own operations
          if (data.user_id === stableConfig.current.senderId) {
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
        if (isUnmountedRef.current) return;
        
        console.log('Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          // Reset reconnection attempts on successful connection
          reconnectAttemptsRef.current = 0;
          setSyncState(prev => ({
            ...prev,
            isConnected: true
          }));
          // Retry pending operations when we reconnect
          retryPendingOperations();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setSyncState(prev => ({
            ...prev,
            isConnected: false
          }));
          
          // Implement exponential backoff reconnection
          const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          console.log(`Connection failed, retrying in ${backoffDelay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmountedRef.current) {
              setupSubscription();
            }
          }, backoffDelay);
        } else {
          setSyncState(prev => ({
            ...prev,
            isConnected: false
          }));
        }
      });

    channelRef.current = channel;
  }, [onReceiveOperation, retryPendingOperations]);

  // Set up subscription when component mounts or essential config changes
  useEffect(() => {
    isUnmountedRef.current = false;
    setupSubscription();

    return () => {
      console.log('Cleaning up realtime subscription');
      isUnmountedRef.current = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [setupSubscription]);

  return {
    syncState,
    sendOperation: syncState.isReceiveOnly ? null : sendOperation
  };
};
