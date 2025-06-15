
import { useCallback, useMemo } from 'react';
import { Tool, PanZoomState } from '@/types/whiteboard';

export const useSharedStateManagement = (setState: any) => {
  // Pan/zoom state management - memoized to prevent unnecessary re-renders
  const setPanZoomState = useCallback((panZoomState: PanZoomState) => {
    setState((prev: any) => ({
      ...prev,
      panZoomState
    }));
  }, [setState]);

  // Tool change with settings sync - memoized to prevent re-creation
  const setTool = useCallback((tool: Tool) => {
    setState((prev: any) => {
      let newColor = prev.currentColor;
      let newStrokeWidth = prev.currentStrokeWidth;
      
      // Apply tool-specific settings when switching tools
      if (tool === 'pencil') {
        newColor = prev.pencilSettings.color;
        newStrokeWidth = prev.pencilSettings.strokeWidth;
      } else if (tool === 'highlighter') {
        newColor = prev.highlighterSettings.color;
        newStrokeWidth = prev.highlighterSettings.strokeWidth;
      }
      
      return {
        ...prev,
        currentTool: tool,
        currentColor: newColor,
        currentStrokeWidth: newStrokeWidth
      };
    });
  }, [setState]);

  // Color change - memoized to prevent re-creation
  const setColor = useCallback((color: string) => {
    setState((prev: any) => ({
      ...prev,
      currentColor: color
    }));
  }, [setState]);

  // Pencil-specific color change with auto-switching - memoized
  const setPencilColor = useCallback((color: string) => {
    setState((prev: any) => ({
      ...prev,
      currentTool: 'pencil',
      currentColor: color,
      currentStrokeWidth: prev.pencilSettings.strokeWidth,
      pencilSettings: { ...prev.pencilSettings, color }
    }));
  }, [setState]);

  // Highlighter-specific color change with auto-switching - memoized
  const setHighlighterColor = useCallback((color: string) => {
    setState((prev: any) => ({
      ...prev,
      currentTool: 'highlighter',
      currentColor: color,
      currentStrokeWidth: prev.highlighterSettings.strokeWidth,
      highlighterSettings: { ...prev.highlighterSettings, color }
    }));
  }, [setState]);

  // Stroke width change with tool-specific storage - memoized
  const setStrokeWidth = useCallback((width: number) => {
    setState((prev: any) => {
      const newState = {
        ...prev,
        currentStrokeWidth: width
      };
      
      // Update the appropriate tool settings
      if (prev.currentTool === 'pencil') {
        newState.pencilSettings = { ...prev.pencilSettings, strokeWidth: width };
      } else if (prev.currentTool === 'highlighter') {
        newState.highlighterSettings = { ...prev.highlighterSettings, strokeWidth: width };
      }
      
      return newState;
    });
  }, [setState]);

  // Memoize the returned object to prevent unnecessary re-renders
  return useMemo(() => ({
    setPanZoomState,
    setTool,
    setColor,
    setPencilColor,
    setHighlighterColor,
    setStrokeWidth
  }), [setPanZoomState, setTool, setColor, setPencilColor, setHighlighterColor, setStrokeWidth]);
};
