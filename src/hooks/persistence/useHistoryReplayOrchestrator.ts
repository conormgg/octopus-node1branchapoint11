
import { WhiteboardState } from '@/types/whiteboard';
import { useSharedHistoryReplay } from '../shared/useSharedHistoryReplay';

/**
 * @hook useHistoryReplayOrchestrator
 * @description Coordinates history replay process for state reconstruction
 */
export const useHistoryReplayOrchestrator = () => {
  const { replayOperations } = useSharedHistoryReplay();

  const processHistoryReplay = (
    operations: any[],
    initialState: WhiteboardState,
    whiteboardId?: string
  ) => {
    console.log(`[HistoryReplayOrchestrator] Starting pure history replay for ${operations.length} operations`);
    
    // Create initial state for replay
    const cleanInitialState = {
      ...initialState,
      lines: [],
      images: []
    };
    
    // Use pure replay simulation to get correct final state and history stack
    const { finalState, historyStack, finalHistoryIndex } = replayOperations(
      operations,
      cleanInitialState
    );
    
    console.log(`[HistoryReplayOrchestrator] Pure replay complete. Final state: ${finalState.lines.length} lines, ${finalState.images.length} images`);
    console.log(`[HistoryReplayOrchestrator] Final history index: ${finalHistoryIndex}, stack length: ${historyStack.length}`);
    
    return {
      finalState,
      historyStack,
      finalHistoryIndex
    };
  };

  const processFallbackLoad = (
    persistence: any,
    prevState: WhiteboardState,
    whiteboardId?: string
  ) => {
    console.log(`[HistoryReplayOrchestrator] No operations for replay, using direct state loading`);
    
    const newSnapshot = {
      lines: [...persistence.lines], 
      images: [...(persistence.images || [])],
      selectionState: {
        selectedObjects: [],
        selectionBounds: null,
        isSelecting: false
      },
      ...(persistence.lastActivity ? { lastActivity: persistence.lastActivity } : {})
    };
    
    const newHistory = [newSnapshot];
    
    if (prevState.history.length > 0) {
      newHistory.push(...prevState.history.slice(1));
    }
    
    return {
      finalState: {
        ...prevState,
        lines: [...persistence.lines],
        images: [...(persistence.images || [])]
      },
      historyStack: newHistory,
      finalHistoryIndex: 0
    };
  };

  return {
    processHistoryReplay,
    processFallbackLoad
  };
};
