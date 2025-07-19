
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
      debugLog('PointerDown', 'No stage reference available');
      return;
    }

    const { x, y } = getRelativePointerPosition(stage, clientX, clientY);
    
    debugLog('PointerDown', 'Pointer down event', { 
      client: { x: clientX, y: clientY },
      stage: { x, y }, 
      tool: currentTool,
      panZoom: panZoomState
    });
    
    // Don't start drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) {
      debugLog('PointerDown', 'Ignoring pointer down - gesture active');
      return;
    }
    
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      debugLog('PointerDown', 'Starting drawing operation', { coordinates: { x, y } });
      drawingCoordination.handleDrawingStart(x, y);
    } else if (currentTool === 'select') {
      debugLog('PointerDown', 'Handling selection start', { coordinates: { x, y } });
      // Call the shared pointer handlers for selection
      if (selection && selection.handlePointerDown) {
        selection.handlePointerDown(x, y);
      }
    }
  }, [stageRef, getRelativePointerPosition, panZoom, drawingCoordination, selection, panZoomState]);

  // Handle pointer move with coordinate conversion
  const handlePointerMove = useCallback((clientX: number, clientY: number, currentTool: string) => {
    const stage = stageRef.current;
    if (!stage) return;

    const { x, y } = getRelativePointerPosition(stage, clientX, clientY);
    
    // Don't continue drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) return;
    
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      drawingCoordination.handleDrawingContinue(x, y);
    } else if (currentTool === 'select') {
      // Call the shared pointer handlers for selection
      if (selection && selection.handlePointerMove) {
        selection.handlePointerMove(x, y);
      }
    }
  }, [stageRef, getRelativePointerPosition, panZoom, drawingCoordination, selection]);

  // Handle pointer up
  const handlePointerUp = useCallback((currentTool: string) => {
    debugLog('PointerUp', 'Pointer up event', { tool: currentTool });
    
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      debugLog('PointerUp', 'Ending drawing operation');
      drawingCoordination.handleDrawingEnd();
    } else if (currentTool === 'select') {
      debugLog('PointerUp', 'Handling selection end');
      // Call the shared pointer handlers for selection
      if (selection && selection.handlePointerUp) {
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
