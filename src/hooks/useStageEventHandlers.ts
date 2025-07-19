
import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { usePalmRejection } from './usePalmRejection';
import { useStageCoordinates } from './useStageCoordinates';
import { PanZoomState } from '@/types/whiteboard';
import { useEventDebug } from './eventHandling/useEventDebug';
import { useWheelEventHandlers } from './eventHandling/useWheelEventHandlers';

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
  handlePointerDown: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  handlePointerMove: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  handlePointerUp: (e: Konva.KonvaEventObject<PointerEvent>) => void;
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
  const currentToolRef = useRef<string>('pencil');
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);
  const { logEventHandling } = useEventDebug(palmRejectionConfig);

  // Update current tool ref by tracking the stage attribute
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const updateTool = () => {
      const newTool = stage.getAttr('currentTool') as string;
      if (newTool && newTool !== currentToolRef.current) {
        currentToolRef.current = newTool;
        console.log('[StageEventHandlers] Tool updated to:', newTool);
        
        // Update touch-action when tool changes
        const container = containerRef.current;
        if (container) {
          container.style.touchAction = newTool === 'select' ? 'manipulation' : 'none';
        }
      }
    };
    
    // Initial update
    updateTool();
    
    // Check for updates - reduced frequency for better performance
    const interval = setInterval(updateTool, 100);
    
    return () => clearInterval(interval);
  }, [stageRef, containerRef]);

  // Wheel event handlers - always active for pan/zoom
  useWheelEventHandlers({
    containerRef,
    panZoom
  });

  // Touch events for pinch/pan - only for multi-touch gestures
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      logEventHandling('touchstart', 'touch', { touches: e.touches.length });
      
      // Only handle multi-touch gestures (2+ fingers) for pan/zoom
      if (e.touches.length >= 2) {
        console.log('[TouchEvents] Multi-touch detected, handling pan/zoom');
        e.preventDefault();
        panZoom.handleTouchStart(e);
      } else {
        console.log('[TouchEvents] Single touch detected, allowing for pointer events');
        // Don't prevent default - let it become a pointer event
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      logEventHandling('touchmove', 'touch', { touches: e.touches.length });
      
      // Only handle multi-touch gestures
      if (e.touches.length >= 2) {
        e.preventDefault();
        panZoom.handleTouchMove(e);
      }
      // Single touch moves are allowed to become pointer events
    };

    const handleTouchEnd = (e: TouchEvent) => {
      logEventHandling('touchend', 'touch', { 
        touches: e.touches.length,
        changedTouches: e.changedTouches.length 
      });
      
      // Only handle multi-touch scenarios
      if (e.touches.length >= 1 && e.changedTouches.length > 1) {
        e.preventDefault();
        panZoom.handleTouchEnd(e);
      }
      // Single touch end events become pointer events - don't prevent default
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [panZoom, logEventHandling]);

  // Pointer event handlers - the main drawing interface
  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const handleKonvaEvent = (e: PointerEvent) => {
      return {
        evt: e,
        target: stage,
        currentTarget: stage,
        cancelBubble: false,
        type: e.type as any,
        pointerId: e.pointerId
      } as Konva.KonvaEventObject<PointerEvent>;
    };

    const handlePointerDownEvent = (e: PointerEvent) => {
      logEventHandling('pointerdown', 'pointer', { 
        pointerId: e.pointerId, 
        pointerType: e.pointerType,
        button: e.button,
        tool: currentToolRef.current 
      });

      if (e.pointerType !== 'pen' && e.button === 2) {
        e.preventDefault();
        panZoom.startPan(e.clientX, e.clientY);
        return;
      }
      
      if (isReadOnly) return;

      if (
        palmRejectionConfig.enabled &&
        currentToolRef.current !== 'select' &&
        !palmRejection.shouldProcessPointer(e)
      ) {
        return;
      }

      handlePointerDown(handleKonvaEvent(e));
    };

    const handlePointerMoveEvent = (e: PointerEvent) => {
      if (e.pointerType !== 'pen' && e.buttons === 2) {
        e.preventDefault();
        panZoom.continuePan(e.clientX, e.clientY);
        return;
      }
      
      if (isReadOnly) return;

      if (
        palmRejectionConfig.enabled &&
        currentToolRef.current !== 'select' &&
        !palmRejection.shouldProcessPointer(e)
      ) return;

      handlePointerMove(handleKonvaEvent(e));
    };

    const handlePointerUpEvent = (e: PointerEvent) => {
      logEventHandling('pointerup', 'pointer', { 
        pointerId: e.pointerId, 
        pointerType: e.pointerType,
        button: e.button,
        tool: currentToolRef.current 
      });

      if (e.pointerType !== 'pen' && e.button === 2) {
        e.preventDefault();
        panZoom.stopPan();
        return;
      }
      
      palmRejection.onPointerEnd(e.pointerId);
      
      if (isReadOnly) return;

      handlePointerUp(handleKonvaEvent(e));
    };

    const handlePointerLeaveEvent = (e: PointerEvent) => {
      palmRejection.onPointerEnd(e.pointerId);
      panZoom.stopPan();
      if (isReadOnly) return;
      handlePointerUp(handleKonvaEvent(e));
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    container.addEventListener('pointerdown', handlePointerDownEvent);
    container.addEventListener('pointermove', handlePointerMoveEvent);
    container.addEventListener('pointerup', handlePointerUpEvent);
    container.addEventListener('pointerleave', handlePointerLeaveEvent);
    container.addEventListener('pointercancel', handlePointerUpEvent);
    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDownEvent);
      container.removeEventListener('pointermove', handlePointerMoveEvent);
      container.removeEventListener('pointerup', handlePointerUpEvent);
      container.removeEventListener('pointerleave', handlePointerLeaveEvent);
      container.removeEventListener('pointercancel', handlePointerUpEvent);
      container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    containerRef,
    stageRef,
    isReadOnly,
    palmRejectionConfig.enabled,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    panZoom,
    palmRejection
  ]);
};
