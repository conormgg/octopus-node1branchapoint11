
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
      debugLog('fetch', `Fetching participant for session: ${sessionId}, boardSuffix: ${boardSuffix}`);
      
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

  // Set up real-time subscription for all participant changes
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
          // FIX: Use proper Supabase filter format instead of concatenated string
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          debugLog('realtime', `Participant updated:`, payload.new);
          const updatedParticipant = payload.new as SessionParticipant;
          
          // Only update if this is the participant we're tracking
          if (updatedParticipant.assigned_board_suffix?.toUpperCase() === boardSuffix.toUpperCase()) {
            setParticipant(updatedParticipant);
            
            // Log sync direction changes specifically
            if (participant && participant.sync_direction !== updatedParticipant.sync_direction) {
              debugLog('realtime', `Sync direction changed: ${participant.sync_direction} → ${updatedParticipant.sync_direction}`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, boardSuffix, fetchParticipant, participant?.sync_direction]);

  return {
    participant,
    isLoading,
    refetch: fetchParticipant
  };
};
