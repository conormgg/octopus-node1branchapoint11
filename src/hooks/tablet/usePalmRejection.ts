
/**
 * @fileoverview Palm rejection algorithm for distinguishing stylus from palm touches
 * @description TABLET-FRIENDLY: Core palm rejection logic optimized for iPad and stylus devices
 */

import { useCallback, useRef } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';
import { tabletDebugger, logPalmRejectionStatus } from '@/utils/tablet/tabletDebugger';

const debugLog = createDebugLogger('palmRejection');

/**
 * TABLET-FRIENDLY: Interface for tracking individual pointer data
 */
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

/**
 * TABLET-FRIENDLY: Configuration interface for palm rejection algorithm
 */
export interface PalmRejectionConfig {
  /** Maximum contact area for valid touch (larger areas assumed to be palm) */
  maxContactSize: number;
  /** Minimum pressure for valid input (lighter touches may be accidental) */
  minPressure: number;
  /** Time to ignore touches after palm detection in milliseconds */
  palmTimeoutMs: number;
  /** Distance threshold for detecting clustered touches (palm + fingers) */
  clusterDistance: number;
  /** Always prefer stylus over touch input */
  preferStylus: boolean;
}

/**
 * TABLET-FRIENDLY: Default palm rejection configuration optimized for iPad with Apple Pencil
 */
const DEFAULT_CONFIG: PalmRejectionConfig = {
  maxContactSize: 40, // Maximum contact area for valid touch
  minPressure: 0.1,   // Minimum pressure for valid input
  palmTimeoutMs: 500, // Time to ignore touches after palm detection
  clusterDistance: 100, // Distance to detect clustered touches
  preferStylus: true  // Always prefer stylus over touch
};

/**
 * TABLET-FRIENDLY: Hook for palm rejection functionality
 * @description Analyzes pointer events to distinguish between intentional stylus/finger input and accidental palm touches
 * @param config Configuration options for palm rejection sensitivity
 */
