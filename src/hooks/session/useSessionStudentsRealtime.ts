
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
      
      // Consolidated real-time subscription with throttling to prevent rapid updates
      let updateTimeout: NodeJS.Timeout | null = null;
      
      const throttledHandleChange = (payload: any) => {
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        
        updateTimeout = setTimeout(() => {
          handleParticipantChange(payload, setSessionStudents);
        }, 50); // 50ms throttle to prevent rapid-fire updates
      };
      
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
          (payload) => {
            debugLog('realtimeInsert', `New participant added:`, payload.new);
            throttledHandleChange({ ...payload, eventType: 'INSERT' });
          }
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
            // Log specific field changes for debugging
            const oldDirection = payload.old?.sync_direction;
            const newDirection = payload.new?.sync_direction;
            const oldJoinedAt = payload.old?.joined_at;
            const newJoinedAt = payload.new?.joined_at;
            
            if (oldDirection !== newDirection) {
              debugLog('syncDirectionChange', `Participant ${payload.new.id} sync direction: ${oldDirection} → ${newDirection}`);
            }
            
            if (oldJoinedAt !== newJoinedAt) {
              debugLog('participantJoin', `Participant ${payload.new.id} join status changed`);
            }
            
            throttledHandleChange({ ...payload, eventType: 'UPDATE' });
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
          (payload) => {
            debugLog('realtimeDelete', `Participant removed:`, payload.old);
            throttledHandleChange({ ...payload, eventType: 'DELETE' });
          }
        )
        .subscribe();

      return () => {
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        supabase.removeChannel(channel);
        debugLog('cleanup', `Cleaned up real-time subscription for session ${activeSession.id}`);
      };
    }
  }, [activeSession, fetchSessionStudents, handleParticipantChange, setSessionStudents]);
};
