
import { useCallback } from 'react';

interface UsePresenceEventHandlersProps {
  studentName: string;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  markInactive: () => Promise<boolean | undefined>;
  startGracePeriod: () => void;
  cancelGracePeriod: () => void;
  sendInactiveBeacon: (reason: string) => void;
  isActive: boolean;
}

export const usePresenceEventHandlers = ({
  studentName,
  startHeartbeat,
  stopHeartbeat,
  markInactive,
  startGracePeriod,
  cancelGracePeriod,
  sendInactiveBeacon,
  isActive
}: UsePresenceEventHandlersProps) => {

  // Handle page visibility changes - DON'T send beacon, just note the change
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

  // Handle beforeunload - send beacon immediately for real page departure
  const handleBeforeUnload = useCallback(() => {
    console.log(`[StudentPresence:${studentName}] Page beforeunload - sending beacon immediately`);
    sendInactiveBeacon('beforeunload');
    stopHeartbeat();
  }, [studentName, sendInactiveBeacon, stopHeartbeat]);

  // Handle pagehide - additional signal for page termination
  const handlePageHide = useCallback((event: PageTransitionEvent) => {
    console.log(`[StudentPresence:${studentName}] Page hide - persisted: ${event.persisted}`);
    if (!event.persisted) {
      // Page is being unloaded (not going into back/forward cache)
      sendInactiveBeacon('pagehide');
      stopHeartbeat();
    }
  }, [studentName, sendInactiveBeacon, stopHeartbeat]);

  // Handle page unload as backup
  const handleUnload = useCallback(() => {
    console.log(`[StudentPresence:${studentName}] Page unload - sending beacon as backup`);
    sendInactiveBeacon('unload');
    stopHeartbeat();
  }, [studentName, sendInactiveBeacon, stopHeartbeat]);

  // Handle window focus/blur for additional presence signals
  const handleFocus = useCallback(() => {
    console.log(`[StudentPresence:${studentName}] Window focused - ensuring heartbeat is active`);
    if (!isActive) {
      startHeartbeat();
    }
  }, [studentName, isActive, startHeartbeat]);

  const handleBlur = useCallback(() => {
    console.log(`[StudentPresence:${studentName}] Window blurred - continuing heartbeat with grace period`);
    // Don't send beacon on blur, just start grace period
    startGracePeriod();
  }, [studentName, startGracePeriod]);

  return {
    handleVisibilityChange,
    handleBeforeUnload,
    handlePageHide,
    handleUnload,
    handleFocus,
    handleBlur
  };
};
