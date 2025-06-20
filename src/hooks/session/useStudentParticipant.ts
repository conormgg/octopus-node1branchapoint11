
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SessionParticipant } from '@/types/student';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('session-students');

export const useStudentParticipant = (sessionId: string, boardSuffix: string) => {
  const [participant, setParticipant] = useState<SessionParticipant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Enhanced real-time subscription for sync direction changes
  useEffect(() => {
    fetchParticipant();

    if (!sessionId || !boardSuffix) return;

    const channel = supabase
      .channel(`student-participant-${sessionId}-${boardSuffix}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId} AND assigned_board_suffix=eq.${boardSuffix.toUpperCase()}`
        },
        (payload) => {
          debugLog('realtime', `Participant updated:`, payload.new);
          const updatedParticipant = payload.new as SessionParticipant;
          
          // Update participant state immediately for reactive sync configuration
          setParticipant(prevParticipant => {
            if (!prevParticipant) return updatedParticipant;
            
            // Log sync direction changes specifically
            if (prevParticipant.sync_direction !== updatedParticipant.sync_direction) {
              debugLog('realtime', `Sync direction changed: ${prevParticipant.sync_direction} → ${updatedParticipant.sync_direction}`);
            }
            
            return updatedParticipant;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, boardSuffix, fetchParticipant]);

  return {
    participant,
    isLoading,
    refetch: fetchParticipant
  };
};
