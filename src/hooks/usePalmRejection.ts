
import { useCallback, useRef } from 'react';

interface PointerData {
  id: number;
  pointerType: string;
  pressure: number;
  width: number;
  height: number;
  timestamp: number;
  x: number;
  y: number;
}

interface PalmRejectionConfig {
  maxContactSize: number;
  minPressure: number;
  palmTimeoutMs: number;
  clusterDistance: number;
  preferStylus: boolean;
}

const DEFAULT_CONFIG: PalmRejectionConfig = {
  maxContactSize: 35, // Reduced from 40 for better sensitivity
  minPressure: 0.05,   // Reduced from 0.1 for better stylus support
  palmTimeoutMs: 300, // Reduced from 500 for quicker recovery
  clusterDistance: 80, // Reduced from 100 for better palm detection
  preferStylus: true  // Always prefer stylus over touch
};

export const usePalmRejection = (config: Partial<PalmRejectionConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const activePointers = useRef<Map<number, PointerData>>(new Map());
  const lastPalmDetection = useRef<number>(0);
  const rejectedPointers = useRef<Set<number>>(new Set());

  const analyzePointer = useCallback((pointer: PointerData): boolean => {
    // Always allow pen/stylus input with higher priority
    if (pointer.pointerType === 'pen' && finalConfig.preferStylus) {
      return true;
    }

    // Check if we're in palm rejection timeout
    const now = Date.now();
    if (now - lastPalmDetection.current < finalConfig.palmTimeoutMs) {
      return false;
    }

    // Reject large contact areas (likely palm) - more aggressive for tablets
    const contactSize = Math.max(pointer.width, pointer.height);
    if (contactSize > finalConfig.maxContactSize) {
      lastPalmDetection.current = now;
      rejectedPointers.current.add(pointer.id);
      return false;
    }

    // Check for clustered touches (palm + fingers) - more sensitive
    const clusterCount = Array.from(activePointers.current.values()).filter(p => {
      const distance = Math.sqrt(
        Math.pow(p.x - pointer.x, 2) + Math.pow(p.y - pointer.y, 2)
      );
      return distance < finalConfig.clusterDistance && p.id !== pointer.id;
    }).length;

    // If we have multiple close touches, likely palm interference
    if (clusterCount >= 1) { // Changed from 2 to 1 for better sensitivity
      lastPalmDetection.current = now;
      rejectedPointers.current.add(pointer.id);
      return false;
    }

    // Check pressure if available - more lenient for stylus
    if (pointer.pressure > 0 && pointer.pressure < finalConfig.minPressure && pointer.pointerType !== 'pen') {
      return false;
    }

    return true;
  }, [finalConfig]);

  const shouldProcessPointer = useCallback((event: PointerEvent): boolean => {
    const pointer: PointerData = {
      id: event.pointerId,
      pointerType: event.pointerType,
      pressure: event.pressure,
      width: event.width || 1,
      height: event.height || 1,
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY
    };

    // If this pointer was already rejected, continue rejecting it
    if (rejectedPointers.current.has(pointer.id)) {
      return false;
    }

    // Update active pointers
    activePointers.current.set(pointer.id, pointer);

    return analyzePointer(pointer);
  }, [analyzePointer]);

  const onPointerEnd = useCallback((pointerId: number) => {
    activePointers.current.delete(pointerId);
    rejectedPointers.current.delete(pointerId);
  }, []);

  const reset = useCallback(() => {
    activePointers.current.clear();
    rejectedPointers.current.clear();
    lastPalmDetection.current = 0;
  }, []);

  return {
    shouldProcessPointer,
    onPointerEnd,
    reset,
    activePointerCount: activePointers.current.size
  };
};
