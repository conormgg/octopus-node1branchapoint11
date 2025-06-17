
import { useCallback, useRef } from 'react';

interface UseHeartbeatIntervalProps {
  participantId?: number;
  studentName: string;
  sendHeartbeat: () => Promise<boolean>;
  onMaxRetriesReached: () => void;
}

export const useHeartbeatInterval = ({ 
  participantId, 
  studentName, 
  sendHeartbeat, 
  onMaxRetriesReached 
}: UseHeartbeatIntervalProps) => {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(false);
  const maxRetries = 3;

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
        
        // If heartbeat fails after max retries, stop the system
        if (!success) {
          console.warn(`[StudentPresence:${studentName}] Stopping heartbeat due to repeated failures`);
          stopHeartbeat();
          onMaxRetriesReached();
        }
      });
    }, 30000);

    console.log(`[StudentPresence:${studentName}] Heartbeat interval set up - will send every 30 seconds`);
  }, [sendHeartbeat, participantId, studentName, onMaxRetriesReached]);

  // Stop heartbeat monitoring
  const stopHeartbeat = useCallback(() => {
    console.log(`[StudentPresence:${studentName}] STOPPING heartbeat system`);
    isActiveRef.current = false;

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
      console.log(`[StudentPresence:${studentName}] Heartbeat interval cleared`);
    }
  }, [studentName]);

  return {
    startHeartbeat,
    stopHeartbeat,
    isActive: isActiveRef.current
  };
};
