
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseStudentPresenceProps {
  sessionId: string;
  studentName: string;
  participantId?: number;
}

export const useStudentPresence = ({ 
  sessionId, 
  studentName, 
  participantId 
}: UseStudentPresenceProps) => {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(false);
  const lastHeartbeatRef = useRef<Date | null>(null);

  // Send heartbeat to indicate student is active
  const sendHeartbeat = useCallback(async () => {
    if (!participantId) {
      console.log(`[StudentPresence:${studentName}] Skipping heartbeat - no participantId yet`);
      return;
    }

    const heartbeatTime = new Date();
    console.log(`[StudentPresence:${studentName}] Attempting heartbeat for participant ${participantId} at ${heartbeatTime.toISOString()}`);

    try {
      const { data, error } = await supabase
        .from('session_participants')
        .update({ 
          last_ping_at: heartbeatTime.toISOString() 
        })
        .eq('id', participantId)
        .select();

      if (error) {
        console.error(`[StudentPresence:${studentName}] Heartbeat failed:`, {
          error,
          participantId,
          sessionId,
          timestamp: heartbeatTime.toISOString()
        });
        return false;
      }

      lastHeartbeatRef.current = heartbeatTime;
      console.log(`[StudentPresence:${studentName}] Heartbeat SUCCESS:`, {
        participantId,
        timestamp: heartbeatTime.toISOString(),
        updateCount: data?.length || 0,
        data
      });
      return true;
    } catch (error) {
      console.error(`[StudentPresence:${studentName}] Heartbeat exception:`, {
        error,
        participantId,
        sessionId,
        timestamp: heartbeatTime.toISOString()
      });
      return false;
    }
  }, [participantId, studentName, sessionId]);

  // Mark student as inactive (reset to pending)
  const markInactive = useCallback(async () => {
    if (!participantId) {
      console.log(`[StudentPresence:${studentName}] Skipping mark inactive - no participantId`);
      return;
    }

    const inactiveTime = new Date();
    console.log(`[StudentPresence:${studentName}] Marking participant ${participantId} as INACTIVE at ${inactiveTime.toISOString()}`);

    try {
      const { data, error } = await supabase
        .from('session_participants')
        .update({ 
          joined_at: null,
          last_ping_at: null 
        })
        .eq('id', participantId)
        .select();

      if (error) {
        console.error(`[StudentPresence:${studentName}] Mark inactive failed:`, {
          error,
          participantId,
          sessionId,
          timestamp: inactiveTime.toISOString()
        });
        return false;
      }

      console.log(`[StudentPresence:${studentName}] Mark inactive SUCCESS:`, {
        participantId,
        timestamp: inactiveTime.toISOString(),
        updateCount: data?.length || 0,
        data
      });
      return true;
    } catch (error) {
      console.error(`[StudentPresence:${studentName}] Mark inactive exception:`, {
        error,
        participantId,
        sessionId,
        timestamp: inactiveTime.toISOString()
      });
      return false;
    }
  }, [participantId, studentName, sessionId]);

  // Start heartbeat monitoring
  const startHeartbeat = useCallback(() => {
    if (!participantId) {
      console.log(`[StudentPresence:${studentName}] Cannot start heartbeat - no participantId`);
      return;
    }

    if (isActiveRef.current) {
      console.log(`[StudentPresence:${studentName}] Heartbeat already active, skipping start`);
      return;
    }

    console.log(`[StudentPresence:${studentName}] STARTING heartbeat system for participant ${participantId}`);
    isActiveRef.current = true;

    // Send initial heartbeat immediately
    sendHeartbeat().then(success => {
      console.log(`[StudentPresence:${studentName}] Initial heartbeat result:`, success);
    });

    // Set up recurring heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      console.log(`[StudentPresence:${studentName}] Scheduled heartbeat triggered`);
      sendHeartbeat().then(success => {
        console.log(`[StudentPresence:${studentName}] Scheduled heartbeat result:`, success);
      });
    }, 30000);

    console.log(`[StudentPresence:${studentName}] Heartbeat interval set up - will send every 30 seconds`);
  }, [sendHeartbeat, participantId, studentName]);

  // Stop heartbeat and mark inactive
  const stopHeartbeat = useCallback(() => {
    console.log(`[StudentPresence:${studentName}] STOPPING heartbeat system`);
    isActiveRef.current = false;

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
      console.log(`[StudentPresence:${studentName}] Heartbeat interval cleared`);
    }

    // Mark student as inactive immediately (no delay)
    console.log(`[StudentPresence:${studentName}] Calling markInactive immediately`);
    markInactive().then(success => {
      console.log(`[StudentPresence:${studentName}] markInactive result:`, success);
    });
  }, [markInactive, studentName]);

  // Set up presence tracking only when participantId is available
  useEffect(() => {
    if (!participantId) {
      console.log(`[StudentPresence:${studentName}] Waiting for participantId...`);
      return;
    }

    console.log(`[StudentPresence:${studentName}] Setting up presence tracking for participant ${participantId} in session ${sessionId}`);
    
    startHeartbeat();

    // Handle page visibility changes - more reliable than beforeunload/unload
    const handleVisibilityChange = () => {
      console.log(`[StudentPresence:${studentName}] Visibility changed - hidden: ${document.hidden}`);
      if (document.hidden) {
        console.log(`[StudentPresence:${studentName}] Page hidden - stopping heartbeat`);
        stopHeartbeat();
      } else {
        console.log(`[StudentPresence:${studentName}] Page visible - starting heartbeat`);
        startHeartbeat();
      }
    };

    // Handle beforeunload as backup
    const handleBeforeUnload = () => {
      console.log(`[StudentPresence:${studentName}] Page unloading - stopping heartbeat`);
      stopHeartbeat();
    };

    // Handle page unload
    const handleUnload = () => {
      console.log(`[StudentPresence:${studentName}] Page unload - stopping heartbeat`);
      stopHeartbeat();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      console.log(`[StudentPresence:${studentName}] Cleaning up presence tracking`);
      stopHeartbeat();
      
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [participantId, startHeartbeat, stopHeartbeat, studentName, sessionId]);

  return {
    sendHeartbeat,
    markInactive,
    isActive: isActiveRef.current,
    lastHeartbeat: lastHeartbeatRef.current
  };
};
