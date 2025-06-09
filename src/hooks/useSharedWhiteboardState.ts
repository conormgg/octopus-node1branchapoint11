
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

  // Handle persistence and context integration (updated parameter order)
  useSharedPersistenceIntegration(state, setState, syncConfig, whiteboardId);

  // State management functions
  const { setPanZoomState, setTool, setColor, setStrokeWidth } = useSharedStateManagement(setState);

  // Pan/zoom operations
  const panZoom = usePanZoom(state.panZoomState, setPanZoomState);

  // Coordinate all operations (drawing, sync, history, etc.) with whiteboard ID
  const operations = useSharedOperationsCoordinator(syncConfig, state, setState, whiteboardId);

  // Pointer event handlers
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useSharedPointerHandlers(
    state, operations.startDrawing, operations.continueDrawing, operations.stopDrawing, 
    operations.startErasing, operations.continueErasing, operations.stopErasing,
    syncConfig, panZoom
  );

  return {
    state,
    syncState: operations.syncState,
    setTool,
    setColor,
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
    selection,
    isReadOnly: syncConfig?.isReceiveOnly || false,
    whiteboardId // Expose whiteboard ID for component identification
  };
};
