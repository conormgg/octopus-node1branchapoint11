import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SyncDirection } from '@/types/student';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('sync');

interface SyncDirectionBroadcastPayload {
  participantId: number;
  syncDirection: SyncDirection;
  boardSuffix: string;
  timestamp: number;
}

export const useSyncDirectionBroadcastListener = (
  sessionId: string | undefined,
  onSyncDirectionChange: (participantId: number, newDirection: SyncDirection, boardSuffix: string) => void
) => {
  const channelRef = useRef<any>(null);

  const handleBroadcast = useCallback((payload: { payload: SyncDirectionBroadcastPayload }) => {
    const { participantId, syncDirection, boardSuffix, timestamp } = payload.payload;
    
    debugLog('broadcast-received', `Received sync direction change: participant ${participantId} -> ${syncDirection} for board ${boardSuffix}`);
    
    onSyncDirectionChange(participantId, syncDirection, boardSuffix);
  }, [onSyncDirectionChange]);

  useEffect(() => {
    if (!sessionId) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Set up broadcast listener
    const channel = supabase.channel(`sync-direction-broadcast-${sessionId}`, {
      config: { broadcast: { self: false } } // Don't receive own broadcasts
    });

    channel
      .on('broadcast', { event: 'sync_direction_changed' }, handleBroadcast)
      .subscribe();

    channelRef.current = channel;

    debugLog('listener-setup', `Listening for sync direction broadcasts on session ${sessionId}`);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId, handleBroadcast]);
};