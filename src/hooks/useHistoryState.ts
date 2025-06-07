
import { useCallback } from 'react';
import { LineObject, ImageObject } from '@/types/whiteboard';

export const useHistoryState = (
  state: {
    history: { lines: LineObject[]; images: ImageObject[] }[];
    historyIndex: number;
    lines: LineObject[];
    images: ImageObject[];
  },
  setState: (updater: (prev: any) => any) => void
) => {
  const addToHistory = useCallback((snapshot: { lines: LineObject[]; images: ImageObject[] }) => {
    setState(prev => {
      // If we're not at the end of the history, truncate it
      const newHistory = prev.historyIndex < prev.history.length - 1
        ? prev.history.slice(0, prev.historyIndex + 1)
        : prev.history;
      
      return {
        ...prev,
        history: [...newHistory, { lines: [...snapshot.lines], images: [...snapshot.images] }],
        historyIndex: newHistory.length
      };
    });
  }, [setState]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex <= 0) return prev;
      
      const newIndex = prev.historyIndex - 1;
      const snapshot = prev.history[newIndex];
      return {
        ...prev,
        lines: [...snapshot.lines],
        images: [...snapshot.images],
        historyIndex: newIndex
      };
    });
  }, [setState]);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      
      const newIndex = prev.historyIndex + 1;
      const snapshot = prev.history[newIndex];
      return {
        ...prev,
        lines: [...snapshot.lines],
        images: [...snapshot.images],
        historyIndex: newIndex
      };
    });
  }, [setState]);

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
