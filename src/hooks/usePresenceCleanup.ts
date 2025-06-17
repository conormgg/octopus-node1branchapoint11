
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
  // Clean up inactive students (those who haven't pinged in over 7 minutes)
  const cleanupInactiveStudents = useCallback(async () => {
    if (!enabled) {
      console.log(`[PresenceCleanup:${sessionId}] Cleanup disabled, skipping`);
      return;
    }

    const cleanupTime = new Date();
    // Increased from 2 minutes to 7 minutes to account for grace period
    const sevenMinutesAgo = new Date(Date.now() - 7 * 60 * 1000);
    
    console.log(`[PresenceCleanup:${sessionId}] Starting cleanup at ${cleanupTime.toISOString()}`);
    console.log(`[PresenceCleanup:${sessionId}] Looking for students inactive since ${sevenMinutesAgo.toISOString()}`);

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

      // Filter for inactive students (more conservative approach)
      const inactiveStudents = allParticipants?.filter(student => {
        // Must have joined (joined_at is not null)
        if (!student.joined_at) {
          return false;
        }

        // Must either have never pinged OR last ping was over 7 minutes ago
        if (!student.last_ping_at) {
          // If they joined but never sent a heartbeat, give them more time (10 minutes)
          const joinTime = new Date(student.joined_at);
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
          if (joinTime < tenMinutesAgo) {
            console.log(`[PresenceCleanup:${sessionId}] Student ${student.student_name} joined but never sent heartbeat (over 10 minutes ago)`);
            return true;
          }
          return false;
        }

        const lastPing = new Date(student.last_ping_at);
        const isInactive = lastPing < sevenMinutesAgo;
        
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
          s.last_ping_at && new Date(s.last_ping_at) >= sevenMinutesAgo
        );
        console.log(`[PresenceCleanup:${sessionId}] Status summary:`, {
          totalParticipants: allParticipants?.length || 0,
          joinedStudents: joinedStudents.length,
          studentsWithRecentPings: recentlyActiveStudents.length,
          studentsWithNullPings: joinedStudents.filter(s => !s.last_ping_at).length,
          cutoffTime: sevenMinutesAgo.toISOString(),
          thresholdMinutes: 7
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

    console.log(`[PresenceCleanup:${sessionId}] Setting up cleanup system with 7-minute threshold`);

    // Run cleanup immediately
    cleanupInactiveStudents();

    // Set up interval to run cleanup every 2 minutes (more frequent checks)
    const cleanupInterval = setInterval(() => {
      cleanupInactiveStudents();
    }, 2 * 60 * 1000); // Run every 2 minutes

    return () => {
      console.log(`[PresenceCleanup:${sessionId}] Cleaning up interval`);
      clearInterval(cleanupInterval);
    };
  }, [cleanupInactiveStudents, enabled, sessionId]);

  return { cleanupInactiveStudents };
};
