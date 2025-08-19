
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
      // Use public RPC to get participants (bypasses RLS for students)
      const { data, error } = await supabase
        .rpc('get_public_session_participants', { session_uuid: sessionId });

      if (error) {
        debugLog('fetch', `Error fetching participants: ${error.message}`);
        setParticipant(null);
        return;
      }

      // Filter for the specific board suffix since RPC returns all participants
      const participantData = Array.isArray(data) ? 
        data.find(p => p.assigned_board_suffix === boardSuffix.toUpperCase()) : 
        null;

      if (!participantData) {
        debugLog('fetch', `No participant found for board suffix: ${boardSuffix}`);
        setParticipant(null);
        return;
      }

      debugLog('fetch', `Fetched participant:`, participantData);
      setParticipant(participantData as SessionParticipant);
    } catch (error) {
      debugLog('fetch', `Exception fetching participant: ${error}`);
      setParticipant(null);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, boardSuffix]);

  // Enhanced real-time subscription with proper object reference handling
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
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const updatedParticipant = payload.new as SessionParticipant;
          
          // Check if this update is for our specific board suffix
          if (updatedParticipant.assigned_board_suffix === boardSuffix.toUpperCase()) {
            debugLog('realtime', `Participant updated for board ${boardSuffix}:`, updatedParticipant);
            debugLog('realtime', `Sync direction changed to: ${updatedParticipant.sync_direction}`);
            
            // CRITICAL FIX: Create new object reference to ensure React detects the change
            setParticipant({ ...updatedParticipant });
          }
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
