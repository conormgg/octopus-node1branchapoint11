
import { useCallback, useMemo } from 'react';
import Konva from 'konva';
import { useStageCoordinates } from './useStageCoordinates';
import { useSimplifiedPointerHandlers } from './useSimplifiedPointerHandlers';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

/**
 * @hook useWhiteboardPointerHandlers
 * @description Handles all pointer events and coordinates with appropriate tools
 */
export const useWhiteboardPointerHandlers = (
  state: any,
  panZoom: any,
  selection: any,
  drawingCoordination: any,
  stageRef?: React.RefObject<Konva.Stage>
) => {
  // Memoize stable references to prevent unnecessary re-renders
  const stableCurrentTool = useMemo(() => state.currentTool, [state.currentTool]);
  const { getRelativePointerPosition } = useStageCoordinates(state.panZoomState);

  // Use simplified handlers for coordinate-based drawing
  const simplifiedHandlers = useSimplifiedPointerHandlers(
    stageRef || { current: null },
    state.panZoomState,
    drawingCoordination,
    selection, // Pass the full selection object with pointer handlers
    panZoom
  );

  // Handle Konva pointer events (for compatibility with existing code)
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    console.log('[WhiteboardPointer] Konva pointer down event received');
    
    // Extract coordinates from the Konva event
    const clientX = e.evt.clientX;
    const clientY = e.evt.clientY;
    
    // Use simplified handler
    simplifiedHandlers.handlePointerDown(clientX, clientY, stableCurrentTool);
  }, [stableCurrentTool, simplifiedHandlers]);

  // Handle pointer move
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const clientX = e.evt.clientX;
    const clientY = e.evt.clientY;
    
    simplifiedHandlers.handlePointerMove(clientX, clientY, stableCurrentTool);
  }, [stableCurrentTool, simplifiedHandlers]);

  // Handle pointer up
  const handlePointerUp = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    console.log('[WhiteboardPointer] Konva pointer up event received');
    simplifiedHandlers.handlePointerUp(stableCurrentTool);
  }, [stableCurrentTool, simplifiedHandlers]);

  // Expose simplified handlers for direct DOM event usage
  const handleDirectPointerDown = useCallback((clientX: number, clientY: number) => {
    console.log('[WhiteboardPointer] Direct pointer down event received');
    simplifiedHandlers.handlePointerDown(clientX, clientY, stableCurrentTool);
  }, [stableCurrentTool, simplifiedHandlers]);

  const handleDirectPointerMove = useCallback((clientX: number, clientY: number) => {
    simplifiedHandlers.handlePointerMove(clientX, clientY, stableCurrentTool);
  }, [stableCurrentTool, simplifiedHandlers]);

  const handleDirectPointerUp = useCallback(() => {
    console.log('[WhiteboardPointer] Direct pointer up event received');
    simplifiedHandlers.handlePointerUp(stableCurrentTool);
  }, [stableCurrentTool, simplifiedHandlers]);

  // Attach whiteboard handlers to the Konva handlers for access in stage event handlers
  const enhancedHandlePointerDown = handlePointerDown as any;
  enhancedHandlePointerDown.__whiteboardHandlers = {
    handleDirectPointerDown,
    handleDirectPointerMove,
    handleDirectPointerUp
  };

  const enhancedHandlePointerMove = handlePointerMove as any;
  enhancedHandlePointerMove.__whiteboardHandlers = {
    handleDirectPointerDown,
    handleDirectPointerMove,
    handleDirectPointerUp
  };

  const enhancedHandlePointerUp = handlePointerUp as any;
  enhancedHandlePointerUp.__whiteboardHandlers = {
    handleDirectPointerDown,
    handleDirectPointerMove,
    handleDirectPointerUp
  };

  return {
    // Konva-compatible handlers with attached direct handlers
    handlePointerDown: enhancedHandlePointerDown,
    handlePointerMove: enhancedHandlePointerMove,
    handlePointerUp: enhancedHandlePointerUp,
    // Direct coordinate handlers
    handleDirectPointerDown,
    handleDirectPointerMove,
    handleDirectPointerUp
  };
};
