
import { useEffect, useRef, useCallback, useState } from 'react';
import { WhiteboardOperation, SyncConfig, SyncState, OperationType } from '@/types/sync';
import SyncConnectionManager from '@/utils/SyncConnectionManager';

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
  const configRef = useRef(config);
  const handlerRef = useRef(onReceiveOperation);

  // Update refs when dependencies change
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    handlerRef.current = onReceiveOperation;
  }, [onReceiveOperation]);

  // Send operation to other clients using the connection manager
  const sendOperation = useCallback((operation: Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'>) => {
    if (configRef.current.isReceiveOnly) return null;

    const fullOperation = SyncConnectionManager.sendOperation(configRef.current, operation);
    
    if (!fullOperation) {
      console.error('Failed to send operation through connection manager');
      return null;
    }
    
    return fullOperation;
  }, []);

  // Register with the connection manager
  useEffect(() => {
    console.log(`[useSyncState] Registering handler for whiteboard: ${config.whiteboardId}`);
    
    // Create a stable handler reference that always calls the latest handler function
    const stableHandler = (operation: WhiteboardOperation) => {
      console.log('[useSyncState] Received operation via connection manager:', operation);
      handlerRef.current(operation);
    };
    
    // Register with the connection manager
    const { isConnected } = SyncConnectionManager.registerHandler(config, stableHandler);
    
    // Update initial connection state
    setSyncState(prev => ({
      ...prev,
      isConnected
    }));
    
    // Set up a periodic check for connection status
    const statusInterval = setInterval(() => {
      const status = SyncConnectionManager.getConnectionStatus(config);
      setSyncState(prev => {
        if (prev.isConnected !== status.isConnected) {
          console.log(`[useSyncState] Connection status changed: ${status.isConnected}`);
          return {
            ...prev,
            isConnected: status.isConnected
          };
        }
        return prev;
      });
    }, 5000);
    
    return () => {
      console.log(`[useSyncState] Unregistering handler for whiteboard: ${config.whiteboardId}`);
      SyncConnectionManager.unregisterHandler(config, stableHandler);
      clearInterval(statusInterval);
    };
  }, [config.whiteboardId, config.sessionId, config.senderId]);

  return {
    syncState,
    sendOperation: configRef.current.isReceiveOnly ? null : sendOperation
  };
};