export const usePalmRejection = (config: Partial<PalmRejectionConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // TABLET-FRIENDLY: Track active pointers for analysis
  const activePointers = useRef<Map<number, PointerData>>(new Map());
  const lastPalmDetection = useRef<number>(0);
  const rejectedPointers = useRef<Set<number>>(new Set());

  debugLog('PalmRejection', 'Palm rejection initialized', { config: finalConfig });

  /**
   * TABLET-FRIENDLY: Analyze a single pointer to determine if it should be processed
   * @param pointer The pointer data to analyze
   * @returns true if the pointer should be processed, false if it should be rejected
   */
  const analyzePointer = useCallback((pointer: PointerData): boolean => {
    // TABLET-FRIENDLY: ALWAYS allow pen/stylus input - this is critical for iPad stylus support
    if (pointer.pointerType === 'pen') {
      debugLog('PalmRejection', 'Allowing pen input', { pointerId: pointer.id });
      return true;
    }

    // TABLET-FRIENDLY: Check if we're in palm rejection timeout
    const now = Date.now();
    if (now - lastPalmDetection.current < finalConfig.palmTimeoutMs) {
      debugLog('PalmRejection', 'Rejecting due to timeout', { 
        pointerId: pointer.id,
        timeRemaining: finalConfig.palmTimeoutMs - (now - lastPalmDetection.current)
      });
      return false;
    }

    // TABLET-FRIENDLY: Reject large contact areas (likely palm)
    const contactSize = Math.max(pointer.width, pointer.height);
    if (contactSize > finalConfig.maxContactSize) {
      lastPalmDetection.current = now;
      rejectedPointers.current.add(pointer.id);
      debugLog('PalmRejection', 'Rejecting large contact', { 
        pointerId: pointer.id,
        contactSize,
        maxAllowed: finalConfig.maxContactSize
      });
      return false;
    }

    // TABLET-FRIENDLY: Check for clustered touches (palm + fingers)
    const clusterCount = Array.from(activePointers.current.values()).filter(p => {
      const distance = Math.sqrt(
        Math.pow(p.x - pointer.x, 2) + Math.pow(p.y - pointer.y, 2)
      );
      return distance < finalConfig.clusterDistance && p.id !== pointer.id;
    }).length;

    // TABLET-FRIENDLY: If we have multiple close touches, likely palm interference
    if (clusterCount >= 2) {
      lastPalmDetection.current = now;
      rejectedPointers.current.add(pointer.id);
      debugLog('PalmRejection', 'Rejecting clustered touches', { 
        pointerId: pointer.id,
        clusterCount,
        threshold: finalConfig.clusterDistance
      });
      return false;
    }

    // TABLET-FRIENDLY: Check pressure if available (but be lenient for stylus-like input)
    if (pointer.pressure > 0 && pointer.pressure < finalConfig.minPressure && pointer.pointerType !== 'pen') {
      debugLog('PalmRejection', 'Rejecting low pressure', { 
        pointerId: pointer.id,
        pressure: pointer.pressure,
        minRequired: finalConfig.minPressure
      });
      return false;
    }

    debugLog('PalmRejection', 'Allowing touch input', { pointerId: pointer.id });
    return true;
  }, [finalConfig]);

  /**
   * TABLET-FRIENDLY: Main entry point for palm rejection analysis
   * @param event The pointer event to analyze
   * @returns true if the pointer should be processed, false if it should be rejected
   */
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

    // TABLET-FRIENDLY: Log event for debugging
    const shouldProcess = analyzePointer(pointer);
    tabletDebugger.logEvent(event, !shouldProcess, shouldProcess ? undefined : 'palm_rejection');

    // TABLET-FRIENDLY: PRIORITY - Always process stylus/pen input immediately
    if (pointer.pointerType === 'pen') {
      activePointers.current.set(pointer.id, pointer);
      return true;
    }

    // TABLET-FRIENDLY: If this pointer was already rejected, continue rejecting it
    if (rejectedPointers.current.has(pointer.id)) {
      return false;
    }

    // TABLET-FRIENDLY: Update active pointers for cluster analysis
    activePointers.current.set(pointer.id, pointer);

    // TABLET-FRIENDLY: Log palm rejection status
    if (!shouldProcess) {
      const status = {
        enabled: true,
        activePointers: activePointers.current.size,
        rejectedPointers: rejectedPointers.current.size,
        lastDetectionTime: lastPalmDetection.current,
        timeoutRemaining: Math.max(0, finalConfig.palmTimeoutMs - (Date.now() - lastPalmDetection.current)),
        config: finalConfig
      };
      logPalmRejectionStatus(status);
    }

    return shouldProcess;
  }, [analyzePointer, finalConfig]);

  /**
   * TABLET-FRIENDLY: Clean up pointer tracking when pointer is released
   * @param pointerId The ID of the pointer that ended
   */
  const onPointerEnd = useCallback((pointerId: number) => {
    activePointers.current.delete(pointerId);
    rejectedPointers.current.delete(pointerId);
    debugLog('PalmRejection', 'Pointer ended', { pointerId });
  }, []);

  /**
   * TABLET-FRIENDLY: Reset all palm rejection state
   */
  const reset = useCallback(() => {
    activePointers.current.clear();
    rejectedPointers.current.clear();
    lastPalmDetection.current = 0;
    debugLog('PalmRejection', 'Palm rejection state reset');
  }, []);

  /**
   * TABLET-FRIENDLY: Get current palm rejection status for debugging
   */
  const getStatus = useCallback(() => {
    return {
      enabled: true,
      activePointers: activePointers.current.size,
      rejectedPointers: rejectedPointers.current.size,
      lastDetectionTime: lastPalmDetection.current,
      timeoutRemaining: Math.max(0, finalConfig.palmTimeoutMs - (Date.now() - lastPalmDetection.current)),
      config: finalConfig
    };
  }, [finalConfig]);

  return {
    shouldProcessPointer,
    onPointerEnd,
    reset,
    getStatus,
    activePointerCount: activePointers.current.size,
    config: finalConfig
  };
};
