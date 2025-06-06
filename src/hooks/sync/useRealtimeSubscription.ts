
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardOperation, SyncConfig, OperationType } from '@/types/sync';

export const useRealtimeSubscription = (
  config: SyncConfig,
  onReceiveOperation: (operation: WhiteboardOperation) => void,
  setSyncState: React.Dispatch<React.SetStateAction<any>>
) => {
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
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [config.whiteboardId, config.senderId, onReceiveOperation, setSyncState]);
};
