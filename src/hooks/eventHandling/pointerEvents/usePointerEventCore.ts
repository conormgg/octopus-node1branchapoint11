
import { useCallback, useMemo } from 'react';
import Konva from 'konva';
import { usePalmRejection } from '../../usePalmRejection';
import { useStageCoordinates } from '../../useStageCoordinates';
import { PanZoomState } from '@/types/whiteboard';

interface UsePointerEventCoreProps {
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
}

export const usePointerEventCore = ({
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
  logEventHandling
}: UsePointerEventCoreProps) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  // Memoize stable values to prevent unnecessary re-renders
  const stablePalmRejectionEnabled = useMemo(() => palmRejectionConfig.enabled, [palmRejectionConfig.enabled]);
  const stableIsReadOnly = useMemo(() => isReadOnly, [isReadOnly]);

  const handlePointerDownEvent = useCallback((e: PointerEvent) => {
    const stage = stageRef.current;
    if (!stage) return;

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
    if (stableIsReadOnly) return;
    
    // Apply palm rejection for drawing interactions
    if (stablePalmRejectionEnabled && !palmRejection.shouldProcessPointer(e)) {
      return;
    }

    const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
    handlePointerDown(x, y);
  }, [stageRef, logEventHandling, currentToolRef, panZoom, stableIsReadOnly, stablePalmRejectionEnabled, palmRejection, getRelativePointerPosition, handlePointerDown]);

  const handlePointerMoveEvent = useCallback((e: PointerEvent) => {
    const stage = stageRef.current;
    if (!stage) return;

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
    if (stableIsReadOnly) return;
    
    // Apply palm rejection for drawing interactions
    if (stablePalmRejectionEnabled && !palmRejection.shouldProcessPointer(e)) return;

    const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
    handlePointerMove(x, y);
  }, [stageRef, logEventHandling, currentToolRef, panZoom, stableIsReadOnly, stablePalmRejectionEnabled, palmRejection, getRelativePointerPosition, handlePointerMove]);

  const handlePointerUpEvent = useCallback((e: PointerEvent) => {
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
    if (!stableIsReadOnly) {
      handlePointerUp();
    }
  }, [logEventHandling, currentToolRef, panZoom, palmRejection, stableIsReadOnly, handlePointerUp]);

  const handlePointerLeaveEvent = useCallback((e: PointerEvent) => {
    logEventHandling('pointerleave', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
    
    palmRejection.onPointerEnd(e.pointerId);
    panZoom.stopPan(); // Always stop pan on leave
    
    // Only call handlePointerUp for drawing if not in read-only mode
    if (!stableIsReadOnly) {
      handlePointerUp();
    }
  }, [logEventHandling, palmRejection, panZoom, stableIsReadOnly, handlePointerUp]);

  const handleContextMenu = useCallback((e: Event) => {
    e.preventDefault(); // Prevent context menu on right-click
  }, []);

  // Memoize the returned handlers to prevent unnecessary re-renders
  return useMemo(() => ({
    handlePointerDownEvent,
    handlePointerMoveEvent,
    handlePointerUpEvent,
    handlePointerLeaveEvent,
    handleContextMenu
  }), [handlePointerDownEvent, handlePointerMoveEvent, handlePointerUpEvent, handlePointerLeaveEvent, handleContextMenu]);
};
