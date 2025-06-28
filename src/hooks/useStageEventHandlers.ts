
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
        // Update touch-action when tool changes
        const container = containerRef.current;
        if (container) {
          container.style.touchAction = newTool === 'select' ? 'manipulation' : 'none';
        }
      }
    };
    
    // Initial update
    updateTool();
    
    // Listen for attribute changes
    const interval = setInterval(updateTool, 100);
    
    return () => clearInterval(interval);
  }, [stageRef, containerRef]);

  // Wheel event handlers - always active for pan/zoom
  useWheelEventHandlers({
    containerRef,
    panZoom
  });

  // Touch events for pinch/pan - simplified to only handle multi-touch
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      logEventHandling('touchstart', 'touch', { touches: e.touches.length });
      
      // Only handle multi-touch gestures for pan/zoom
      if (e.touches.length >= 2) {
        e.preventDefault();
        panZoom.handleTouchStart(e);
      } else if (!palmRejectionConfig.enabled) {
        // Prevent default for single touch only if palm rejection is disabled
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      logEventHandling('touchmove', 'touch', { touches: e.touches.length });
      
      // Handle multi-touch gestures
      if (e.touches.length >= 2) {
        e.preventDefault();
        panZoom.handleTouchMove(e);
      } else {
        // Always prevent default for single touch move to avoid scrolling
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      logEventHandling('touchend', 'touch', { touches: e.touches.length });
      e.preventDefault();
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
  }, [panZoom, palmRejectionConfig.enabled, logEventHandling]);

  // Pointer event handlers - tool-aware implementation
  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const handlePointerDownEvent = (e: PointerEvent) => {
      logEventHandling('pointerdown', 'pointer', { 
        pointerId: e.pointerId, 
        pointerType: e.pointerType,
        button: e.button,
        tool: currentToolRef.current 
      });

      // Always handle right-click pan regardless of tool, but not for stylus
      if (e.pointerType !== 'pen' && e.button === 2) {
        e.preventDefault();
        panZoom.startPan(e.clientX, e.clientY);
        return;
      }
      
      // For select tool, let Konva handle the events natively
      if (currentToolRef.current === 'select') {
        return;
      }
      
      // Prevent default for drawing tools to avoid conflicts
      e.preventDefault();
      
      // Only proceed with drawing if not in read-only mode
      if (isReadOnly) return;
      
      // Apply palm rejection only if it's enabled
      if (palmRejectionConfig.enabled && !palmRejection.shouldProcessPointer(e)) {
        return;
      }

      const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
      handlePointerDown(x, y);
    };

    const handlePointerMoveEvent = (e: PointerEvent) => {
      logEventHandling('pointermove', 'pointer', { 
        pointerId: e.pointerId, 
        pointerType: e.pointerType,
        buttons: e.buttons,
        tool: currentToolRef.current 
      });

      // Always handle right-click pan regardless of tool, but not for stylus
      if (e.pointerType !== 'pen' && e.buttons === 2) {
        e.preventDefault();
        panZoom.continuePan(e.clientX, e.clientY);
        return;
      }
      
      // For select tool, let Konva handle the events natively
      if (currentToolRef.current === 'select') {
        return;
      }
      
      // Prevent default for drawing tools to avoid conflicts
      e.preventDefault();
      
      // Only proceed with drawing if not in read-only mode
      if (isReadOnly) return;
      
      // Apply palm rejection only if it's enabled
      if (palmRejectionConfig.enabled && !palmRejection.shouldProcessPointer(e)) return;

      const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
      handlePointerMove(x, y);
    };

    const handlePointerUpEvent = (e: PointerEvent) => {
      logEventHandling('pointerup', 'pointer', { 
        pointerId: e.pointerId, 
        pointerType: e.pointerType,
        button: e.button,
        tool: currentToolRef.current 
      });

      // Always handle right-click pan end regardless of tool, but not for stylus
      if (e.pointerType !== 'pen' && e.button === 2) {
        e.preventDefault();
        panZoom.stopPan();
        return;
      }
      
      // Always clean up palm rejection state
      palmRejection.onPointerEnd(e.pointerId);
      
      // For select tool, let Konva handle the events natively
      if (currentToolRef.current === 'select') {
        return;
      }
      
      // Prevent default for drawing tools to avoid conflicts
      e.preventDefault();
      
      // Only call handlePointerUp for drawing if not in read-only mode
      if (!isReadOnly) {
        handlePointerUp();
      }
    };

    const handlePointerLeaveEvent = (e: PointerEvent) => {
      logEventHandling('pointerleave', 'pointer', { 
        pointerId: e.pointerId, 
        pointerType: e.pointerType,
        tool: currentToolRef.current 
      });

      // Always clean up palm rejection state
      palmRejection.onPointerEnd(e.pointerId);
      panZoom.stopPan(); // Always stop pan on leave
      
      // For select tool, let Konva handle the events natively
      if (currentToolRef.current === 'select') {
        return;
      }
      
      // Only call handlePointerUp for drawing if not in read-only mode
      if (!isReadOnly) {
        handlePointerUp();
      }
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault(); // Prevent context menu on right-click
    };

    // Always add pointer event listeners for stylus support and right-click panning
    container.addEventListener('pointerdown', handlePointerDownEvent);
    container.addEventListener('pointermove', handlePointerMoveEvent);
    container.addEventListener('pointerup', handlePointerUpEvent);
    container.addEventListener('pointerleave', handlePointerLeaveEvent);
    container.addEventListener('pointercancel', handlePointerUpEvent);
    container.addEventListener('contextmenu', handleContextMenu);

    // Set initial touch-action based on current tool
    container.style.touchAction = currentToolRef.current === 'select' ? 'manipulation' : 'none';

    return () => {
      container.removeEventListener('pointerdown', handlePointerDownEvent);
      container.removeEventListener('pointermove', handlePointerMoveEvent);
      container.removeEventListener('pointerup', handlePointerUpEvent);
      container.removeEventListener('pointerleave', handlePointerLeaveEvent);
      container.removeEventListener('pointercancel', handlePointerUpEvent);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.style.touchAction = '';
    };
  }, [
    containerRef,
    stageRef,
    palmRejection,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    panZoomState,
    isReadOnly,
    palmRejectionConfig.enabled,
    panZoom,
    getRelativePointerPosition,
    logEventHandling
  ]);
};
