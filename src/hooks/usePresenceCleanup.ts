
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UsePresenceCleanupProps {
  sessionId: string;
  enabled?: boolean;
}

export const usePresenceCleanup = ({ 
  sessionId, 
  enabled = true 
}: UsePresenceCleanupProps) => {
  // Clean up inactive students (those who haven't pinged in over 2 minutes)
  const cleanupInactiveStudents = useCallback(async () => {
    if (!enabled) {
      console.log('[PresenceCleanup] Cleanup disabled, skipping');
      return;
    }

    console.log(`[PresenceCleanup] Running cleanup for session ${sessionId}`);

    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      
      // Find students who joined but haven't pinged recently
      const { data: inactiveStudents, error: fetchError } = await supabase
        .from('session_participants')
        .select('id, student_name, last_ping_at, joined_at')
        .eq('session_id', sessionId)
        .not('joined_at', 'is', null)
        .or(`last_ping_at.is.null,last_ping_at.lt.${twoMinutesAgo}`);

      if (fetchError) {
        console.error('[PresenceCleanup] Error fetching inactive students:', fetchError);
        return;
      }

      if (inactiveStudents && inactiveStudents.length > 0) {
        console.log(`[PresenceCleanup] Found ${inactiveStudents.length} inactive students:`, 
          inactiveStudents.map(s => ({ 
            name: s.student_name, 
            lastPing: s.last_ping_at,
            joinedAt: s.joined_at 
          })));

        // Reset them to pending state
        const { error: updateError } = await supabase
          .from('session_participants')
          .update({ 
            joined_at: null,
            last_ping_at: null 
          })
          .in('id', inactiveStudents.map(s => s.id));

        if (updateError) {
          console.error('[PresenceCleanup] Error cleaning up inactive students:', updateError);
        } else {
          console.log(`[PresenceCleanup] Successfully reset ${inactiveStudents.length} students to pending state`);
        }
      } else {
        console.log('[PresenceCleanup] No inactive students found');
      }
    } catch (error) {
      console.error('[PresenceCleanup] Exception in cleanup process:', error);
    }
  }, [sessionId, enabled]);

  // Set up periodic cleanup
  useEffect(() => {
    if (!enabled) {
      console.log('[PresenceCleanup] Cleanup disabled for session', sessionId);
      return;
    }

    console.log(`[PresenceCleanup] Setting up cleanup for session ${sessionId}`);

    // Run cleanup immediately
    cleanupInactiveStudents();

    // Set up interval to run cleanup every minute
    const cleanupInterval = setInterval(() => {
      cleanupInactiveStudents();
    }, 60000); // Run every minute

    return () => {
      console.log(`[PresenceCleanup] Cleaning up interval for session ${sessionId}`);
      clearInterval(cleanupInterval);
    };
  }, [cleanupInactiveStudents, enabled, sessionId]);

  return { cleanupInactiveStudents };
};
