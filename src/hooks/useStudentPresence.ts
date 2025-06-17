
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

  // Send heartbeat to indicate student is active
  const sendHeartbeat = useCallback(async () => {
    if (!participantId) {
      console.log('[StudentPresence] Skipping heartbeat - no participantId yet');
      return;
    }

    console.log(`[StudentPresence] Sending heartbeat for participant ${participantId} (${studentName})`);

    try {
      const { error } = await supabase
        .from('session_participants')
        .update({ 
          last_ping_at: new Date().toISOString() 
        })
        .eq('id', participantId);

      if (error) {
        console.error('[StudentPresence] Error sending heartbeat:', error);
      } else {
        console.log('[StudentPresence] Heartbeat sent successfully');
      }
    } catch (error) {
      console.error('[StudentPresence] Exception sending heartbeat:', error);
    }
  }, [participantId, studentName]);

  // Mark student as inactive (reset to pending)
  const markInactive = useCallback(async () => {
    if (!participantId) {
      console.log('[StudentPresence] Skipping mark inactive - no participantId');
      return;
    }

    console.log(`[StudentPresence] Marking participant ${participantId} (${studentName}) as inactive`);

    try {
      const { error } = await supabase
        .from('session_participants')
        .update({ 
          joined_at: null,
          last_ping_at: null 
        })
        .eq('id', participantId);

      if (error) {
        console.error('[StudentPresence] Error marking student inactive:', error);
      } else {
        console.log('[StudentPresence] Student marked as inactive successfully');
      }
    } catch (error) {
      console.error('[StudentPresence] Exception marking student inactive:', error);
    }
  }, [participantId, studentName]);

  // Start heartbeat monitoring
  const startHeartbeat = useCallback(() => {
    if (!participantId) {
      console.log('[StudentPresence] Cannot start heartbeat - no participantId');
      return;
    }

    if (isActiveRef.current) {
      console.log('[StudentPresence] Heartbeat already active, skipping start');
      return;
    }

    console.log(`[StudentPresence] Starting heartbeat for participant ${participantId} (${studentName})`);
    isActiveRef.current = true;

    // Send initial heartbeat
    sendHeartbeat();

    // Set up recurring heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 30000);
  }, [sendHeartbeat, participantId, studentName]);

  // Stop heartbeat and mark inactive
  const stopHeartbeat = useCallback(() => {
    console.log(`[StudentPresence] Stopping heartbeat for ${studentName}`);
    isActiveRef.current = false;

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
      console.log('[StudentPresence] Heartbeat interval cleared');
    }

    // Mark student as inactive after a short delay
    cleanupTimeoutRef.current = setTimeout(() => {
      markInactive();
    }, 1000);
  }, [markInactive, studentName]);

  // Set up presence tracking only when participantId is available
  useEffect(() => {
    if (!participantId) {
      console.log(`[StudentPresence] Waiting for participantId for ${studentName}`);
      return;
    }

    console.log(`[StudentPresence] Setting up presence tracking for participant ${participantId} (${studentName})`);
    
    startHeartbeat();

    // Handle page visibility changes - more reliable than beforeunload/unload
    const handleVisibilityChange = () => {
      console.log(`[StudentPresence] Visibility changed - hidden: ${document.hidden}`);
      if (document.hidden) {
        stopHeartbeat();
      } else {
        startHeartbeat();
      }
    };

    // Handle beforeunload as backup (less reliable)
    const handleBeforeUnload = () => {
      console.log('[StudentPresence] Page unloading - stopping heartbeat');
      stopHeartbeat();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log(`[StudentPresence] Cleaning up presence tracking for ${studentName}`);
      stopHeartbeat();
      
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [participantId, startHeartbeat, stopHeartbeat, studentName]);

  return {
    sendHeartbeat,
    markInactive
  };
};
