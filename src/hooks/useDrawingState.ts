import { useCallback, useRef } from 'react';
import { LineObject, Tool } from '@/types/whiteboard';

export const useDrawingState = (
  state: {
    currentTool: Tool;
    currentColor: string;
    currentStrokeWidth: number;
    lines: LineObject[];
    isDrawing: boolean;
  },
  setState: (updater: (prev: any) => any) => void,
  addToHistory: (lines: LineObject[]) => void
) => {
  const lineIdRef = useRef(0);

  const startDrawing = useCallback((x: number, y: number) => {
    if (state.currentTool !== 'pencil') return;

    const newLine: LineObject = {
      id: `line_${Date.now()}_${lineIdRef.current++}`,
      tool: 'pencil',
      points: [x, y],
      color: state.currentColor,
      strokeWidth: state.currentStrokeWidth,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    };

    setState(prev => ({
      ...prev,
      lines: [...prev.lines, newLine],
      isDrawing: true
    }));
  }, [state.currentTool, state.currentColor, state.currentStrokeWidth, setState]);

  const continueDrawing = useCallback((x: number, y: number) => {
    if (!state.isDrawing || state.currentTool !== 'pencil') return;

    setState(prev => {
      const lastLine = prev.lines[prev.lines.length - 1];
      const newPoints = [...lastLine.points, x, y];
      const updatedLines = [...prev.lines];
      updatedLines[updatedLines.length - 1] = {
        ...lastLine,
        points: newPoints
      };

      return {
        ...prev,
        lines: updatedLines
      };
    });
  }, [state.isDrawing, state.currentTool, setState]);

  const stopDrawing = useCallback(() => {
    if (!state.isDrawing) return;

    addToHistory(state.lines);

    setState(prev => ({
      ...prev,
      isDrawing: false
    }));
  }, [state.isDrawing, state.lines, setState, addToHistory]);

  return {
    startDrawing,
    continueDrawing,
    stopDrawing
  };
};
