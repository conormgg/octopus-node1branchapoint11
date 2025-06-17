
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { updateThrottler } from '@/utils/presence/updateThrottler';

interface UseHeartbeatProps {
  participantId?: number;
  studentName: string;
  sessionId: string;
}

export const useHeartbeat = ({ participantId, studentName, sessionId }: UseHeartbeatProps) => {
  const retryCountRef = useRef<number>(0);
  const lastHeartbeatRef = useRef<Date | null>(null);
  const maxRetries = 3;

  // Send heartbeat to indicate student is active
  const sendHeartbeat = useCallback(async () => {
    if (!participantId) {
      console.log(`[StudentPresence:${studentName}] Skipping heartbeat - no participantId yet`);
      return false;
    }

    // Check throttling before attempting update
    if (!updateThrottler.shouldAllowUpdate(participantId)) {
      const stats = updateThrottler.getStats(participantId);
      console.log(`[StudentPresence:${studentName}] Heartbeat throttled:`, stats);
      return true; // Return true to avoid triggering retry logic
    }

    const heartbeatTime = new Date();
    const transactionId = `heartbeat_${participantId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[StudentPresence:${studentName}] Attempting heartbeat for participant ${participantId} at ${heartbeatTime.toISOString()} [${transactionId}]`);

    try {
      const { data, error } = await supabase
        .from('session_participants')
        .update({ 
          last_ping_at: heartbeatTime.toISOString() 
        })
        .eq('id', participantId)
        .select();

      if (error) {
        console.error(`[StudentPresence:${studentName}] Heartbeat failed [${transactionId}]:`, {
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
          console.warn(`[StudentPresence:${studentName}] Max retries reached, will mark inactive [${transactionId}]`);
          return false;
        }
        
        // Schedule a retry with exponential backoff
        setTimeout(() => {
          sendHeartbeat();
        }, Math.pow(2, retryCountRef.current) * 1000);
        
        return false;
      }

      // Record successful update
      updateThrottler.recordUpdate(participantId);
      
      // Reset retry count on successful heartbeat
      retryCountRef.current = 0;
      lastHeartbeatRef.current = heartbeatTime;
      console.log(`[StudentPresence:${studentName}] Heartbeat SUCCESS [${transactionId}]:`, {
        participantId,
        timestamp: heartbeatTime.toISOString(),
        updateCount: data?.length || 0
      });
      return true;
    } catch (error) {
      console.error(`[StudentPresence:${studentName}] Heartbeat exception [${transactionId}]:`, {
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

    // Check throttling for inactive marking too
    if (!updateThrottler.shouldAllowUpdate(participantId)) {
      const stats = updateThrottler.getStats(participantId);
      console.log(`[StudentPresence:${studentName}] Mark inactive throttled:`, stats);
      return true; // Already inactive or will be handled by cleanup
    }

    const inactiveTime = new Date();
    const transactionId = `inactive_${participantId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[StudentPresence:${studentName}] Marking participant ${participantId} as INACTIVE at ${inactiveTime.toISOString()} [${transactionId}]`);

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
        console.error(`[StudentPresence:${studentName}] Mark inactive failed [${transactionId}]:`, {
          error,
          participantId,
          sessionId,
          timestamp: inactiveTime.toISOString()
        });
        return false;
      }

      // Record successful update
      updateThrottler.recordUpdate(participantId);

      console.log(`[StudentPresence:${studentName}] Mark inactive SUCCESS [${transactionId}]:`, {
        participantId,
        timestamp: inactiveTime.toISOString(),
        updateCount: data?.length || 0
      });
      return true;
    } catch (error) {
      console.error(`[StudentPresence:${studentName}] Mark inactive exception [${transactionId}]:`, {
        error,
        participantId,
        sessionId,
        timestamp: inactiveTime.toISOString()
      });
      return false;
    }
  }, [participantId, studentName, sessionId]);

  return {
    sendHeartbeat,
    markInactive,
    lastHeartbeat: lastHeartbeatRef.current,
    retryCount: retryCountRef.current
  };
};
