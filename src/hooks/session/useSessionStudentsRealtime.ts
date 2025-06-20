
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
    if (!activeSession) {
      return;
    }

    // Initial fetch
    fetchSessionStudents();
    
    // Set up real-time subscription for participant CRUD operations only
    const channelName = `session-participants-${activeSession.id}`;
    debugLog('subscription', `Setting up participant CRUD subscription for ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
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
          // Only handle non-sync_direction updates to avoid conflicts with useSyncDirectionManager
          const oldDirection = payload.old?.sync_direction;
          const newDirection = payload.new?.sync_direction;
          
          // Skip sync_direction-only updates (handled by useSyncDirectionManager)
          if (oldDirection !== newDirection && 
              Object.keys(payload.new).length === Object.keys(payload.old).length &&
              Object.keys(payload.new).every(key => 
                key === 'sync_direction' || payload.new[key] === payload.old[key]
              )) {
            debugLog('subscription', `Skipping sync_direction-only update for participant ${payload.new.id}`);
            return;
          }
          
          debugLog('subscription', `Handling participant update for ${payload.new.id}`);
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
      debugLog('subscription', `Cleaning up participant CRUD subscription for ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [activeSession?.id, fetchSessionStudents, handleParticipantChange, setSessionStudents]);
};
