
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardOperation, SyncConfig } from '@/types/sync';
import { useSession } from '@/contexts/SessionContext';

export const useOperationSender = (
  config: SyncConfig,
  syncState: any,
  setSyncState: React.Dispatch<React.SetStateAction<any>>,
  addToPendingOperations: (operation: WhiteboardOperation) => void
) => {
  const { sessionId } = useSession();

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
        addToPendingOperations(fullOperation);
      } else {
        // Success - update last sync timestamp
        setSyncState(prev => ({
          ...prev,
          lastSyncTimestamp: Date.now()
        }));
      }
    } catch (networkError) {
      console.error('Network error sending operation:', networkError);
      addToPendingOperations(fullOperation);
      setSyncState(prev => ({
        ...prev,
        isConnected: false
      }));
    }

    return fullOperation;
  }, [config.whiteboardId, config.senderId, syncState.isReceiveOnly, sessionId, addToPendingOperations, setSyncState]);

  return sendOperation;
};
