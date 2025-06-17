import { useEffect } from 'react';
import { useHeartbeat } from './presence/useHeartbeat';
import { useHeartbeatInterval } from './presence/useHeartbeatInterval';
import { useGracePeriod } from './presence/useGracePeriod';
import { usePresenceEventHandlers } from './presence/usePresenceEventHandlers';
import { usePresenceMonitor } from './presence/usePresenceMonitor';

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
  // Core heartbeat functionality
  const { sendHeartbeat, markInactive, lastHeartbeat } = useHeartbeat({
    participantId,
    studentName,
    sessionId
  });

  // Grace period management
  const { startGracePeriod, cancelGracePeriod, cleanupGracePeriod } = useGracePeriod({
    studentName,
    markInactive
  });

  // Heartbeat interval management
  const { startHeartbeat, stopHeartbeat, isActive } = useHeartbeatInterval({
    participantId,
    studentName,
    sendHeartbeat,
    onMaxRetriesReached: () => {
      // If max retries reached, start grace period before marking inactive
      startGracePeriod();
    }
  });

  // Event handlers for presence detection
  const {
    handleVisibilityChange,
    handleBeforeUnload,
    handleUnload,
    handleFocus,
    handleBlur
  } = usePresenceEventHandlers({
    studentName,
    startHeartbeat,
    stopHeartbeat,
    markInactive,
    startGracePeriod,
    cancelGracePeriod,
    isActive
  });

  // Add presence monitoring
  const { getStats } = usePresenceMonitor({
    participantId,
    studentName,
    enabled: !!participantId
  });

  // Set up presence tracking only when participantId is available
  useEffect(() => {
    if (!participantId) {
      console.log(`[StudentPresence:${studentName}] Waiting for participantId...`);
      return;
    }

    console.log(`[StudentPresence:${studentName}] Setting up presence tracking for participant ${participantId} in session ${sessionId}`);
    
    startHeartbeat();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      console.log(`[StudentPresence:${studentName}] Cleaning up presence tracking`);
      stopHeartbeat();
      markInactive();
      cleanupGracePeriod();

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [
    participantId,
    startHeartbeat,
    stopHeartbeat,
    handleVisibilityChange,
    handleBeforeUnload,
    handleUnload,
    handleFocus,
    handleBlur,
    markInactive,
    cleanupGracePeriod,
    studentName,
    sessionId
  ]);

  return {
    sendHeartbeat,
    markInactive,
    isActive,
    lastHeartbeat,
    getPresenceStats: getStats
  };
};
