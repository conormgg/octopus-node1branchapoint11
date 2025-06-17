
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
    if (!enabled) return;

    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      
      // Find students who joined but haven't pinged recently
      const { data: inactiveStudents, error: fetchError } = await supabase
        .from('session_participants')
        .select('id, student_name')
        .eq('session_id', sessionId)
        .not('joined_at', 'is', null)
        .or(`last_ping_at.is.null,last_ping_at.lt.${twoMinutesAgo}`);

      if (fetchError) {
        console.error('Error fetching inactive students:', fetchError);
        return;
      }

      if (inactiveStudents && inactiveStudents.length > 0) {
        console.log(`Cleaning up ${inactiveStudents.length} inactive students:`, 
          inactiveStudents.map(s => s.student_name));

        // Reset them to pending state
        const { error: updateError } = await supabase
          .from('session_participants')
          .update({ 
            joined_at: null,
            last_ping_at: null 
          })
          .in('id', inactiveStudents.map(s => s.id));

        if (updateError) {
          console.error('Error cleaning up inactive students:', updateError);
        }
      }
    } catch (error) {
      console.error('Error in cleanup process:', error);
    }
  }, [sessionId, enabled]);

  // Set up periodic cleanup
  useEffect(() => {
    if (!enabled) return;

    // Run cleanup immediately
    cleanupInactiveStudents();

    // Set up interval to run cleanup every minute
    const cleanupInterval = setInterval(() => {
      cleanupInactiveStudents();
    }, 60000); // Run every minute

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [cleanupInactiveStudents, enabled]);

  return { cleanupInactiveStudents };
};
