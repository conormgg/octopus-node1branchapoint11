
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
    
    // Don't start drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) {
      console.log('[SimplifiedPointer] Ignoring pointer down - gesture active');
      return;
    }
    
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      console.log('[SimplifiedPointer] Starting drawing operation');
      drawingCoordination.handleDrawingStart(x, y);
    } else if (currentTool === 'select') {
      console.log('[SimplifiedPointer] Handling selection');
      // Handle selection logic here if needed
    }
  }, [stageRef, getRelativePointerPosition, panZoom, drawingCoordination]);

  // Handle pointer move with coordinate conversion
  const handlePointerMove = useCallback((clientX: number, clientY: number, currentTool: string) => {
    const stage = stageRef.current;
    if (!stage) return;

    const { x, y } = getRelativePointerPosition(stage, clientX, clientY);
    
    // Don't continue drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) return;
    
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      drawingCoordination.handleDrawingContinue(x, y);
    }
  }, [stageRef, getRelativePointerPosition, panZoom, drawingCoordination]);

  // Handle pointer up
  const handlePointerUp = useCallback((currentTool: string) => {
    console.log('[SimplifiedPointer] Pointer up for tool:', currentTool);
    
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      console.log('[SimplifiedPointer] Ending drawing operation');
      drawingCoordination.handleDrawingEnd();
    }
  }, [drawingCoordination]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
