
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
  pointerType?: string;
}

/**
 * Phase 3: Smart Event Deduplication
 * 
 * This hook prevents duplicate event processing with adaptive timing
 * based on pointer type and implements source prioritization.
 */
export const useEventDeduplication = () => {
  const recentEventsRef = useRef<EventEntry[]>([]);
  const DEDUPLICATION_WINDOW_STYLUS = 5; // ms - reduced for stylus
  const DEDUPLICATION_WINDOW_TOUCH = 20; // ms - normal for touch/mouse
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
  
  // Get adaptive deduplication window based on pointer type
  const getDeduplicationWindow = useCallback((pointerType?: string): number => {
    if (pointerType === 'pen') {
      return DEDUPLICATION_WINDOW_STYLUS;
    }
    return DEDUPLICATION_WINDOW_TOUCH;
  }, []);
  
  // Check if an event should be processed or if it's a duplicate
  const shouldProcessEvent = useCallback((
    source: EventSource,
    type: string,
    x?: number,
    y?: number,
    pointerType?: string
  ): boolean => {
    const now = Date.now();
    const window = getDeduplicationWindow(pointerType);
    const currentEntry: EventEntry = { timestamp: now, source, type, x, y, pointerType };
    
    // Clean up old events
    recentEventsRef.current = recentEventsRef.current.filter(
      entry => now - entry.timestamp <= Math.max(DEDUPLICATION_WINDOW_STYLUS, DEDUPLICATION_WINDOW_TOUCH)
    );
    
    // Check for duplicates or lower-priority events
    const currentPriority = getSourcePriority(source);
    const hasDuplicate = recentEventsRef.current.some(entry => {
      const entryPriority = getSourcePriority(entry.source);
      const timeDiff = now - entry.timestamp;
      const isRecent = timeDiff <= window;
      const isSameType = entry.type === type;
      const isSamePosition = entry.x === x && entry.y === y;
      
      // For stylus, be more permissive with rapid movements
      if (pointerType === 'pen' && entry.pointerType === 'pen') {
        // Only suppress if it's truly the same event (same position within very short time)
        if (isRecent && isSameType && isSamePosition && timeDiff <= 3) {
          debugLog('EventDeduplication', `Suppressing duplicate stylus ${type}`, {
            timeDiff,
            position: { x, y }
          });
          return true;
        }
        return false;
      }
      
      // Standard deduplication for other pointer types
      if (isRecent && isSameType && entryPriority >= currentPriority) {
        if (entryPriority > currentPriority || isSamePosition) {
          debugLog('EventDeduplication', `Suppressing ${source} ${type} due to ${entry.source} priority`, {
            current: { source, type, priority: currentPriority },
            existing: { source: entry.source, type: entry.type, priority: entryPriority },
            gap: timeDiff
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
  }, [getSourcePriority, getDeduplicationWindow]);
  
  // Reset event history (useful when tool changes)
  const resetEventHistory = useCallback(() => {
    recentEventsRef.current = [];
  }, []);
  
  return {
    shouldProcessEvent,
    resetEventHistory
  };
};
