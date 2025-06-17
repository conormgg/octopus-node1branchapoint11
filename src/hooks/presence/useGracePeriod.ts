
import { useCallback, useRef } from 'react';

interface UseGracePeriodProps {
  studentName: string;
  markInactive: () => Promise<boolean | undefined>;
}

export const useGracePeriod = ({ studentName, markInactive }: UseGracePeriodProps) => {
  const gracePeriodTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start grace period for delayed inactive marking
  const startGracePeriod = useCallback(() => {
    // Reduced grace period from 7 minutes to 3 minutes for better responsiveness
    console.log(`[StudentPresence:${studentName}] Starting grace period - will continue heartbeat for 3 minutes`);
    
    // Clear any existing grace period
    if (gracePeriodTimeoutRef.current) {
      clearTimeout(gracePeriodTimeoutRef.current);
    }
    
    // Continue heartbeat for 3 minutes when tab is hidden/minimized
    gracePeriodTimeoutRef.current = setTimeout(() => {
      console.log(`[StudentPresence:${studentName}] Grace period expired, marking inactive`);
      markInactive().then(success => {
        console.log(`[StudentPresence:${studentName}] Grace period markInactive result:`, success);
      });
    }, 3 * 60 * 1000); // 3 minutes instead of 7
  }, [markInactive, studentName]);

  // Cancel grace period
  const cancelGracePeriod = useCallback(() => {
    if (gracePeriodTimeoutRef.current) {
      console.log(`[StudentPresence:${studentName}] Canceling grace period`);
      clearTimeout(gracePeriodTimeoutRef.current);
      gracePeriodTimeoutRef.current = null;
    }
  }, [studentName]);

  // Cleanup grace period
  const cleanupGracePeriod = useCallback(() => {
    if (gracePeriodTimeoutRef.current) {
      clearTimeout(gracePeriodTimeoutRef.current);
      gracePeriodTimeoutRef.current = null;
    }
  }, []);

  return {
    startGracePeriod,
    cancelGracePeriod,
    cleanupGracePeriod
  };
};
