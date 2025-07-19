
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
import { useSharedOperationsCoordinator } from './useSharedOperationsCoordinator';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('state');

/**
 * @hook useSharedWhiteboardCore
 * @description Core state management for shared whiteboards
 */
export const useSharedWhiteboardCore = (whiteboardId?: string, syncConfig?: SyncConfig) => {
  debugLog('Core', 'Initializing core whiteboard state', { whiteboardId });

  // Initialize state
  const { state, setState } = useSharedStateInitialization(whiteboardId);

  // Selection state management
  const selection = useSelectionState();

  // State management functions
  const { setPanZoomState, setTool, setColor, setPencilColor, setHighlighterColor, setStrokeWidth } = useSharedStateManagement(setState);

  // Pan/zoom operations
  const panZoom = usePanZoom(state.panZoomState, setPanZoomState);

  // Operations coordinator for sync, history, and operations
  const {
    syncState,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    getLastActivity,
    deleteSelectedObjects: operationsDeleteSelectedObjects,
    ...operations
  } = useSharedOperationsCoordinator(syncConfig, state, setState, whiteboardId);

  // Check if read-only based on sync config
  const isReadOnly = syncConfig?.isReceiveOnly ?? false;

  // Center on last activity function
  const centerOnLastActivity = useCallback((bounds?: any) => {
    const lastActivity = getLastActivity();
    if (lastActivity && lastActivity.bounds && panZoom) {
      const { x, y, width, height } = lastActivity.bounds;
      // Use centerOnBounds instead of centerOnPoint
      panZoom.centerOnBounds({ x, y, width, height }, 800, 600);
      debugLog('Core', 'Centered on last activity', { x, y, width, height });
    }
  }, [getLastActivity, panZoom]);

  // Pointer handlers - delegate to shared pointer handlers
  const handlePointerDown = useCallback((e: any) => {
    // This will be implemented by the pointer handlers hook
    debugLog('Core', 'Pointer down in core (placeholder)');
  }, []);

  const handlePointerMove = useCallback((e: any) => {
    // This will be implemented by the pointer handlers hook
    debugLog('Core', 'Pointer move in core (placeholder)');
  }, []);

  const handlePointerUp = useCallback((e: any) => {
    // This will be implemented by the pointer handlers hook  
    debugLog('Core', 'Pointer up in core (placeholder)');
  }, []);

  // Stage ref for component integration
  const setStageRef = useCallback((ref: any) => {
    debugLog('Core', 'Stage ref set in core', { hasRef: !!ref });
  }, []);

  // Wrapper for deleteSelectedObjects to match expected signature
  const deleteSelectedObjects = useCallback(() => {
    const selectedObjects = selection.selectionState.selectedObjects;
    if (selectedObjects && operationsDeleteSelectedObjects) {
      operationsDeleteSelectedObjects(selectedObjects);
      selection.clearSelection();
      debugLog('Core', 'Objects deleted and selection cleared');
    }
  }, [selection, operationsDeleteSelectedObjects]);

  // Normalized state (proper implementation for compatibility)
  const normalizedState = {
    linesById: state.lines.reduce((acc, line) => ({ ...acc, [line.id]: line }), {}),
    imagesById: state.images.reduce((acc, image) => ({ ...acc, [image.id]: image }), {}),
    lineIds: state.lines.map(line => line.id),
    imageIds: state.images.map(image => image.id),
    getLineById: (id: string) => state.lines.find(line => line.id === id),
    getImageById: (id: string) => state.images.find(image => image.id === id),
    getLinesByIds: (ids: string[]) => state.lines.filter(line => ids.includes(line.id)),
    getImagesByIds: (ids: string[]) => state.images.filter(image => ids.includes(image.id)),
    hasLine: (id: string) => state.lines.some(line => line.id === id),
    hasImage: (id: string) => state.images.some(image => image.id === id),
    lineCount: state.lines.length,
    imageCount: state.images.length,
    totalObjectCount: state.lines.length + state.images.length
  };

  debugLog('Core', 'Core state initialized', { whiteboardId, isReadOnly });

  return {
    state,
    setState,
    selection,
    setTool,
    setColor,
    setPencilColor,
    setHighlighterColor,
    setStrokeWidth,
    panZoom,
    syncState,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    getLastActivity,
    centerOnLastActivity,
    isReadOnly,
    normalizedState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    setStageRef,
    deleteSelectedObjects,
    ...operations
  };
};
