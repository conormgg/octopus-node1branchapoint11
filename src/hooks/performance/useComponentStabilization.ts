import { useRef, useEffect, useCallback } from 'react';
import { WhiteboardState } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performance');

interface ComponentMountInfo {
  mountTime: number;
  unmountTime?: number;
  mountCount: number;
  lastReason?: string;
}

interface StabilizationConfig {
  maxRemountsPerMinute?: number;
  statePreservationDuration?: number;
  loadingStateTimeout?: number;
}

/**
 * @hook useComponentStabilization
 * @description Prevents frequent component re-mounting and preserves state
 */
export const useComponentStabilization = (
  componentName: string,
  whiteboardId?: string,
  config: StabilizationConfig = {}
) => {
  const {
    maxRemountsPerMinute = 5,
    statePreservationDuration = 30000, // 30 seconds
    loadingStateTimeout = 5000 // 5 seconds
  } = config;

  const mountInfo = useRef<ComponentMountInfo>({
    mountTime: Date.now(),
    mountCount: 1
  });

  const preservedState = useRef<WhiteboardState | null>(null);
  const preservationTimestamp = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  const loadingStartTime = useRef<number>(0);
  const cleanupTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Track component mounting behavior
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastMount = now - mountInfo.current.mountTime;
    
    if (timeSinceLastMount < 60000) { // Within 1 minute
      mountInfo.current.mountCount++;
      
      if (mountInfo.current.mountCount > maxRemountsPerMinute) {
        debugLog('Stability', `Excessive remounting detected for ${componentName}`, {
          whiteboardId,
          mountCount: mountInfo.current.mountCount,
          timeSinceLastMount
        });
        
        console.warn(`[ComponentStability] ${componentName} has remounted ${mountInfo.current.mountCount} times in the last minute. This may indicate a stability issue.`);
      }
    } else {
      // Reset counter after a minute
      mountInfo.current.mountCount = 1;
    }

    mountInfo.current.mountTime = now;

    return () => {
      mountInfo.current.unmountTime = Date.now();
      debugLog('Stability', `Component ${componentName} unmounting`, {
        whiteboardId,
        mountDuration: mountInfo.current.unmountTime - mountInfo.current.mountTime
      });
    };
  }, [componentName, whiteboardId, maxRemountsPerMinute]);

  /**
   * Preserves state before potential re-mount
   */
  const preserveState = useCallback((state: WhiteboardState) => {
    preservedState.current = {
      ...state,
      lines: [...state.lines],
      images: [...state.images],
      history: state.history.map(h => ({
        ...h,
        lines: [...h.lines],
        images: [...h.images]
      }))
    };
    preservationTimestamp.current = Date.now();
    
    debugLog('Stability', `State preserved for ${componentName}`, {
      whiteboardId,
      linesCount: state.lines.length,
      imagesCount: state.images.length,
      historyLength: state.history.length
    });
  }, [componentName, whiteboardId]);

  /**
   * Attempts to restore preserved state if available and recent
   */
  const restorePreservedState = useCallback((): WhiteboardState | null => {
    const now = Date.now();
    const timeSincePreservation = now - preservationTimestamp.current;
    
    if (preservedState.current && timeSincePreservation < statePreservationDuration) {
      debugLog('Stability', `Restoring preserved state for ${componentName}`, {
        whiteboardId,
        timeSincePreservation,
        linesCount: preservedState.current.lines.length,
        imagesCount: preservedState.current.images.length
      });
      
      return { ...preservedState.current };
    }
    
    if (preservedState.current && timeSincePreservation >= statePreservationDuration) {
      debugLog('Stability', `Preserved state expired for ${componentName}`, {
        whiteboardId,
        timeSincePreservation
      });
      preservedState.current = null;
    }
    
    return null;
  }, [componentName, whiteboardId, statePreservationDuration]);

  /**
   * Manages loading state with automatic timeout
   */
  const setLoadingState = useCallback((isLoading: boolean, reason?: string) => {
    const wasLoading = isLoadingRef.current;
    isLoadingRef.current = isLoading;
    
    if (isLoading && !wasLoading) {
      loadingStartTime.current = Date.now();
      
      // Set timeout to prevent stuck loading states
      const timeout = setTimeout(() => {
        if (isLoadingRef.current) {
          debugLog('Stability', `Loading state timeout for ${componentName}`, {
            whiteboardId,
            reason,
            duration: Date.now() - loadingStartTime.current
          });
          
          console.warn(`[ComponentStability] ${componentName} has been loading for more than ${loadingStateTimeout}ms. Forcing completion.`);
          isLoadingRef.current = false;
        }
      }, loadingStateTimeout);
      
      cleanupTimeouts.current.push(timeout);
    } else if (!isLoading && wasLoading) {
      const loadingDuration = Date.now() - loadingStartTime.current;
      debugLog('Stability', `Loading completed for ${componentName}`, {
        whiteboardId,
        reason,
        duration: loadingDuration
      });
    }
  }, [componentName, whiteboardId, loadingStateTimeout]);

  /**
   * Cleanup function to clear timeouts and preserved state
   */
  const cleanup = useCallback(() => {
    cleanupTimeouts.current.forEach(timeout => clearTimeout(timeout));
    cleanupTimeouts.current = [];
    preservedState.current = null;
    preservationTimestamp.current = 0;
    isLoadingRef.current = false;
  }, []);

  /**
   * Checks if the component should skip certain operations due to instability
   */
  const shouldSkipOperation = useCallback((operationType: string): boolean => {
    const recentRemounts = mountInfo.current.mountCount > maxRemountsPerMinute / 2;
    const isCurrentlyLoading = isLoadingRef.current;
    
    if (recentRemounts || isCurrentlyLoading) {
      debugLog('Stability', `Skipping ${operationType} due to instability`, {
        componentName,
        whiteboardId,
        recentRemounts,
        isCurrentlyLoading,
        mountCount: mountInfo.current.mountCount
      });
      return true;
    }
    
    return false;
  }, [componentName, whiteboardId, maxRemountsPerMinute]);

  /**
   * Gets component stability metrics
   */
  const getStabilityMetrics = useCallback(() => {
    return {
      mountCount: mountInfo.current.mountCount,
      isLoading: isLoadingRef.current,
      hasPreservedState: !!preservedState.current,
      timeSinceMount: Date.now() - mountInfo.current.mountTime,
      timeSincePreservation: preservedState.current ? Date.now() - preservationTimestamp.current : 0
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    preserveState,
    restorePreservedState,
    setLoadingState,
    shouldSkipOperation,
    getStabilityMetrics,
    cleanup,
    isLoading: isLoadingRef.current
  };
};