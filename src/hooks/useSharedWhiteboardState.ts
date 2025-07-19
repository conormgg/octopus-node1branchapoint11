
import { useSharedWhiteboardCore } from './shared/useSharedWhiteboardCore';
import { useSelectionModes } from './useSelectionModes';

export const useSharedWhiteboardState = (whiteboardId: string, syncConfig?: any) => {
  // Get core whiteboard functionality
  const coreState = useSharedWhiteboardCore(whiteboardId, syncConfig);
  
  // Add selection modes functionality
  const selectionModes = useSelectionModes();

  // Enhanced selection object with modes support
  const enhancedSelection = coreState.selection ? {
    ...coreState.selection,
    selectionModes,
    // Add pointer handlers for simplified handlers to use
    handlePointerDown: coreState.handlePointerDown,
    handlePointerMove: coreState.handlePointerMove,
    handlePointerUp: coreState.handlePointerUp
  } : null;

  return {
    ...coreState,
    selection: enhancedSelection
  };
};
