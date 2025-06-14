
import { useEffect } from 'react';
import Konva from 'konva';
import { usePalmRejection } from '../usePalmRejection';
import { useStageCoordinates } from '../useStageCoordinates';
import { PanZoomState } from '@/types/whiteboard';

interface UsePointerEventHandlersProps {
  containerRef: React.RefObject<HTMLDivElement>;
  stageRef: React.RefObject<Konva.Stage>;
  panZoomState: PanZoomState;
  palmRejection: ReturnType<typeof usePalmRejection>;
  palmRejectionConfig: {
    enabled: boolean;
  };
  panZoom: {
    startPan: (x: number, y: number) => void;
    continuePan: (x: number, y: number) => void;
    stopPan: () => void;
  };
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  isReadOnly: boolean;
  currentToolRef: React.RefObject<string>;
  logEventHandling: (eventType: string, source: 'pointer' | 'touch' | 'mouse', detail?: any) => void;
  supportsPointerEvents: boolean;
}

export const usePointerEventHandlers = ({
  containerRef,
  stageRef,
  panZoomState,
  palmRejection,
  palmRejectionConfig,
  panZoom,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly,
  currentToolRef,
  logEventHandling,
  supportsPointerEvents
}: UsePointerEventHandlersProps) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  // Pointer event handlers with proper separation of pan/zoom and drawing
  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    // STAGE 3: Enhanced condition with fallback safety
    const shouldUsePointerEvents = palmRejectionConfig.enabled && supportsPointerEvents;

    // STAGE 3: Wrap handlers in try-catch for error safety
    const handlePointerDownEvent = (e: PointerEvent) => {
      try {
        logEventHandling('pointerdown', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
        
        // Don't prevent default for select tool - let Konva handle dragging
        if (currentToolRef.current !== 'select') {
          e.preventDefault();
        }
        
        // Handle right-click pan - works for everyone, including read-only users
        if (e.button === 2) {
          e.preventDefault();
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

        const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
        handlePointerDown(x, y);
      } catch (error) {
        console.error('[EventDebug] Error in pointer down handler:', error);
        // STAGE 3: Fallback - ensure pan is stopped on error
        panZoom.stopPan();
      }
    };

    const handlePointerMoveEvent = (e: PointerEvent) => {
      try {
        logEventHandling('pointermove', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
        
        // Don't prevent default for select tool - let Konva handle dragging
        if (currentToolRef.current !== 'select') {
          e.preventDefault();
        }
        
        // Handle right-click pan - works for everyone, including read-only users
        if (e.buttons === 2) {
          e.preventDefault();
          panZoom.continuePan(e.clientX, e.clientY);
          return;
        }
        
        // Only proceed with drawing if not in read-only mode
        if (isReadOnly) return;
        
        // Don't process drawing if palm rejection rejects this pointer
        if (palmRejectionConfig.enabled && !palmRejection.shouldProcessPointer(e)) return;

        const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
        handlePointerMove(x, y);
      } catch (error) {
        console.error('[EventDebug] Error in pointer move handler:', error);
      }
    };

    const handlePointerUpEvent = (e: PointerEvent) => {
      try {
        logEventHandling('pointerup', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
        
        // Don't prevent default for select tool - let Konva handle dragging
        if (currentToolRef.current !== 'select') {
          e.preventDefault();
        }
        
        // Handle right-click pan end - works for everyone, including read-only users
        if (e.button === 2) {
          e.preventDefault();
          panZoom.stopPan();
          return;
        }
        
        palmRejection.onPointerEnd(e.pointerId);
        
        // Only call handlePointerUp for drawing if not in read-only mode
        if (!isReadOnly) {
          handlePointerUp();
        }
      } catch (error) {
        console.error('[EventDebug] Error in pointer up handler:', error);
        // STAGE 3: Ensure cleanup on error
        palmRejection.onPointerEnd(e.pointerId);
        panZoom.stopPan();
      }
    };

    const handlePointerLeaveEvent = (e: PointerEvent) => {
      try {
        logEventHandling('pointerleave', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
        
        palmRejection.onPointerEnd(e.pointerId);
        panZoom.stopPan(); // Always stop pan on leave
        
        // Only call handlePointerUp for drawing if not in read-only mode
        if (!isReadOnly) {
          handlePointerUp();
        }
      } catch (error) {
        console.error('[EventDebug] Error in pointer leave handler:', error);
        // STAGE 3: Ensure cleanup on error
        palmRejection.onPointerEnd(e.pointerId);
        panZoom.stopPan();
      }
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault(); // Prevent context menu on right-click
    };

    // STAGE 3: Add registration with error handling
    if (shouldUsePointerEvents) {
      try {
        console.log('[EventDebug] Stage 3: Registering pointer event listeners with error boundaries');
        container.addEventListener('pointerdown', handlePointerDownEvent);
        container.addEventListener('pointermove', handlePointerMoveEvent);
        container.addEventListener('pointerup', handlePointerUpEvent);
        container.addEventListener('pointerleave', handlePointerLeaveEvent);
        container.addEventListener('pointercancel', handlePointerUpEvent);
      } catch (error) {
        console.error('[EventDebug] Stage 3: Failed to register pointer events, falling back to touch/mouse:', error);
      }
    } else {
      console.log('[EventDebug] Stage 3: Skipping pointer event listeners - touch/mouse events will handle input');
    }
    
    container.addEventListener('contextmenu', handleContextMenu);

    // STAGE 3: Set touch-action with fallback
    try {
      container.style.touchAction = shouldUsePointerEvents ? 'none' : 'manipulation';
    } catch (error) {
      console.error('[EventDebug] Stage 3: Failed to set touch-action:', error);
    }

    return () => {
      try {
        if (shouldUsePointerEvents) {
          console.log('[EventDebug] Stage 3: Removing pointer event listeners');
          container.removeEventListener('pointerdown', handlePointerDownEvent);
          container.removeEventListener('pointermove', handlePointerMoveEvent);
          container.removeEventListener('pointerup', handlePointerUpEvent);
          container.removeEventListener('pointerleave', handlePointerLeaveEvent);
          container.removeEventListener('pointercancel', handlePointerUpEvent);
        }
        container.removeEventListener('contextmenu', handleContextMenu);
        container.style.touchAction = '';
      } catch (error) {
        console.error('[EventDebug] Stage 3: Error during cleanup:', error);
      }
    };
  }, [palmRejection, handlePointerDown, handlePointerMove, handlePointerUp, panZoomState, isReadOnly, palmRejectionConfig.enabled, panZoom, getRelativePointerPosition, stageRef, currentToolRef, logEventHandling, supportsPointerEvents]);
};
