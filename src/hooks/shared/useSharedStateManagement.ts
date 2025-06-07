
import { useCallback } from 'react';
import { Tool, PanZoomState } from '@/types/whiteboard';

export const useSharedStateManagement = (setState: any) => {
  // Pan/zoom state management
  const setPanZoomState = useCallback((panZoomState: PanZoomState) => {
    setState((prev: any) => ({
      ...prev,
      panZoomState
    }));
  }, [setState]);

  // Tool change
  const setTool = useCallback((tool: Tool) => {
    setState((prev: any) => ({
      ...prev,
      currentTool: tool
    }));
  }, [setState]);

  // Color change
  const setColor = useCallback((color: string) => {
    setState((prev: any) => ({
      ...prev,
      currentColor: color
    }));
  }, [setState]);

  // Stroke width change
  const setStrokeWidth = useCallback((width: number) => {
    setState((prev: any) => ({
      ...prev,
      currentStrokeWidth: width
    }));
  }, [setState]);

  return {
    setPanZoomState,
    setTool,
    setColor,
    setStrokeWidth
  };
};
