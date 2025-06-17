
import { useCallback, useRef } from 'react';

interface UseBeaconUnloadHandlerProps {
  participantId?: number;
  studentName: string;
  sessionId: string;
}

export const useBeaconUnloadHandler = ({
  participantId,
  studentName,
  sessionId
}: UseBeaconUnloadHandlerProps) => {
  const hasUnloadedRef = useRef(false);

  // Send beacon to immediately mark student inactive
  const sendInactiveBeacon = useCallback((reason: string = 'page_unload') => {
    if (!participantId || hasUnloadedRef.current) {
      return;
    }

    hasUnloadedRef.current = true;
    console.log(`[BeaconUnload:${studentName}] Sending beacon to mark inactive - reason: ${reason}`);

    const payload = {
      participantId,
      studentName,
      reason
    };

    const beaconUrl = `https://igzgxtjkaaabziccoofe.supabase.co/functions/v1/mark-student-inactive`;
    
    try {
      // Use sendBeacon for reliable unload detection
      if (navigator.sendBeacon) {
        const success = navigator.sendBeacon(
          beaconUrl,
          JSON.stringify(payload)
        );
        console.log(`[BeaconUnload:${studentName}] Beacon sent successfully:`, success);
      } else {
        // Fallback for browsers without sendBeacon support
        fetch(beaconUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(error => {
          console.error(`[BeaconUnload:${studentName}] Fallback fetch failed:`, error);
        });
      }
    } catch (error) {
      console.error(`[BeaconUnload:${studentName}] Beacon error:`, error);
    }
  }, [participantId, studentName]);

  // Reset unload flag (for development/testing)
  const resetUnloadFlag = useCallback(() => {
    hasUnloadedRef.current = false;
  }, []);

  return {
    sendInactiveBeacon,
    resetUnloadFlag,
    hasUnloaded: hasUnloadedRef.current
  };
};
