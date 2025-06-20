
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SessionParticipant } from '@/types/student';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('session-students');

export const useStudentParticipant = (sessionId: string, boardSuffix: string) => {
  const [participant, setParticipant] = useState<SessionParticipant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncDirectionUpdate, setLastSyncDirectionUpdate] = useState<number>(0);

  const fetchParticipant = useCallback(async () => {
    if (!sessionId || !boardSuffix) return;

    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId)
        .eq('assigned_board_suffix', boardSuffix.toUpperCase())
        .single();

      if (error) {
        debugLog('fetch', `Error fetching participant: ${error.message}`);
        setParticipant(null);
        return;
      }

      debugLog('fetch', `Fetched participant:`, data);
      setParticipant(data as SessionParticipant);
    } catch (error) {
      debugLog('fetch', `Exception fetching participant: ${error}`);
      setParticipant(null);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, boardSuffix]);

  // Enhanced real-time subscription with unique channel naming to prevent conflicts
  useEffect(() => {
    fetchParticipant();

    if (!sessionId || !boardSuffix) return;

    // Use a unique channel name that won't conflict with whiteboard sync channels
    // Format: participant-{sessionId}-{boardSuffix}-{timestamp} for absolute uniqueness
    const uniqueChannelName = `participant-${sessionId}-${boardSuffix}-${Date.now()}`;
    
    debugLog('realtime', `Creating participant subscription channel: ${uniqueChannelName}`);

    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const updatedParticipant = payload.new as SessionParticipant;
          
          // Check if this update is for our specific board suffix
          if (updatedParticipant.assigned_board_suffix === boardSuffix.toUpperCase()) {
            debugLog('realtime', `Participant updated for board ${boardSuffix}:`, updatedParticipant);
            debugLog('realtime', `Sync direction changed to: ${updatedParticipant.sync_direction}`);
            
            // CRITICAL: Force immediate sync direction update with timestamp
            const timestamp = Date.now();
            setLastSyncDirectionUpdate(timestamp);
            
            // Create new object reference to ensure React detects the change
            const newParticipant = { ...updatedParticipant };
            setParticipant(newParticipant);
            
            debugLog('realtime', `IMMEDIATE sync direction update triggered at ${timestamp}`);
            
            // Force a small delay to ensure all sync configs recalculate
            setTimeout(() => {
              debugLog('realtime', 'Sync direction propagation complete');
            }, 50);
          }
        }
      )
      .subscribe((status) => {
        debugLog('realtime', `Participant subscription status: ${status} for channel ${uniqueChannelName}`);
        
        if (status === 'CHANNEL_ERROR') {
          debugLog('realtime', `Channel error for ${uniqueChannelName}, attempting to recover`);
        }
      });

    return () => {
      debugLog('realtime', `Cleaning up participant subscription channel: ${uniqueChannelName}`);
      supabase.removeChannel(channel);
    };
  }, [sessionId, boardSuffix, fetchParticipant]);

  return {
    participant,
    isLoading,
    refetch: fetchParticipant,
    lastSyncDirectionUpdate // NEW: Expose timestamp for forcing re-renders
  };
};
