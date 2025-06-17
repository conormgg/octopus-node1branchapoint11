
import { useEffect } from 'react';
import { useHeartbeat } from './presence/useHeartbeat';
import { useHeartbeatInterval } from './presence/useHeartbeatInterval';
import { useGracePeriod } from './presence/useGracePeriod';
import { usePresenceEventHandlers } from './presence/usePresenceEventHandlers';
import { useBeaconUnloadHandler } from './presence/useBeaconUnloadHandler';

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

  // Grace period management (reduced to 3 minutes)
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

  // Beacon-based unload detection for immediate marking
  const { sendInactiveBeacon } = useBeaconUnloadHandler({
    participantId,
    studentName,
    sessionId
  });

  // Event handlers for presence detection
  const {
    handleVisibilityChange,
    handleBeforeUnload,
    handlePageHide,
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
    sendInactiveBeacon,
    isActive
  });

  // Set up presence tracking only when participantId is available
  useEffect(() => {
    if (!participantId) {
      console.log(`[StudentPresence:${studentName}] Waiting for participantId...`);
      return;
    }

    console.log(`[StudentPresence:${studentName}] Setting up enhanced presence tracking for participant ${participantId} in session ${sessionId}`);
    
    startHeartbeat();

    // Standard presence events
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    // Unload detection events (beacon-based)
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('unload', handleUnload);

    return () => {
      console.log(`[StudentPresence:${studentName}] Cleaning up enhanced presence tracking`);
      
      // Send final beacon on cleanup
      sendInactiveBeacon('cleanup');
      
      stopHeartbeat();
      cleanupGracePeriod();

      // Remove all event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('unload', handleUnload);
    };
  }, [
    participantId,
    startHeartbeat,
    stopHeartbeat,
    handleVisibilityChange,
    handleBeforeUnload,
    handlePageHide,
    handleUnload,
    handleFocus,
    handleBlur,
    sendInactiveBeacon,
    cleanupGracePeriod,
    studentName,
    sessionId
  ]);

  return {
    sendHeartbeat,
    markInactive,
    isActive,
    lastHeartbeat
  };
};
