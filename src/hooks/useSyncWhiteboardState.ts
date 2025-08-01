/**
 * @fileoverview Synchronization-focused whiteboard state hook
 * @description Manages whiteboard state with real-time synchronization as the primary concern.
 * This hook is specifically designed for session-based collaborative scenarios.
 * 
 * @usage
 * ```tsx
 * const syncConfig = { 
 *   whiteboardId: 'session-123',
 *   senderId: 'user-456',
 *   sessionId: 'classroom-789'
 * };
 * const { state, syncState, sendOperation } = useSyncWhiteboardState(syncConfig);
 * ```
 * 
 * @ai-context This hook prioritizes synchronization and is used when the primary
 * concern is real-time collaboration rather than local state management.
 */

import { useState, useCallback } from 'react';
import { WhiteboardState, SelectionState } from '@/types/whiteboard';
import { useSyncState } from './useSyncState';
import { useRemoteOperationHandler } from './useRemoteOperationHandler';
import { SyncConfig } from '@/types/sync';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('sync');

/**
 * @hook useSyncWhiteboardState
 * @description Whiteboard state management with synchronization as primary concern
 * 
 * @param syncConfig - Configuration for real-time synchronization
 * 
 * @returns {Object} Sync-focused whiteboard state and operations
 * @returns {WhiteboardState} state - Current whiteboard state
 * @returns {Function} setState - Direct state setter for advanced usage
 * @returns {SyncState} syncState - Real-time synchronization status
 * @returns {Function} sendOperation - Send operations to other clients
 * @returns {Function} saveToHistory - Manual history management
 * 
 * @ai-understanding
 * This hook is designed for scenarios where:
 * - Real-time sync is the primary requirement
 * - Manual control over state updates is needed
 * - Session-based collaboration is required
 * - Direct operation sending is necessary
 */
export const useSyncWhiteboardState = (syncConfig: SyncConfig) => {
  debugLog('Hook', 'Initializing useSyncWhiteboardState', { 
    whiteboardId: syncConfig.whiteboardId,
    sessionId: syncConfig.sessionId,
    isReceiveOnly: syncConfig.isReceiveOnly
  });

  /**
   * @constant defaultSelectionState
   * @description Default selection state for clean initialization
   */
  const defaultSelectionState: SelectionState = {
    selectedObjects: [],
    selectionBounds: null,
    isSelecting: false
  };

  /**
   * @state state
   * @description Main whiteboard state with comprehensive initial values
   */
  const [state, setState] = useState<WhiteboardState>({
    lines: [],
    images: [],
    currentTool: 'pencil',
    currentColor: '#000000',
    currentStrokeWidth: 5,
    pencilSettings: {
      color: '#000000',
      strokeWidth: 5
    },
    highlighterSettings: {
      color: '#FFFF00',
      strokeWidth: 12
    },
    isDrawing: false,
    panZoomState: { x: 0, y: 0, scale: 1 },
    selectionState: defaultSelectionState,
    history: [{
      lines: [],
      images: [],
      selectionState: defaultSelectionState
    }],
    historyIndex: 0
  });

  // Simple undo/redo functions for remote operations
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        const snapshot = prev.history[newIndex];
        return {
          ...prev,
          lines: snapshot.lines,
          images: snapshot.images,
          selectionState: snapshot.selectionState,
          historyIndex: newIndex
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        const snapshot = prev.history[newIndex];
        return {
          ...prev,
          lines: snapshot.lines,
          images: snapshot.images,
          selectionState: snapshot.selectionState,
          historyIndex: newIndex
        };
      }
      return prev;
    });
  }, []);

  // Handle received operations - now with proper undo/redo support
  const { handleRemoteOperation } = useRemoteOperationHandler(setState, undo, redo);

  // Set up sync with proper operation handling
  const { syncState, sendOperation } = useSyncState(syncConfig, handleRemoteOperation);

  /**
   * @function saveToHistory
   * @description Manually saves current state to history
   * 
   * @ai-context This function provides manual control over history snapshots,
   * useful for precise timing of history saves in collaborative scenarios.
   */
  const saveToHistory = useCallback(() => {
    debugLog('History', 'Saving to history');
    setState(prev => {
      const newSnapshot = {
        lines: [...prev.lines],
        images: [...prev.images],
        selectionState: { ...prev.selectionState }
      };

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newSnapshot);

      debugLog('History', 'History saved', { 
        historyLength: newHistory.length,
        linesCount: newSnapshot.lines.length,
        imagesCount: newSnapshot.images.length
      });

      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  debugLog('Hook', 'useSyncWhiteboardState initialized', {
    syncConnected: syncState?.isConnected,
    linesCount: state.lines.length,
    imagesCount: state.images.length
  });

  return {
    state,
    setState,
    syncState,
    sendOperation,
    saveToHistory
  };
};
