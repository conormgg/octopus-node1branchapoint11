
import { useCallback } from 'react';
import { SyncConfig } from '@/types/sync';
import { useSelectionState } from './useSelectionState';
import { usePanZoom } from './usePanZoom';
import { useSharedStateManagement } from './shared/useSharedStateManagement';
import { useSharedPointerHandlers } from './shared/useSharedPointerHandlers';
import { useSharedStateInitialization } from './shared/useSharedStateInitialization';
import { useSharedPersistenceIntegration } from './shared/useSharedPersistenceIntegration';
import { useSharedOperationsCoordinator } from './shared/useSharedOperationsCoordinator';

export const useSharedWhiteboardState = (syncConfig?: SyncConfig, whiteboardId?: string) => {
  // Initialize state
  const { state, setState } = useSharedStateInitialization(whiteboardId);

  // Selection state management
  const selection = useSelectionState();

  // Coordinate all operations (drawing, sync, history, etc.) with whiteboard ID
  const operations = useSharedOperationsCoordinator(syncConfig, state, setState, whiteboardId);

  // Handle persistence and context integration
  useSharedPersistenceIntegration(state, setState, syncConfig, whiteboardId);

  // State management functions
  const { setPanZoomState, setTool, setColor, setPencilColor, setHighlighterColor, setStrokeWidth } = useSharedStateManagement(setState);

  // Pan/zoom operations
  const panZoom = usePanZoom(state.panZoomState, setPanZoomState);

  // Pointer event handlers with proper safety checks
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useSharedPointerHandlers(
    state, 
    operations.startDrawing, 
    operations.continueDrawing, 
    operations.stopDrawing, 
    operations.startErasing, 
    operations.continueErasing, 
    operations.stopErasing,
    syncConfig, 
    panZoom, 
    selection
  );

  // Delete selected objects wrapper
  const deleteSelectedObjects = useCallback(() => {
    if (selection.selectionState.selectedObjects && operations.deleteSelectedObjects) {
      operations.deleteSelectedObjects(selection.selectionState.selectedObjects);
      selection.clearSelection();
    }
  }, [selection, operations]);

  return {
    state,
    syncState: operations.syncState,
    setTool,
    setColor,
    setPencilColor,
    setHighlighterColor,
    setStrokeWidth,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePaste: operations.handlePaste,
    addToHistory: operations.addToHistory,
    undo: operations.undo,
    redo: operations.redo,
    canUndo: operations.canUndo,
    canRedo: operations.canRedo,
    panZoom,
    updateImageState: operations.updateImageState,
    updateLine: operations.updateLine,
    updateImage: operations.updateImage,
    toggleImageLock: operations.toggleImageLock,
    deleteSelectedObjects,
    selection,
    isReadOnly: syncConfig?.isReceiveOnly || false,
    whiteboardId // Expose whiteboard ID for component identification
  };
};
