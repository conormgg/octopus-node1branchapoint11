
import { useCallback, useMemo } from 'react';
import { Tool, PanZoomState } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('toolSync');

export const useSharedStateManagement = (setState: any) => {
  // Pan/zoom state management - memoized to prevent unnecessary re-renders
  const setPanZoomState = useCallback((panZoomState: PanZoomState) => {
    setState((prev: any) => {
      // Only update if pan/zoom state actually changed
      if (
        prev.panZoomState.x === panZoomState.x &&
        prev.panZoomState.y === panZoomState.y &&
        prev.panZoomState.scale === panZoomState.scale
      ) {
        return prev; // No change, prevent re-render
      }
      
      return {
        ...prev,
        panZoomState
      };
    });
  }, [setState]);

  // Tool change with settings sync - memoized to prevent re-creation
  const setTool = useCallback((tool: Tool) => {
    debugLog('SharedStateManagement', 'Tool change requested in shared state', {
      newTool: tool,
      toolType: typeof tool
    });

    setState((prev: any) => {
      // Only update if tool actually changed
      if (prev.currentTool === tool) {
        debugLog('SharedStateManagement', 'Tool unchanged, skipping update', { tool });
        return prev; // No change, prevent re-render
      }
      
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
      
      debugLog('SharedStateManagement', 'Tool state updated', {
        tool,
        newColor,
        newStrokeWidth,
        previousTool: prev.currentTool
      });

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
    setState((prev: any) => {
      // Only update if color actually changed
      if (prev.currentColor === color) {
        return prev; // No change, prevent re-render
      }
      
      return {
        ...prev,
        currentColor: color
      };
    });
  }, [setState]);

  // Pencil-specific color change with auto-switching - memoized
  const setPencilColor = useCallback((color: string) => {
    debugLog('SharedStateManagement', 'Pencil color change - switching to pencil tool', { color });
    
    setState((prev: any) => {
      // Only update if pencil color actually changed
      if (prev.pencilSettings.color === color && prev.currentTool === 'pencil') {
        return prev; // No change, prevent re-render
      }
      
      return {
        ...prev,
        currentTool: 'pencil',
        currentColor: color,
        currentStrokeWidth: prev.pencilSettings.strokeWidth,
        pencilSettings: { ...prev.pencilSettings, color }
      };
    });
  }, [setState]);

  // Highlighter-specific color change with auto-switching - memoized
  const setHighlighterColor = useCallback((color: string) => {
    debugLog('SharedStateManagement', 'Highlighter color change - switching to highlighter tool', { color });
    
    setState((prev: any) => {
      // Only update if highlighter color actually changed
      if (prev.highlighterSettings.color === color && prev.currentTool === 'highlighter') {
        return prev; // No change, prevent re-render
      }
      
      return {
        ...prev,
        currentTool: 'highlighter',
        currentColor: color,
        currentStrokeWidth: prev.highlighterSettings.strokeWidth,
        highlighterSettings: { ...prev.highlighterSettings, color }
      };
    });
  }, [setState]);

  // Stroke width change with tool-specific storage - memoized
  const setStrokeWidth = useCallback((width: number) => {
    setState((prev: any) => {
      // Only update if stroke width actually changed
      if (prev.currentStrokeWidth === width) {
        return prev; // No change, prevent re-render
      }
      
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
