
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
  // Clean up inactive students (those who haven't pinged in over 3 minutes)
  const cleanupInactiveStudents = useCallback(async () => {
    if (!enabled) {
      console.log(`[PresenceCleanup:${sessionId}] Cleanup disabled, skipping`);
      return;
    }

    const cleanupTime = new Date();
    // Reduced from 7 minutes to 3 minutes since we now have immediate beacon detection
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    
    console.log(`[PresenceCleanup:${sessionId}] Starting cleanup at ${cleanupTime.toISOString()}`);
    console.log(`[PresenceCleanup:${sessionId}] Looking for students inactive since ${threeMinutesAgo.toISOString()}`);

    try {
      // Find students who joined but haven't pinged recently
      const { data: allParticipants, error: fetchAllError } = await supabase
        .from('session_participants')
        .select('id, student_name, last_ping_at, joined_at')
        .eq('session_id', sessionId);

      if (fetchAllError) {
        console.error(`[PresenceCleanup:${sessionId}] Error fetching all participants:`, fetchAllError);
        return;
      }

      console.log(`[PresenceCleanup:${sessionId}] Found ${allParticipants?.length || 0} total participants:`, 
        allParticipants?.map(p => ({
          name: p.student_name,
          joined: p.joined_at ? 'YES' : 'NO',
          lastPing: p.last_ping_at || 'NEVER',
          minutesSinceLastPing: p.last_ping_at ? 
            Math.round((Date.now() - new Date(p.last_ping_at).getTime()) / 60000) : 'N/A'
        })) || []
      );

      // Filter for inactive students (more aggressive since beacon handles immediate detection)
      const inactiveStudents = allParticipants?.filter(student => {
        // Must have joined (joined_at is not null)
        if (!student.joined_at) {
          return false;
        }

        // Must either have never pinged OR last ping was over 3 minutes ago
        if (!student.last_ping_at) {
          // If they joined but never sent a heartbeat, give them 5 minutes
          const joinTime = new Date(student.joined_at);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          if (joinTime < fiveMinutesAgo) {
            console.log(`[PresenceCleanup:${sessionId}] Student ${student.student_name} joined but never sent heartbeat (over 5 minutes ago)`);
            return true;
          }
          return false;
        }

        const lastPing = new Date(student.last_ping_at);
        const isInactive = lastPing < threeMinutesAgo;
        
        if (isInactive) {
          const minutesInactive = Math.round((Date.now() - lastPing.getTime()) / 60000);
          console.log(`[PresenceCleanup:${sessionId}] Student ${student.student_name} inactive - last ping: ${lastPing.toISOString()} (${minutesInactive} minutes ago)`);
        }
        
        return isInactive;
      }) || [];

      if (inactiveStudents.length > 0) {
        console.log(`[PresenceCleanup:${sessionId}] Found ${inactiveStudents.length} INACTIVE students:`, 
          inactiveStudents.map(s => ({ 
            id: s.id,
            name: s.student_name, 
            lastPing: s.last_ping_at,
            joinedAt: s.joined_at,
            minutesInactive: s.last_ping_at ? 
              Math.round((Date.now() - new Date(s.last_ping_at).getTime()) / 60000) : 'N/A'
          })));

        // Reset them to pending state
        const { data: updateData, error: updateError } = await supabase
          .from('session_participants')
          .update({ 
            joined_at: null,
            last_ping_at: null 
          })
          .in('id', inactiveStudents.map(s => s.id))
          .select();

        if (updateError) {
          console.error(`[PresenceCleanup:${sessionId}] Error cleaning up inactive students:`, updateError);
        } else {
          console.log(`[PresenceCleanup:${sessionId}] Successfully reset ${inactiveStudents.length} students to pending state:`, updateData);
        }
      } else {
        console.log(`[PresenceCleanup:${sessionId}] No inactive students found`);
        
        // Log details about why no students were found inactive
        const joinedStudents = allParticipants?.filter(s => s.joined_at) || [];
        const recentlyActiveStudents = joinedStudents.filter(s => 
          s.last_ping_at && new Date(s.last_ping_at) >= threeMinutesAgo
        );
        console.log(`[PresenceCleanup:${sessionId}] Status summary:`, {
          totalParticipants: allParticipants?.length || 0,
          joinedStudents: joinedStudents.length,
          studentsWithRecentPings: recentlyActiveStudents.length,
          studentsWithNullPings: joinedStudents.filter(s => !s.last_ping_at).length,
          cutoffTime: threeMinutesAgo.toISOString(),
          thresholdMinutes: 3
        });
      }
    } catch (error) {
      console.error(`[PresenceCleanup:${sessionId}] Exception in cleanup process:`, error);
    }
  }, [sessionId, enabled]);

  // Set up periodic cleanup
  useEffect(() => {
    if (!enabled) {
      console.log(`[PresenceCleanup:${sessionId}] Cleanup disabled`);
      return;
    }

    console.log(`[PresenceCleanup:${sessionId}] Setting up cleanup system with 3-minute threshold`);

    // Run cleanup immediately
    cleanupInactiveStudents();

    // Set up interval to run cleanup every 90 seconds (more frequent checks with shorter threshold)
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
