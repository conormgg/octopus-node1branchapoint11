
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@/types/session';
import { SessionParticipant } from '@/types/student';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('session-students');

export const useSessionStudentsRealtime = (
  activeSession: Session | null | undefined,
  fetchSessionStudents: () => void,
  handleParticipantChange: (payload: any, setSessionStudents: React.Dispatch<React.SetStateAction<SessionParticipant[]>>) => void,
  setSessionStudents: React.Dispatch<React.SetStateAction<SessionParticipant[]>>
) => {
  useEffect(() => {
    if (activeSession) {
      fetchSessionStudents();
      
      // Set up real-time subscription with specific event handlers
      const channel = supabase
        .channel(`session-participants-${activeSession.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${activeSession.id}`
          },
          (payload) => handleParticipantChange({ ...payload, eventType: 'INSERT' }, setSessionStudents)
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${activeSession.id}`
          },
          (payload) => {
            // Log sync_direction changes specifically
            const oldDirection = payload.old?.sync_direction;
            const newDirection = payload.new?.sync_direction;
            if (oldDirection !== newDirection) {
              debugLog('syncDirectionChange', `Participant ${payload.new.id} sync direction changed: ${oldDirection} → ${newDirection}`);
            }
            handleParticipantChange({ ...payload, eventType: 'UPDATE' }, setSessionStudents);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${activeSession.id}`
          },
          (payload) => handleParticipantChange({ ...payload, eventType: 'DELETE' }, setSessionStudents)
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeSession, fetchSessionStudents, handleParticipantChange, setSessionStudents]);
};
