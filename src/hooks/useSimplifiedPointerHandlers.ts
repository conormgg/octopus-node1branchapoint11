
import { useCallback } from 'react';
import { useStageCoordinates } from './useStageCoordinates';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

export const useSimplifiedPointerHandlers = (
  stageRef: React.RefObject<any>,
  panZoomState: any,
  drawingCoordination: any,
  selection: any,
  panZoom: any
) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  const handlePointerDown = useCallback((clientX: number, clientY: number, currentTool: string) => {
    const stage = stageRef.current;
    if (!stage) {
      console.log('[SimplifiedPointer] ERROR: No stage reference');
      return;
    }

    console.log('[SimplifiedPointer] POINTER DOWN - Converting coordinates:', { clientX, clientY, tool: currentTool });
    
    try {
      const { x, y } = getRelativePointerPosition(stage, clientX, clientY);
      console.log('[SimplifiedPointer] Stage coordinates:', { x, y, tool: currentTool });
      
      // Check if pan/zoom is actually interfering
      const gestureActive = panZoom?.isGestureActive?.();
      if (gestureActive) {
        console.log('[SimplifiedPointer] WARNING: Gesture active, ignoring pointer down');
        return;
      }
      
      if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
        console.log('[SimplifiedPointer] Starting drawing operation for tool:', currentTool);
        if (drawingCoordination?.handleDrawingStart) {
          drawingCoordination.handleDrawingStart(x, y);
          console.log('[SimplifiedPointer] Drawing start called successfully');
        } else {
          console.log('[SimplifiedPointer] ERROR: No drawingCoordination.handleDrawingStart method');
        }
      } else if (currentTool === 'select') {
        console.log('[SimplifiedPointer] Handling selection start');
        if (selection?.handlePointerDown) {
          selection.handlePointerDown(x, y);
          console.log('[SimplifiedPointer] Selection pointer down called successfully');
        } else {
          console.log('[SimplifiedPointer] WARNING: No selection.handlePointerDown method');
        }
      }
    } catch (error) {
      console.error('[SimplifiedPointer] ERROR in handlePointerDown:', error);
    }
  }, [stageRef, getRelativePointerPosition, panZoom, drawingCoordination, selection]);

  const handlePointerMove = useCallback((clientX: number, clientY: number, currentTool: string) => {
    const stage = stageRef.current;
    if (!stage) return;

    try {
      const { x, y } = getRelativePointerPosition(stage, clientX, clientY);
      
      // Check if pan/zoom is actually interfering  
      const gestureActive = panZoom?.isGestureActive?.();
      if (gestureActive) {
        return;
      }
      
      if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
        console.log('[SimplifiedPointer] Continuing drawing operation for tool:', currentTool, 'at:', { x, y });
        if (drawingCoordination?.handleDrawingContinue) {
          drawingCoordination.handleDrawingContinue(x, y);
        } else {
          console.log('[SimplifiedPointer] WARNING: No drawingCoordination.handleDrawingContinue method');
        }
      } else if (currentTool === 'select') {
        if (selection?.handlePointerMove) {
          selection.handlePointerMove(x, y);
        }
      }
    } catch (error) {
      console.error('[SimplifiedPointer] ERROR in handlePointerMove:', error);
    }
  }, [stageRef, getRelativePointerPosition, panZoom, drawingCoordination, selection]);

  const handlePointerUp = useCallback((currentTool: string) => {
    console.log('[SimplifiedPointer] POINTER UP for tool:', currentTool);
    
    try {
      if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
        console.log('[SimplifiedPointer] Ending drawing operation for tool:', currentTool);
        if (drawingCoordination?.handleDrawingEnd) {
          drawingCoordination.handleDrawingEnd();
          console.log('[SimplifiedPointer] Drawing end called successfully');
        } else {
          console.log('[SimplifiedPointer] ERROR: No drawingCoordination.handleDrawingEnd method');
        }
      } else if (currentTool === 'select') {
        console.log('[SimplifiedPointer] Handling selection end');
        if (selection?.handlePointerUp) {
          selection.handlePointerUp();
          console.log('[SimplifiedPointer] Selection pointer up called successfully');
        } else {
          console.log('[SimplifiedPointer] WARNING: No selection.handlePointerUp method');
        }
      }
    } catch (error) {
      console.error('[SimplifiedPointer] ERROR in handlePointerUp:', error);
    }
  }, [drawingCoordination, selection]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
