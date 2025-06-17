
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
  const gracePeriodTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(false);
  const lastHeartbeatRef = useRef<Date | null>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 3;

  // Send heartbeat to indicate student is active
  const sendHeartbeat = useCallback(async () => {
    if (!participantId) {
      console.log(`[StudentPresence:${studentName}] Skipping heartbeat - no participantId yet`);
      return false;
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
          timestamp: heartbeatTime.toISOString(),
          retryCount: retryCountRef.current
        });
        
        // Increment retry count but don't give up immediately
        retryCountRef.current += 1;
        
        // Only stop trying after max retries
        if (retryCountRef.current >= maxRetries) {
          console.warn(`[StudentPresence:${studentName}] Max retries reached, will mark inactive`);
          return false;
        }
        
        // Schedule a retry with exponential backoff
        setTimeout(() => {
          if (isActiveRef.current) {
            sendHeartbeat();
          }
        }, Math.pow(2, retryCountRef.current) * 1000);
        
        return false;
      }

      // Reset retry count on successful heartbeat
      retryCountRef.current = 0;
      lastHeartbeatRef.current = heartbeatTime;
      console.log(`[StudentPresence:${studentName}] Heartbeat SUCCESS:`, {
        participantId,
        timestamp: heartbeatTime.toISOString(),
        updateCount: data?.length || 0
      });
      return true;
    } catch (error) {
      console.error(`[StudentPresence:${studentName}] Heartbeat exception:`, {
        error,
        participantId,
        sessionId,
        timestamp: heartbeatTime.toISOString()
      });
      retryCountRef.current += 1;
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
        updateCount: data?.length || 0
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
    retryCountRef.current = 0;

    // Send initial heartbeat immediately
    sendHeartbeat().then(success => {
      console.log(`[StudentPresence:${studentName}] Initial heartbeat result:`, success);
    });

    // Set up recurring heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      console.log(`[StudentPresence:${studentName}] Scheduled heartbeat triggered`);
      sendHeartbeat().then(success => {
        console.log(`[StudentPresence:${studentName}] Scheduled heartbeat result:`, success);
        
        // If heartbeat fails after max retries, stop the system
        if (!success && retryCountRef.current >= maxRetries) {
          console.warn(`[StudentPresence:${studentName}] Stopping heartbeat due to repeated failures`);
          stopHeartbeat();
        }
      });
    }, 30000);

    console.log(`[StudentPresence:${studentName}] Heartbeat interval set up - will send every 30 seconds`);
  }, [sendHeartbeat, participantId, studentName]);

  // Stop heartbeat and mark inactive with grace period
  const stopHeartbeat = useCallback((immediate: boolean = false) => {
    console.log(`[StudentPresence:${studentName}] STOPPING heartbeat system (immediate: ${immediate})`);
    isActiveRef.current = false;

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
      console.log(`[StudentPresence:${studentName}] Heartbeat interval cleared`);
    }

    if (gracePeriodTimeoutRef.current) {
      clearTimeout(gracePeriodTimeoutRef.current);
      gracePeriodTimeoutRef.current = null;
    }

    if (immediate) {
      // Mark as inactive immediately (for actual page unload)
      console.log(`[StudentPresence:${studentName}] Calling markInactive immediately`);
      markInactive().then(success => {
        console.log(`[StudentPresence:${studentName}] markInactive result:`, success);
      });
    }
  }, [markInactive, studentName]);

  // Start grace period for delayed inactive marking
  const startGracePeriod = useCallback(() => {
    console.log(`[StudentPresence:${studentName}] Starting grace period - will continue heartbeat for 7 minutes`);
    
    // Continue heartbeat for 7 minutes even when tab is hidden
    gracePeriodTimeoutRef.current = setTimeout(() => {
      if (!isActiveRef.current) {
        console.log(`[StudentPresence:${studentName}] Grace period expired, marking inactive`);
        markInactive().then(success => {
          console.log(`[StudentPresence:${studentName}] Grace period markInactive result:`, success);
        });
      }
    }, 7 * 60 * 1000); // 7 minutes
  }, [markInactive, studentName]);

  // Set up presence tracking only when participantId is available
  useEffect(() => {
    if (!participantId) {
      console.log(`[StudentPresence:${studentName}] Waiting for participantId...`);
      return;
    }

    console.log(`[StudentPresence:${studentName}] Setting up presence tracking for participant ${participantId} in session ${sessionId}`);
    
    startHeartbeat();

    // Handle page visibility changes - DON'T stop heartbeat, just note the change
    const handleVisibilityChange = () => {
      console.log(`[StudentPresence:${studentName}] Visibility changed - hidden: ${document.hidden}`);
      if (document.hidden) {
        console.log(`[StudentPresence:${studentName}] Page hidden - starting grace period but continuing heartbeat`);
        startGracePeriod();
      } else {
        console.log(`[StudentPresence:${studentName}] Page visible - canceling grace period`);
        if (gracePeriodTimeoutRef.current) {
          clearTimeout(gracePeriodTimeoutRef.current);
          gracePeriodTimeoutRef.current = null;
        }
        
        // Ensure heartbeat is still running
        if (!isActiveRef.current) {
          startHeartbeat();
        }
      }
    };

    // Handle beforeunload - this is the main signal for user leaving
    const handleBeforeUnload = () => {
      console.log(`[StudentPresence:${studentName}] Page unloading - stopping heartbeat immediately`);
      stopHeartbeat(true);
    };

    // Handle page unload as backup
    const handleUnload = () => {
      console.log(`[StudentPresence:${studentName}] Page unload - stopping heartbeat immediately`);
      stopHeartbeat(true);
    };

    // Handle window focus/blur for additional presence signals
    const handleFocus = () => {
      console.log(`[StudentPresence:${studentName}] Window focused - ensuring heartbeat is active`);
      if (!isActiveRef.current) {
        startHeartbeat();
      }
    };

    const handleBlur = () => {
      console.log(`[StudentPresence:${studentName}] Window blurred - continuing heartbeat with grace period`);
      // Don't stop heartbeat on blur, just start grace period
      startGracePeriod();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      console.log(`[StudentPresence:${studentName}] Cleaning up presence tracking`);
      stopHeartbeat(true);
      
      if (gracePeriodTimeoutRef.current) {
        clearTimeout(gracePeriodTimeoutRef.current);
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [participantId, startHeartbeat, stopHeartbeat, startGracePeriod, studentName, sessionId]);

  return {
    sendHeartbeat,
    markInactive,
    isActive: isActiveRef.current,
    lastHeartbeat: lastHeartbeatRef.current
  };
};
