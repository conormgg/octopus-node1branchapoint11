
import { useEffect, useRef, useCallback, useState } from 'react';
import { WhiteboardOperation, SyncConfig, SyncState, OperationType } from '@/types/sync';
import { SyncConnectionManager } from '@/utils/sync';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('sync');

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
    debugLog('useSyncState', `Config updated for whiteboard: ${config.whiteboardId}, isReceiveOnly: ${config.isReceiveOnly}`);
  }, [config]);

  useEffect(() => {
    handlerRef.current = onReceiveOperation;
  }, [onReceiveOperation]);

  // Send operation to other clients using the connection manager
  const sendOperation = useCallback((operation: Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'>) => {
    const currentConfig = configRef.current;
    
    debugLog('useSyncState', `Attempting to send operation - type: ${operation.operation_type}, whiteboardId: ${currentConfig.whiteboardId}, isReceiveOnly: ${currentConfig.isReceiveOnly}`);
    
    if (currentConfig.isReceiveOnly) {
      debugLog('useSyncState', `Blocked send - connection is receive-only for ${currentConfig.whiteboardId}`);
      return null;
    }
    
    debugLog('useSyncState', `Sending operation of type ${operation.operation_type} for whiteboard: ${currentConfig.whiteboardId}`);

    const fullOperation = SyncConnectionManager.sendOperation(currentConfig, operation);
    
    if (!fullOperation) {
      debugLog('useSyncState', 'Failed to send operation through connection manager - no operation returned');
      return null;
    }
    
    debugLog('useSyncState', `Successfully sent operation through connection manager:`, fullOperation);
    
    // Update last sync timestamp
    setSyncState(prev => ({
      ...prev,
      lastSyncTimestamp: Date.now()
    }));
    
    return fullOperation;
  }, []);

  // Register with the connection manager
  useEffect(() => {
    debugLog('useSyncState', `Registering handler for whiteboard: ${config.whiteboardId}, isReceiveOnly: ${config.isReceiveOnly}`);
    
    // Create a stable handler reference that always calls the latest handler function
    const stableHandler = (operation: WhiteboardOperation) => {
      debugLog('useSyncState', 'Received operation via connection manager:', operation);
      
      // Update last sync timestamp
      setSyncState(prev => ({
        ...prev,
        lastSyncTimestamp: Date.now()
      }));
      
      // Call the handler
      handlerRef.current(operation);
    };
    
    // Register with the connection manager
    const { isConnected } = SyncConnectionManager.registerHandler(config, stableHandler);
    
    debugLog('useSyncState', `Registration complete - isConnected: ${isConnected}`);
    
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
          debugLog('useSyncState', `Connection status changed: ${status.isConnected} for ${config.whiteboardId}`);
          return {
            ...prev,
            isConnected: status.isConnected
          };
        }
        return prev;
      });
    }, 5000);
    
    return () => {
      debugLog('useSyncState', `Unregistering handler for whiteboard: ${config.whiteboardId}`);
      SyncConnectionManager.unregisterHandler(config, stableHandler);
      clearInterval(statusInterval);
    };
  }, [config.whiteboardId, config.sessionId, config.senderId, config.isReceiveOnly]);

  return {
    syncState,
    sendOperation: configRef.current.isReceiveOnly ? null : sendOperation
  };
};
