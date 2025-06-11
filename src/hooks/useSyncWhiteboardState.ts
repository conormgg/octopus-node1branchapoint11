
import { useState, useCallback } from 'react';
import { WhiteboardState, SelectionState } from '@/types/whiteboard';
import { useSyncState } from './useSyncState';
import { useRemoteOperationHandler } from './useRemoteOperationHandler';
import { SyncConfig } from '@/types/sync';

export const useSyncWhiteboardState = (syncConfig: SyncConfig) => {
  const defaultSelectionState: SelectionState = {
    selectedObjects: [],
    selectionBounds: null,
    isSelecting: false,
    transformationData: {}
  };

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

  // Handle received operations
  const { applyOperation } = useRemoteOperationHandler(state, setState);

  // Set up sync with proper operation handling
  const { syncState, sendOperation } = useSyncState(syncConfig, applyOperation);

  const saveToHistory = useCallback(() => {
    setState(prev => {
      const newSnapshot = {
        lines: [...prev.lines],
        images: [...prev.images],
        selectionState: { ...prev.selectionState }
      };

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newSnapshot);

      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  return {
    state,
    setState,
    syncState,
    sendOperation,
    saveToHistory
  };
};
