
/**
 * @fileoverview Core shared whiteboard state management
 * @description Handles the fundamental state initialization and basic operations
 */

import { useCallback } from 'react';
import { SyncConfig } from '@/types/sync';
import { useSelectionState } from '../useSelectionState';
import { usePanZoom } from '../usePanZoom';
import { useSharedStateManagement } from './useSharedStateManagement';
import { useSharedStateInitialization } from './useSharedStateInitialization';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('state');

/**
 * @hook useSharedWhiteboardCore
 * @description Core state management for shared whiteboards
 */
export const useSharedWhiteboardCore = (whiteboardId?: string) => {
  debugLog('Core', 'Initializing core whiteboard state', { whiteboardId });

  // Initialize state
  const { state, setState } = useSharedStateInitialization(whiteboardId);

  // Selection state management
  const selection = useSelectionState();

  // State management functions
  const { setPanZoomState, setTool, setColor, setPencilColor, setHighlighterColor, setStrokeWidth } = useSharedStateManagement(setState);

  // Pan/zoom operations
  const panZoom = usePanZoom(state.panZoomState, setPanZoomState);

  debugLog('Core', 'Core state initialized', { whiteboardId });

  return {
    state,
    setState,
    selection,
    setTool,
    setColor,
    setPencilColor,
    setHighlighterColor,
    setStrokeWidth,
    panZoom
  };
};
