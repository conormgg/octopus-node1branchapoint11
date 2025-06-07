
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
  const configRef = useRef(config);
  const onReceiveOperationRef = useRef(onReceiveOperation);
  const setupInProgressRef = useRef(false);

  // Update refs when values change
  useEffect(() => {
    configRef.current = config;
  }, [config.whiteboardId, config.senderId, config.sessionId, config.isReceiveOnly]);

  useEffect(() => {
    onReceiveOperationRef.current = onReceiveOperation;
  }, [onReceiveOperation]);

  // Retry pending operations independently of subscription setup
  const retryPendingOperations = useCallback(() => {
    if (pendingOperationsRef.current.length === 0 || isUnmountedRef.current) return;

    console.log(`Retrying ${pendingOperationsRef.current.length} pending operations`);
    const operationsToRetry = [...pendingOperationsRef.current];
    pendingOperationsRef.current = [];

    operationsToRetry.forEach(operation => {
      supabase
        .from('whiteboard_data')
        .insert({
          action_type: operation.operation_type,
          board_id: operation.whiteboard_id,
          object_data: operation.data,
          object_id: `${operation.operation_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          session_id: configRef.current.sessionId,
          user_id: operation.sender_id
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error retrying operation:', error);
            if (!isUnmountedRef.current) {
              pendingOperationsRef.current.push(operation);
            }
          }
        });
    });

    if (!isUnmountedRef.current) {
      setSyncState(prev => ({
        ...prev,
        pendingOperations: []
      }));
    }
  }, []);

  // Stable send operation function
  const sendOperation = useCallback((operation: Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'>) => {
    if (configRef.current.isReceiveOnly) return null;

    const fullOperation: WhiteboardOperation = {
      ...operation,
      whiteboard_id: configRef.current.whiteboardId,
      timestamp: Date.now(),
      sender_id: configRef.current.senderId
    };

    console.log('Sending operation to Supabase:', fullOperation);

    supabase
      .from('whiteboard_data')
      .insert({
        action_type: fullOperation.operation_type,
        board_id: fullOperation.whiteboard_id,
        object_data: fullOperation.data,
        object_id: `${fullOperation.operation_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id: configRef.current.sessionId,
        user_id: fullOperation.sender_id
      })
      .then(({ error }) => {
        if (error) {
          console.error('Error sending operation:', error);
          if (!isUnmountedRef.current) {
            pendingOperationsRef.current.push(fullOperation);
            setSyncState(prev => ({
              ...prev,
              pendingOperations: [...prev.pendingOperations, fullOperation]
            }));
          }
        } else {
          console.log('Operation sent successfully');
          if (!isUnmountedRef.current) {
            setSyncState(prev => ({
              ...prev,
              pendingOperations: prev.pendingOperations.filter(op => op !== fullOperation)
            }));
          }
        }
      });

    return fullOperation;
  }, []);

  // Setup subscription with connection health management
  const setupSubscription = useCallback(() => {
    if (isUnmountedRef.current || setupInProgressRef.current) return;

    setupInProgressRef.current = true;

    // Clear any existing channel
    if (channelRef.current) {
      console.log('Cleaning up existing channel before reconnection');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const currentConfig = configRef.current;
    console.log(`Setting up realtime subscription for whiteboard: ${currentConfig.whiteboardId}`);
    
    const channelName = `whiteboard-${currentConfig.whiteboardId}-${currentConfig.senderId}`;
    console.log(`Creating channel with name: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whiteboard_data',
          filter: `board_id=eq.${currentConfig.whiteboardId}`
        },
        (payload) => {
          if (isUnmountedRef.current) return;
          
          console.log('Received operation from Supabase:', payload);
          const data = payload.new as any;
          
          // Don't process our own operations
          if (data.user_id === currentConfig.senderId) {
            console.log('Ignoring own operation');
            return;
          }
          
          const operation: WhiteboardOperation = {
            whiteboard_id: data.board_id,
            operation_type: data.action_type as OperationType,
            timestamp: new Date(data.created_at).getTime(),
            sender_id: data.user_id,
            data: data.object_data
          };
          
          console.log('Processing remote operation:', operation);
          onReceiveOperationRef.current(operation);
        }
      )
      .subscribe((status) => {
        setupInProgressRef.current = false;
        
        if (isUnmountedRef.current) return;
        
        console.log('Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          reconnectAttemptsRef.current = 0;
          setSyncState(prev => ({
            ...prev,
            isConnected: true
          }));
          // Retry pending operations when we reconnect
          setTimeout(retryPendingOperations, 100);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setSyncState(prev => ({
            ...prev,
            isConnected: false
          }));
          
          // Implement exponential backoff reconnection with max timeout
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
        } else if (status === 'CLOSED') {
          setSyncState(prev => ({
            ...prev,
            isConnected: false
          }));
        }
      });

    channelRef.current = channel;
  }, [retryPendingOperations]);

  // Set up subscription when component mounts or config changes significantly
  useEffect(() => {
    isUnmountedRef.current = false;
    setupSubscription();

    return () => {
      console.log('Cleaning up realtime subscription');
      isUnmountedRef.current = true;
      setupInProgressRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [config.whiteboardId, config.sessionId]); // Only recreate on actual config changes

  // Update sync state when isReceiveOnly changes (without recreating subscription)
  useEffect(() => {
    setSyncState(prev => ({
      ...prev,
      isReceiveOnly: config.isReceiveOnly || false
    }));
  }, [config.isReceiveOnly]);

  return {
    syncState,
    sendOperation: syncState.isReceiveOnly ? null : sendOperation
  };
};
