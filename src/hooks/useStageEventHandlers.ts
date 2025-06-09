
import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { usePalmRejection } from './usePalmRejection';
import { useStageCoordinates } from './useStageCoordinates';
import { PanZoomState } from '@/types/whiteboard';

interface UseStageEventHandlersProps {
  containerRef: React.RefObject<HTMLDivElement>;
  stageRef: React.RefObject<Konva.Stage>;
  panZoomState: PanZoomState;
  palmRejection: ReturnType<typeof usePalmRejection>;
  palmRejectionConfig: {
    enabled: boolean;
  };
  panZoom: {
    handleWheel: (e: WheelEvent) => void;
    handleTouchStart: (e: TouchEvent) => void;
    handleTouchMove: (e: TouchEvent) => void;
    handleTouchEnd: (e: TouchEvent) => void;
    startPan: (x: number, y: number) => void;
    continuePan: (x: number, y: number) => void;
    stopPan: () => void;
  };
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  isReadOnly: boolean;
}

export const useStageEventHandlers = ({
  containerRef,
  stageRef,
  panZoomState,
  palmRejection,
  palmRejectionConfig,
  panZoom,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly
}: UseStageEventHandlersProps) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  // Wheel event for zoom - always works regardless of read-only status
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', panZoom.handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', panZoom.handleWheel);
    };
  }, [panZoom.handleWheel]);

  // Touch events for pinch/pan - always works regardless of read-only status
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // Prevent iOS context menu
      panZoom.handleTouchStart(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling and selection
      panZoom.handleTouchMove(e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault(); // Prevent default touch behaviors
      panZoom.handleTouchEnd(e);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [panZoom.handleTouchStart, panZoom.handleTouchMove, panZoom.handleTouchEnd]);

  // Pointer event handlers with proper separation of pan/zoom and drawing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerDownEvent = (e: PointerEvent) => {
      e.preventDefault();
      
      // Handle right-click pan - works for everyone, including read-only users
      if (e.button === 2) {
        panZoom.startPan(e.clientX, e.clientY);
        return;
      }
      
      // Only proceed with drawing if not in read-only mode
      if (isReadOnly) return;
      
      // Don't process drawing if palm rejection is enabled and rejects this pointer
      if (palmRejectionConfig.enabled && !palmRejection.shouldProcessPointer(e)) {
        console.log('Palm rejection: Ignoring pointer', e.pointerId, e.pointerType);
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;

      const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
      handlePointerDown(x, y);
    };

    const handlePointerMoveEvent = (e: PointerEvent) => {
      e.preventDefault();
      
      // Handle right-click pan - works for everyone, including read-only users
      if (e.buttons === 2) {
        panZoom.continuePan(e.clientX, e.clientY);
        return;
      }
      
      // Only proceed with drawing if not in read-only mode
      if (isReadOnly) return;
      
      // Don't process drawing if palm rejection rejects this pointer
      if (palmRejectionConfig.enabled && !palmRejection.shouldProcessPointer(e)) return;

      const stage = stageRef.current;
      if (!stage) return;

      const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
      handlePointerMove(x, y);
    };

    const handlePointerUpEvent = (e: PointerEvent) => {
      e.preventDefault();
      
      // Handle right-click pan end - works for everyone, including read-only users
      if (e.button === 2) {
        panZoom.stopPan();
        return;
      }
      
      palmRejection.onPointerEnd(e.pointerId);
      
      // Only call handlePointerUp for drawing if not in read-only mode
      if (!isReadOnly) {
        handlePointerUp();
      }
    };

    const handlePointerLeaveEvent = (e: PointerEvent) => {
      palmRejection.onPointerEnd(e.pointerId);
      panZoom.stopPan(); // Always stop pan on leave
      
      // Only call handlePointerUp for drawing if not in read-only mode
      if (!isReadOnly) {
        handlePointerUp();
      }
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault(); // Prevent context menu on right-click
    };

    container.addEventListener('pointerdown', handlePointerDownEvent);
    container.addEventListener('pointermove', handlePointerMoveEvent);
    container.addEventListener('pointerup', handlePointerUpEvent);
    container.addEventListener('pointerleave', handlePointerLeaveEvent);
    container.addEventListener('pointercancel', handlePointerUpEvent);
    container.addEventListener('contextmenu', handleContextMenu);

    // Set touch-action to none for better pointer event handling
    container.style.touchAction = 'none';

    return () => {
      container.removeEventListener('pointerdown', handlePointerDownEvent);
      container.removeEventListener('pointermove', handlePointerMoveEvent);
      container.removeEventListener('pointerup', handlePointerUpEvent);
      container.removeEventListener('pointerleave', handlePointerLeaveEvent);
      container.removeEventListener('pointercancel', handlePointerUpEvent);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.style.touchAction = '';
    };
  }, [palmRejection, handlePointerDown, handlePointerMove, handlePointerUp, panZoomState, isReadOnly, palmRejectionConfig.enabled, panZoom, getRelativePointerPosition, stageRef]);
};
