
import { useCallback, useRef } from 'react';
import { useMultiTouchDetection } from '@/hooks/eventHandling/useMultiTouchDetection';
import { useStageCoordinates } from '@/hooks/useStageCoordinates';
import { createDebugLogger } from '@/utils/debug/debugConfig';
import Konva from 'konva';

const debugLog = createDebugLogger('events');

interface UseCanvasEventHandlersProps {
  stageRef: React.RefObject<Konva.Stage>;
  panZoomState: any;
  panZoom: any;
  currentTool: string;
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  isReadOnly: boolean;
}

export const useCanvasEventHandlers = ({
  stageRef,
  panZoomState,
  panZoom,
  currentTool,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly
}: UseCanvasEventHandlersProps) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);
  const { isMultiTouch, addPointer, removePointer, setActiveTouches, reset } = useMultiTouchDetection();
  const isDraggingRef = useRef(false);

  // Handle pointer down events
  const onPointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (isReadOnly) return;
    
    const stage = stageRef.current;
    if (!stage) return;

    const pointerId = e.evt.pointerId;
    const pointerType = e.evt.pointerType;
    
    debugLog('Canvas', 'Pointer down', { pointerId, pointerType, currentTool });
    
    // Track pointer for multi-touch detection
    addPointer(pointerId, pointerType);
    
    // Check if this is a multi-touch gesture
    if (isMultiTouch()) {
      debugLog('Canvas', 'Multi-touch detected, starting pan');
      const pos = stage.getPointerPosition();
      if (pos) {
        panZoom.startPan(pos.x, pos.y);
        isDraggingRef.current = true;
      }
      return;
    }
    
    // Single touch/pointer - route based on tool
    const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    
    if (currentTool === 'select' || currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      handlePointerDown(x, y);
    }
  }, [isReadOnly, stageRef, addPointer, isMultiTouch, panZoom, getRelativePointerPosition, currentTool, handlePointerDown]);

  // Handle pointer move events
  const onPointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (isReadOnly) return;
    
    const stage = stageRef.current;
    if (!stage) return;

    const pointerId = e.evt.pointerId;
    const pointerType = e.evt.pointerType;
    
    // Track pointer
    addPointer(pointerId, pointerType);
    
    // Handle multi-touch pan
    if (isMultiTouch() && isDraggingRef.current) {
      const pos = stage.getPointerPosition();
      if (pos) {
        panZoom.continuePan(pos.x, pos.y);
      }
      return;
    }
    
    // Single touch/pointer - route based on tool
    const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    
    if (currentTool === 'select' || currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      handlePointerMove(x, y);
    }
  }, [isReadOnly, stageRef, addPointer, isMultiTouch, panZoom, getRelativePointerPosition, currentTool, handlePointerMove]);

  // Handle pointer up events
  const onPointerUp = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (isReadOnly) return;
    
    const pointerId = e.evt.pointerId;
    
    debugLog('Canvas', 'Pointer up', { pointerId, currentTool });
    
    // Remove pointer from tracking
    removePointer(pointerId);
    
    // End pan if we were panning
    if (isDraggingRef.current) {
      panZoom.stopPan();
      isDraggingRef.current = false;
    }
    
    // Route to tool handler
    if (currentTool === 'select' || currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      handlePointerUp();
    }
  }, [isReadOnly, removePointer, panZoom, currentTool, handlePointerUp]);

  // Handle touch events for mobile
  const onTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (isReadOnly) return;
    
    const touches = e.evt.touches.length;
    debugLog('Canvas', 'Touch start', { touches, currentTool });
    
    setActiveTouches(touches);
    
    // Handle multi-touch pan/zoom
    if (touches >= 2) {
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          panZoom.startPan(pos.x, pos.y);
          isDraggingRef.current = true;
        }
      }
    }
  }, [isReadOnly, setActiveTouches, stageRef, panZoom, currentTool]);

  const onTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (isReadOnly) return;
    
    const touches = e.evt.touches.length;
    setActiveTouches(touches);
    
    // Handle multi-touch pan/zoom
    if (touches >= 2 && isDraggingRef.current) {
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          panZoom.continuePan(pos.x, pos.y);
        }
      }
    }
  }, [isReadOnly, setActiveTouches, stageRef, panZoom]);

  const onTouchEnd = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (isReadOnly) return;
    
    const touches = e.evt.touches.length;
    setActiveTouches(touches);
    
    // End pan when no touches remain
    if (touches === 0 && isDraggingRef.current) {
      panZoom.stopPan();
      isDraggingRef.current = false;
    }
  }, [isReadOnly, setActiveTouches, panZoom]);

  // Reset on tool change
  const resetHandlers = useCallback(() => {
    reset();
    isDraggingRef.current = false;
  }, [reset]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    resetHandlers
  };
};
