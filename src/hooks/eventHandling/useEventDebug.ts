
import { useRef } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

interface EventDetail {
  counter?: number;
  currentSystem?: string | null;
  supportsPointer?: boolean;
  palmRejectionEnabled?: boolean;
  timeSinceLastEvent?: number;
  [key: string]: unknown;
}

export const useEventDebug = (palmRejectionConfig: { enabled: boolean }) => {
  const eventSystemRef = useRef<'pointer' | 'touch' | 'mouse' | null>(null);
  const lastEventTimestamp = useRef<number>(0);
  const eventDebugCounter = useRef<number>(0);

  const logEventHandling = (eventType: string, source: 'pointer' | 'touch' | 'mouse', detail?: EventDetail) => {
    const now = Date.now();
    const timeSinceLastEvent = now - lastEventTimestamp.current;
    eventDebugCounter.current++;
    
    debugLog('EventHandling', `${eventType} from ${source}`, {
      counter: eventDebugCounter.current,
      currentSystem: eventSystemRef.current,
      supportsPointer: typeof window !== 'undefined' && window.PointerEvent && 'onpointerdown' in window,
      palmRejectionEnabled: palmRejectionConfig.enabled,
      timeSinceLastEvent,
      ...detail
    });
    
    // Phase 3: Improved duplicate detection with reduced noise
    // Only log duplicates if they're from different sources and very close together
    if (timeSinceLastEvent < 5 && eventSystemRef.current && eventSystemRef.current !== source) {
      console.warn(`[EventDebug] Potential duplicate event detected! Previous: ${eventSystemRef.current}, Current: ${source}, Gap: ${timeSinceLastEvent}ms`);
    }
    
    eventSystemRef.current = source;
    lastEventTimestamp.current = now;
  };

  return { logEventHandling };
};
