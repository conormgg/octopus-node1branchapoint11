
import { useCallback } from 'react';
import { LineObject, ImageObject, HistorySnapshot, SelectionState } from '@/types/whiteboard';

export const useHistoryState = (
  state: {
    history: HistorySnapshot[];
    historyIndex: number;
    lines: LineObject[];
    images: ImageObject[];
    selectionState: SelectionState;
  },
  setState: (updater: (prev: any) => any) => void,
  updateSelectionState?: (selectionState: SelectionState) => void
) => {
  const addToHistory = useCallback((snapshot: HistorySnapshot) => {
    setState(prev => {
      // If we're not at the end of the history, truncate it
      const newHistory = prev.historyIndex < prev.history.length - 1
        ? prev.history.slice(0, prev.historyIndex + 1)
        : prev.history;
      
      return {
        ...prev,
        history: [...newHistory, {
          lines: [...snapshot.lines],
          images: [...snapshot.images],
          selectionState: {
            ...snapshot.selectionState,
            selectedObjects: [...snapshot.selectionState.selectedObjects],
            transformationData: { ...snapshot.selectionState.transformationData }
          }
        }],
        historyIndex: newHistory.length
      };
    });
  }, [setState]);

  const validateSelection = useCallback((selectionState: SelectionState, lines: LineObject[], images: ImageObject[]): SelectionState => {
    // Filter out selected objects that no longer exist
    const validSelectedObjects = selectionState.selectedObjects.filter(selectedObj => {
      if (selectedObj.type === 'line') {
        return lines.some(line => line.id === selectedObj.id);
      } else if (selectedObj.type === 'image') {
        return images.some(image => image.id === selectedObj.id);
      }
      return false;
    });

    // Clean up transformation data for objects that no longer exist
    const validTransformationData: Record<string, any> = {};
    Object.keys(selectionState.transformationData).forEach(id => {
      const objectExists = lines.some(line => line.id === id) || images.some(image => image.id === id);
      if (objectExists) {
        validTransformationData[id] = selectionState.transformationData[id];
      }
    });

    return {
      ...selectionState,
      selectedObjects: validSelectedObjects,
      transformationData: validTransformationData,
      // Clear selection bounds if no objects are selected
      selectionBounds: validSelectedObjects.length > 0 ? selectionState.selectionBounds : null,
      // Don't restore isSelecting state from history
      isSelecting: false
    };
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex <= 0) return prev;
      
      const newIndex = prev.historyIndex - 1;
      const snapshot = prev.history[newIndex];
      
      // Validate selection state against the restored objects
      const validatedSelectionState = validateSelection(snapshot.selectionState, snapshot.lines, snapshot.images);
      
      // Update the selection hook if provided
      if (updateSelectionState) {
        setTimeout(() => updateSelectionState(validatedSelectionState), 0);
      }
      
      return {
        ...prev,
        lines: [...snapshot.lines],
        images: [...snapshot.images],
        selectionState: validatedSelectionState,
        historyIndex: newIndex
      };
    });
  }, [setState, validateSelection, updateSelectionState]);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      
      const newIndex = prev.historyIndex + 1;
      const snapshot = prev.history[newIndex];
      
      // Validate selection state against the restored objects
      const validatedSelectionState = validateSelection(snapshot.selectionState, snapshot.lines, snapshot.images);
      
      // Update the selection hook if provided
      if (updateSelectionState) {
        setTimeout(() => updateSelectionState(validatedSelectionState), 0);
      }
      
      return {
        ...prev,
        lines: [...snapshot.lines],
        images: [...snapshot.images],
        selectionState: validatedSelectionState,
        historyIndex: newIndex
      };
    });
  }, [setState, validateSelection, updateSelectionState]);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  return {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo
  };
};
