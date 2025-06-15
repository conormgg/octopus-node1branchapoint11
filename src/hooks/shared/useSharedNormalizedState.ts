
/**
 * @fileoverview Normalized state handling for performance optimization
 * @description Manages normalized state for shared whiteboards when enabled
 */

import { useNormalizedWhiteboardState } from '../performance/useNormalizedWhiteboardState';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('state');
const USE_NORMALIZED_STATE = true; // Feature flag for gradual rollout

/**
 * @hook useSharedNormalizedState
 * @description Handles normalized state for performance optimization
 */
export const useSharedNormalizedState = (lines: any[], images: any[], whiteboardId?: string) => {
  // Normalized state for performance optimization
  const normalizedState = useNormalizedWhiteboardState(lines, images);

  if (USE_NORMALIZED_STATE) {
    debugLog('Performance', 'Normalized state stats', {
      lineCount: normalizedState.lineCount,
      imageCount: normalizedState.imageCount,
      totalObjects: normalizedState.totalObjectCount,
      whiteboardId
    });
  }

  return USE_NORMALIZED_STATE ? normalizedState : undefined;
};
