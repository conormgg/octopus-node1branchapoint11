
import { useCallback, useRef } from 'react';
import { useMultiTouchDetection } from '@/hooks/eventHandling/useMultiTouchDetection';
import { useStageCoordinates } from '@/hooks/useStageCoordinates';
import { useTouchHandlers } from '@/hooks/panZoom/useTouchHandlers';
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
  const isRightClickPanRef = useRef(false);
  const isMiddleClickPanRef = useRef(false);

  // Get advanced touch handlers
  const touchHandlers = useTouchHandlers(
    {
      startPan: panZoom.startPan,
      continuePan: panZoom.continuePan,
      stopPan: panZoom.stopPan,
      setIsGestureActiveState: (active: boolean) => {
        isDraggingRef.current = active;
      },
      isGestureActive: () => isDraggingRef.current
    },
    panZoom.zoom,
    currentTool
  );

  // Handle pointer down events
  const onPointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerId = e.evt.pointerId;
    const pointerType = e.evt.pointerType;
    const button = e.evt.button;
    
    debugLog('Canvas', 'Pointer down', { pointerId, pointerType, button, currentTool });
    
    // Stop any active pan before starting new actions (except for pan buttons)
    if (button !== 1 && button !== 2 && (isRightClickPanRef.current || isMiddleClickPanRef.current)) {
      debugLog('Canvas', 'Stopping active pan before new action');
      panZoom.stopPan();
      isRightClickPanRef.current = false;
      isMiddleClickPanRef.current = false;
      isDraggingRef.current = false;
    }
    
    // Handle right-click pan (button 2) - works regardless of read-only status
    if (button === 2) {
      debugLog('Canvas', 'Right-click pan detected');
      const pos = stage.getPointerPosition();
      if (pos) {
        panZoom.startPan(pos.x, pos.y);
        isRightClickPanRef.current = true;
        isDraggingRef.current = true;
      }
      return;
    }

    // Handle middle-click pan (button 1) - works regardless of read-only status
    if (button === 1) {
      debugLog('Canvas', 'Middle-click pan detected');
      const pos = stage.getPointerPosition();
      if (pos) {
        panZoom.startPan(pos.x, pos.y);
        isMiddleClickPanRef.current = true;
        isDraggingRef.current = true;
      }
      return;
    }

    // Don't handle other interactions if read-only
    if (isReadOnly) return;
    
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
    
    // Single touch/pointer with left button - route based on tool
    if (button === 0) {
      const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
      
      if (currentTool === 'select' || currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
        handlePointerDown(x, y);
      }
    }
  }, [stageRef, addPointer, isMultiTouch, panZoom, getRelativePointerPosition, currentTool, handlePointerDown, isReadOnly]);

  // Handle pointer move events
  const onPointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerId = e.evt.pointerId;
    const pointerType = e.evt.pointerType;
    
    // Handle right-click or middle-click pan
    if (isRightClickPanRef.current || isMiddleClickPanRef.current) {
      const pos = stage.getPointerPosition();
      if (pos) {
        panZoom.continuePan(pos.x, pos.y);
      }
      return;
    }

    // Don't handle other interactions if read-only
    if (isReadOnly) return;
    
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
  }, [stageRef, addPointer, isMultiTouch, panZoom, getRelativePointerPosition, currentTool, handlePointerMove, isReadOnly]);

  // Handle pointer up events
  const onPointerUp = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const pointerId = e.evt.pointerId;
    const button = e.evt.button;
    
    debugLog('Canvas', 'Pointer up', { pointerId, button, currentTool });
    
    // Handle right-click or middle-click pan end - stop pan regardless of which button is released
    if (isRightClickPanRef.current || isMiddleClickPanRef.current) {
      debugLog('Canvas', 'Stopping pan on pointer up');
      panZoom.stopPan();
      isRightClickPanRef.current = false;
      isMiddleClickPanRef.current = false;
      isDraggingRef.current = false;
      
      // If this was a left-click after panning, don't process it further
      if (button === 0) {
        return;
      }
    }

    // Don't handle other interactions if read-only
    if (isReadOnly) return;
    
    // Remove pointer from tracking
    removePointer(pointerId);
    
    // End pan if we were panning
    if (isDraggingRef.current) {
      panZoom.stopPan();
      isDraggingRef.current = false;
    }
    
    // Route to tool handler for left button
    if (button === 0 && (currentTool === 'select' || currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser')) {
      handlePointerUp();
    }
  }, [removePointer, panZoom, currentTool, handlePointerUp, isReadOnly]);

  // Handle context menu (right-click menu)
  const onContextMenu = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Prevent context menu when right-click panning
    e.evt.preventDefault();
  }, []);

  // Handle touch events for mobile using advanced touch handlers
  const onTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (isReadOnly && e.evt.touches.length === 1) return;
    
    const touches = e.evt.touches.length;
    debugLog('Canvas', 'Touch start', { touches, currentTool });
    
    setActiveTouches(touches);
    
    // Use advanced touch handlers
    touchHandlers.handleTouchStart(e.evt);
  }, [setActiveTouches, touchHandlers, currentTool, isReadOnly]);

  const onTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (isReadOnly && e.evt.touches.length === 1) return;
    
    const touches = e.evt.touches.length;
    setActiveTouches(touches);
    
    // Use advanced touch handlers
    touchHandlers.handleTouchMove(e.evt);
  }, [setActiveTouches, touchHandlers, isReadOnly]);

  const onTouchEnd = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (isReadOnly && e.evt.touches.length === 0) return;
    
    const touches = e.evt.touches.length;
    setActiveTouches(touches);
    
    // Use advanced touch handlers
    touchHandlers.handleTouchEnd(e.evt);
  }, [setActiveTouches, touchHandlers, isReadOnly]);

  // Reset on tool change
  const resetHandlers = useCallback(() => {
    reset();
    isDraggingRef.current = false;
    isRightClickPanRef.current = false;
    isMiddleClickPanRef.current = false;
  }, [reset]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onContextMenu,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    resetHandlers
  };
};
