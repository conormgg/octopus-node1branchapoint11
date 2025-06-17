
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

  // Send heartbeat to indicate student is active
  const sendHeartbeat = useCallback(async () => {
    if (!participantId) return;

    try {
      await supabase
        .from('session_participants')
        .update({ 
          last_ping_at: new Date().toISOString() 
        })
        .eq('id', participantId);
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }, [participantId]);

  // Mark student as inactive (reset to pending)
  const markInactive = useCallback(async () => {
    if (!participantId) return;

    try {
      await supabase
        .from('session_participants')
        .update({ 
          joined_at: null,
          last_ping_at: null 
        })
        .eq('id', participantId);
    } catch (error) {
      console.error('Error marking student inactive:', error);
    }
  }, [participantId]);

  // Start heartbeat monitoring
  const startHeartbeat = useCallback(() => {
    // Send initial heartbeat
    sendHeartbeat();

    // Set up recurring heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 30000);
  }, [sendHeartbeat]);

  // Stop heartbeat and mark inactive
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Mark student as inactive after a short delay
    cleanupTimeoutRef.current = setTimeout(() => {
      markInactive();
    }, 1000);
  }, [markInactive]);

  // Set up presence tracking
  useEffect(() => {
    startHeartbeat();

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopHeartbeat();
      } else {
        startHeartbeat();
      }
    };

    // Handle beforeunload (page close/refresh)
    const handleBeforeUnload = () => {
      stopHeartbeat();
    };

    // Handle page unload
    const handleUnload = () => {
      // Use sendBeacon for reliable delivery during page unload
      if (participantId && navigator.sendBeacon) {
        const data = new FormData();
        data.append('participantId', participantId.toString());
        navigator.sendBeacon('/api/student-disconnect', data);
      } else {
        markInactive();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      stopHeartbeat();
      
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [startHeartbeat, stopHeartbeat, participantId, markInactive]);

  return {
    sendHeartbeat,
    markInactive
  };
};
