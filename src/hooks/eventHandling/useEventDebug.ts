
import { useRef } from 'react';

export const useEventDebug = (palmRejectionConfig: { enabled: boolean }) => {
  const eventSystemRef = useRef<'pointer' | 'touch' | 'mouse' | null>(null);
  const lastEventTimestamp = useRef<number>(0);
  const eventDebugCounter = useRef<number>(0);

  const logEventHandling = (eventType: string, source: 'pointer' | 'touch' | 'mouse', detail?: any) => {
    const now = Date.now();
    const timeSinceLastEvent = now - lastEventTimestamp.current;
    eventDebugCounter.current++;
    
    console.log(`[EventDebug ${eventDebugCounter.current}] ${eventType} from ${source}`, {
      currentSystem: eventSystemRef.current,
      supportsPointer: typeof window !== 'undefined' && window.PointerEvent && 'onpointerdown' in window,
      palmRejectionEnabled: palmRejectionConfig.enabled,
      timeSinceLastEvent,
      detail
    });
    
    // Detect potential duplicates (events within 10ms)
    if (timeSinceLastEvent < 10 && eventSystemRef.current && eventSystemRef.current !== source) {
      console.warn(`[EventDebug] Potential duplicate event detected! Previous: ${eventSystemRef.current}, Current: ${source}, Gap: ${timeSinceLastEvent}ms`);
    }
    
    eventSystemRef.current = source;
    lastEventTimestamp.current = now;
  };

  return { logEventHandling };
};
