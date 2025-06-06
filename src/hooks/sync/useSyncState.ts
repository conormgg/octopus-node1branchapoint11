
import { useState } from 'react';
import { WhiteboardOperation, SyncConfig, SyncState } from '@/types/sync';
import { useRetryLogic } from './useRetryLogic';
import { useOperationSender } from './useOperationSender';
import { useRealtimeSubscription } from './useRealtimeSubscription';

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

  const { addToPendingOperations, cleanup } = useRetryLogic(setSyncState);
  
  const sendOperation = useOperationSender(
    config,
    syncState,
    setSyncState,
    addToPendingOperations
  );

  useRealtimeSubscription(config, onReceiveOperation, setSyncState);

  // Cleanup on unmount
  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    syncState,
    sendOperation: syncState.isReceiveOnly ? null : sendOperation
  };
};
