
import { useCallback } from 'react';
import { useStageCoordinates } from './useStageCoordinates';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

/**
 * @hook useSimplifiedPointerHandlers
 * @description Simple coordinate-based pointer handlers that work with DOM events
 */
export const useSimplifiedPointerHandlers = (
  stageRef: React.RefObject<any>,
  panZoomState: any,
  drawingCoordination: any,
  selection: any,
  panZoom: any
) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  // Handle pointer down with coordinate conversion
  const handlePointerDown = useCallback((clientX: number, clientY: number, currentTool: string) => {
    const stage = stageRef.current;
    if (!stage) {
      console.log('[SimplifiedPointer] No stage reference');
      return;
    }

    const { x, y } = getRelativePointerPosition(stage, clientX, clientY);
    console.log('[SimplifiedPointer] Pointer down at stage coordinates:', { x, y, tool: currentTool });
    
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      console.log('[SimplifiedPointer] Starting drawing operation');
      if (drawingCoordination?.handleDrawingStart) {
        drawingCoordination.handleDrawingStart(x, y);
      } else {
        console.warn('[SimplifiedPointer] No drawing coordination available');
      }
    } else if (currentTool === 'select') {
      console.log('[SimplifiedPointer] Handling selection start');
      
      // Don't start selection if a pan/zoom gesture is active
      if (panZoom?.isGestureActive && panZoom.isGestureActive()) {
        console.log('[SimplifiedPointer] Ignoring pointer down - gesture active');
        return;
      }
      
      // Call the shared pointer handlers for selection
      if (selection?.handlePointerDown) {
        selection.handlePointerDown(x, y);
      } else {
        console.warn('[SimplifiedPointer] No selection handler available');
      }
    }
  }, [stageRef, getRelativePointerPosition, panZoom, drawingCoordination, selection]);

  // Handle pointer move with coordinate conversion
  const handlePointerMove = useCallback((clientX: number, clientY: number, currentTool: string) => {
    const stage = stageRef.current;
    if (!stage) return;

    const { x, y } = getRelativePointerPosition(stage, clientX, clientY);
    
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      console.log('[SimplifiedPointer] Continuing drawing operation');
      if (drawingCoordination?.handleDrawingContinue) {
        drawingCoordination.handleDrawingContinue(x, y);
      }
    } else if (currentTool === 'select') {
      // Don't continue selection if a pan/zoom gesture is active
      if (panZoom?.isGestureActive && panZoom.isGestureActive()) return;
      
      // Call the shared pointer handlers for selection
      if (selection?.handlePointerMove) {
        selection.handlePointerMove(x, y);
      }
    }
  }, [stageRef, getRelativePointerPosition, panZoom, drawingCoordination, selection]);

  // Handle pointer up
  const handlePointerUp = useCallback((currentTool: string) => {
    console.log('[SimplifiedPointer] Pointer up for tool:', currentTool);
    
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      console.log('[SimplifiedPointer] Ending drawing operation');
      if (drawingCoordination?.handleDrawingEnd) {
        drawingCoordination.handleDrawingEnd();
      }
    } else if (currentTool === 'select') {
      console.log('[SimplifiedPointer] Handling selection end');
      // Call the shared pointer handlers for selection
      if (selection?.handlePointerUp) {
        selection.handlePointerUp();
      }
    }
  }, [drawingCoordination, selection]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
