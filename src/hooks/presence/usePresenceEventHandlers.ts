
import { useCallback } from 'react';

interface UsePresenceEventHandlersProps {
  studentName: string;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  markInactive: () => Promise<boolean | undefined>;
  startGracePeriod: () => void;
  cancelGracePeriod: () => void;
  isActive: boolean;
}

export const usePresenceEventHandlers = ({
  studentName,
  startHeartbeat,
  stopHeartbeat,
  markInactive,
  startGracePeriod,
  cancelGracePeriod,
  isActive
}: UsePresenceEventHandlersProps) => {

  // Handle page visibility changes - DON'T stop heartbeat, just note the change
  const handleVisibilityChange = useCallback(() => {
    console.log(`[StudentPresence:${studentName}] Visibility changed - hidden: ${document.hidden}`);
    if (document.hidden) {
      console.log(`[StudentPresence:${studentName}] Page hidden - starting grace period but continuing heartbeat`);
      startGracePeriod();
    } else {
      console.log(`[StudentPresence:${studentName}] Page visible - canceling grace period`);
      cancelGracePeriod();
      
      // Ensure heartbeat is still running
      if (!isActive) {
        startHeartbeat();
      }
    }
  }, [studentName, startGracePeriod, cancelGracePeriod, isActive, startHeartbeat]);

  // Handle beforeunload - this is the main signal for user leaving
  const handleBeforeUnload = useCallback(() => {
    console.log(`[StudentPresence:${studentName}] Page unloading - stopping heartbeat immediately`);
    stopHeartbeat();
    markInactive();
  }, [studentName, stopHeartbeat, markInactive]);

  // Handle page unload as backup
  const handleUnload = useCallback(() => {
    console.log(`[StudentPresence:${studentName}] Page unload - stopping heartbeat immediately`);
    stopHeartbeat();
    markInactive();
  }, [studentName, stopHeartbeat, markInactive]);

  // Handle window focus/blur for additional presence signals
  const handleFocus = useCallback(() => {
    console.log(`[StudentPresence:${studentName}] Window focused - ensuring heartbeat is active`);
    if (!isActive) {
      startHeartbeat();
    }
  }, [studentName, isActive, startHeartbeat]);

  const handleBlur = useCallback(() => {
    console.log(`[StudentPresence:${studentName}] Window blurred - continuing heartbeat with grace period`);
    // Don't stop heartbeat on blur, just start grace period
    startGracePeriod();
  }, [studentName, startGracePeriod]);

  return {
    handleVisibilityChange,
    handleBeforeUnload,
    handleUnload,
    handleFocus,
    handleBlur
  };
};
