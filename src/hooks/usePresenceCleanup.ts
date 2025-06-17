
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { updateThrottler } from '@/utils/presence/updateThrottler';

interface UsePresenceCleanupProps {
  sessionId: string;
  enabled?: boolean;
}

export const usePresenceCleanup = ({ 
  sessionId, 
  enabled = true 
}: UsePresenceCleanupProps) => {
  // Clean up inactive students (those who haven't pinged in over 3 minutes)
  const cleanupInactiveStudents = useCallback(async () => {
    if (!enabled) {
      console.log(`[PresenceCleanup:${sessionId}] Cleanup disabled, skipping`);
      return;
    }

    const cleanupTime = new Date();
    // Reduced from 7 minutes to 3 minutes since we have better immediate detection
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const transactionId = `cleanup_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[PresenceCleanup:${sessionId}] Starting cleanup at ${cleanupTime.toISOString()} [${transactionId}]`);
    console.log(`[PresenceCleanup:${sessionId}] Looking for students inactive since ${threeMinutesAgo.toISOString()}`);

    try {
      // Find students who are marked as joined but haven't pinged recently
      const { data: allParticipants, error: fetchAllError } = await supabase
        .from('session_participants')
        .select('id, student_name, last_ping_at, joined_at')
        .eq('session_id', sessionId)
        .not('joined_at', 'is', null); // Only check students who are currently marked as joined

      if (fetchAllError) {
        console.error(`[PresenceCleanup:${sessionId}] Error fetching participants [${transactionId}]:`, fetchAllError);
        return;
      }

      console.log(`[PresenceCleanup:${sessionId}] Found ${allParticipants?.length || 0} joined participants [${transactionId}]:`, 
        allParticipants?.map(p => ({
          id: p.id,
          name: p.student_name,
          joined: p.joined_at ? 'YES' : 'NO',
          lastPing: p.last_ping_at || 'NEVER',
          minutesSinceLastPing: p.last_ping_at ? 
            Math.round((Date.now() - new Date(p.last_ping_at).getTime()) / 60000) : 'N/A'
        })) || []
      );

      // Filter for truly inactive students using more conservative approach
      const inactiveStudents = allParticipants?.filter(student => {
        // Check throttling - don't update if we've updated this participant recently
        if (!updateThrottler.shouldAllowUpdate(student.id)) {
          console.log(`[PresenceCleanup:${sessionId}] Skipping participant ${student.id} due to throttling [${transactionId}]`);
          return false;
        }

        // Student must have a last ping time to be considered for cleanup
        if (!student.last_ping_at) {
          // If they're marked as joined but never pinged, give them 5 minutes from join time
          if (student.joined_at) {
            const joinTime = new Date(student.joined_at);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (joinTime < fiveMinutesAgo) {
              console.log(`[PresenceCleanup:${sessionId}] Student ${student.student_name} joined but never sent heartbeat (over 5 minutes ago) [${transactionId}]`);
              return true;
            }
          }
          return false;
        }

        const lastPing = new Date(student.last_ping_at);
        const isInactive = lastPing < threeMinutesAgo;
        
        if (isInactive) {
          const minutesInactive = Math.round((Date.now() - lastPing.getTime()) / 60000);
          console.log(`[PresenceCleanup:${sessionId}] Student ${student.student_name} inactive - last ping: ${lastPing.toISOString()} (${minutesInactive} minutes ago) [${transactionId}]`);
        }
        
        return isInactive;
      }) || [];

      if (inactiveStudents.length > 0) {
        console.log(`[PresenceCleanup:${sessionId}] Found ${inactiveStudents.length} INACTIVE students [${transactionId}]:`, 
          inactiveStudents.map(s => ({ 
            id: s.id,
            name: s.student_name, 
            lastPing: s.last_ping_at,
            joinedAt: s.joined_at,
            minutesInactive: s.last_ping_at ? 
              Math.round((Date.now() - new Date(s.last_ping_at).getTime()) / 60000) : 'N/A'
          })));

        // Process each student individually to avoid bulk update conflicts
        for (const student of inactiveStudents) {
          try {
            console.log(`[PresenceCleanup:${sessionId}] Resetting student ${student.student_name} (ID: ${student.id}) to pending [${transactionId}]`);
            
            const { data: updateData, error: updateError } = await supabase
              .from('session_participants')
              .update({ 
                joined_at: null,
                last_ping_at: null 
              })
              .eq('id', student.id)
              .select();

            if (updateError) {
              console.error(`[PresenceCleanup:${sessionId}] Error resetting student ${student.student_name} [${transactionId}]:`, updateError);
            } else {
              // Record successful update
              updateThrottler.recordUpdate(student.id);
              console.log(`[PresenceCleanup:${sessionId}] Successfully reset student ${student.student_name} to pending [${transactionId}]`);
            }
          } catch (error) {
            console.error(`[PresenceCleanup:${sessionId}] Exception resetting student ${student.student_name} [${transactionId}]:`, error);
          }
        }
      } else {
        console.log(`[PresenceCleanup:${sessionId}] No inactive students found [${transactionId}]`);
        
        // Log summary for debugging
        const recentlyActiveStudents = allParticipants?.filter(s => 
          s.last_ping_at && new Date(s.last_ping_at) >= threeMinutesAgo
        ) || [];
        
        console.log(`[PresenceCleanup:${sessionId}] Status summary [${transactionId}]:`, {
          totalJoinedParticipants: allParticipants?.length || 0,
          studentsWithRecentPings: recentlyActiveStudents.length,
          studentsWithNullPings: allParticipants?.filter(s => !s.last_ping_at).length || 0,
          cutoffTime: threeMinutesAgo.toISOString(),
          thresholdMinutes: 3
        });
      }
    } catch (error) {
      console.error(`[PresenceCleanup:${sessionId}] Exception in cleanup process [${transactionId}]:`, error);
    }
  }, [sessionId, enabled]);

  // Set up periodic cleanup with reduced frequency
  useEffect(() => {
    if (!enabled) {
      console.log(`[PresenceCleanup:${sessionId}] Cleanup disabled`);
      return;
    }

    console.log(`[PresenceCleanup:${sessionId}] Setting up cleanup system with 3-minute threshold`);

    // Run cleanup immediately
    cleanupInactiveStudents();

    // Set up interval to run cleanup every 90 seconds (more frequent but less aggressive)
    const cleanupInterval = setInterval(() => {
      cleanupInactiveStudents();
    }, 90 * 1000); // Run every 90 seconds

    return () => {
      console.log(`[PresenceCleanup:${sessionId}] Cleaning up interval`);
      clearInterval(cleanupInterval);
    };
  }, [cleanupInactiveStudents, enabled, sessionId]);

  return { cleanupInactiveStudents };
};
