import { useCallback, useRef } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

type EventSource = 'pointer' | 'touch' | 'mouse';

interface EventEntry {
  timestamp: number;
  source: EventSource;
  type: string;
  x?: number;
  y?: number;
}

/**
 * Phase 3: Event Deduplication
 * 
 * This hook prevents duplicate event processing by tracking recent events
 * and implementing source prioritization (pointer > touch > mouse).
 */
export const useEventDeduplication = () => {
  const recentEventsRef = useRef<EventEntry[]>([]);
  const DEDUPLICATION_WINDOW = 20; // ms
  const MAX_HISTORY = 10;
  
  // Event source priority (higher number = higher priority)
  const getSourcePriority = useCallback((source: EventSource): number => {
    switch (source) {
      case 'pointer': return 3;
      case 'touch': return 2;
      case 'mouse': return 1;
      default: return 0;
    }
  }, []);
  
  // Check if an event should be processed or if it's a duplicate
  const shouldProcessEvent = useCallback((
    source: EventSource,
    type: string,
    x?: number,
    y?: number
  ): boolean => {
    const now = Date.now();
    const currentEntry: EventEntry = { timestamp: now, source, type, x, y };
    
    // Clean up old events
    recentEventsRef.current = recentEventsRef.current.filter(
      entry => now - entry.timestamp <= DEDUPLICATION_WINDOW
    );
    
    // Check for duplicates or lower-priority events
    const currentPriority = getSourcePriority(source);
    const hasDuplicate = recentEventsRef.current.some(entry => {
      const entryPriority = getSourcePriority(entry.source);
      const isRecent = now - entry.timestamp <= DEDUPLICATION_WINDOW;
      const isSameType = entry.type === type;
      const isSamePosition = entry.x === x && entry.y === y;
      
      // If there's a higher or equal priority event of the same type recently, suppress this one
      if (isRecent && isSameType && entryPriority >= currentPriority) {
        if (entryPriority > currentPriority || isSamePosition) {
          debugLog('EventDeduplication', `Suppressing ${source} ${type} due to ${entry.source} priority`, {
            current: { source, type, priority: currentPriority },
            existing: { source: entry.source, type: entry.type, priority: entryPriority },
            gap: now - entry.timestamp
          });
          return true;
        }
      }
      
      return false;
    });
    
    if (!hasDuplicate) {
      // Add to recent events
      recentEventsRef.current.push(currentEntry);
      // Keep only recent events
      if (recentEventsRef.current.length > MAX_HISTORY) {
        recentEventsRef.current = recentEventsRef.current.slice(-MAX_HISTORY);
      }
    }
    
    return !hasDuplicate;
  }, [getSourcePriority]);
  
  // Reset event history (useful when tool changes)
  const resetEventHistory = useCallback(() => {
    recentEventsRef.current = [];
  }, []);
  
  return {
    shouldProcessEvent,
    resetEventHistory
  };
};
