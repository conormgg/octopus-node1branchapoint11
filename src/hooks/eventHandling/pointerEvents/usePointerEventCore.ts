
import { useCallback, useMemo } from 'react';
import Konva from 'konva';
import { usePalmRejection } from '../../usePalmRejection';
import { useStageCoordinates } from '../../useStageCoordinates';
import { PanZoomState } from '@/types/whiteboard';
import { useMemoizedEventHandlers } from '@/hooks/performance/useMemoizedEventHandlers';

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
  logEventHandling: (eventType: string, source: 'pointer' | 'touch' | 'mouse', detail?: Record<string, unknown>) => void;
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

  // Use memoized event handlers for better performance
  const handlers = useMemoizedEventHandlers({
    handlePointerDownEvent: {
      handler: (e: PointerEvent) => {
        const stage = stageRef.current;
        if (!stage) return;

        logEventHandling('pointerdown', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
        
        // Always prevent default for drawing tools to avoid scrolling/selection
        // For select tool, only prevent default for stylus to enable proper drag-to-select
        if (currentToolRef.current !== 'select' || e.pointerType === 'pen') {
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
        
        // Apply palm rejection ONLY if it's enabled
        if (stablePalmRejectionEnabled && !palmRejection.shouldProcessPointer(e)) {
          return;
        }

        const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
        handlePointerDown(x, y);
      },
      deps: [stageRef, logEventHandling, currentToolRef, panZoom, stableIsReadOnly, stablePalmRejectionEnabled, palmRejection, getRelativePointerPosition, handlePointerDown]
    },

    handlePointerMoveEvent: {
      handler: (e: PointerEvent) => {
        const stage = stageRef.current;
        if (!stage) return;

        logEventHandling('pointermove', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
        
        // Always prevent default for drawing tools to avoid scrolling/selection
        // For select tool, only prevent default for stylus to enable proper drag-to-select
        if (currentToolRef.current !== 'select' || e.pointerType === 'pen') {
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
        
        // Apply palm rejection ONLY if it's enabled
        if (stablePalmRejectionEnabled && !palmRejection.shouldProcessPointer(e)) return;

        const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
        handlePointerMove(x, y);
      },
      deps: [stageRef, logEventHandling, currentToolRef, panZoom, stableIsReadOnly, stablePalmRejectionEnabled, palmRejection, getRelativePointerPosition, handlePointerMove]
    },

    handlePointerUpEvent: {
      handler: (e: PointerEvent) => {
        logEventHandling('pointerup', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
        
        // Always prevent default for drawing tools to avoid scrolling/selection
        // For select tool, only prevent default for stylus to enable proper drag-to-select
        if (currentToolRef.current !== 'select' || e.pointerType === 'pen') {
          e.preventDefault();
        }
        
        // Handle right-click pan end - works for everyone, including read-only users
        if (e.button === 2) {
          e.preventDefault();
          panZoom.stopPan();
          return;
        }
        
        // Always clean up palm rejection state
        palmRejection.onPointerEnd(e.pointerId);
        
        // Only call handlePointerUp for drawing if not in read-only mode
        if (!stableIsReadOnly) {
          handlePointerUp();
        }
      },
      deps: [logEventHandling, currentToolRef, panZoom, palmRejection, stableIsReadOnly, handlePointerUp]
    },

    handlePointerLeaveEvent: {
      handler: (e: PointerEvent) => {
        logEventHandling('pointerleave', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
        
        // Always clean up palm rejection state
        palmRejection.onPointerEnd(e.pointerId);
        panZoom.stopPan(); // Always stop pan on leave
        
        // Only call handlePointerUp for drawing if not in read-only mode
        if (!stableIsReadOnly) {
          handlePointerUp();
        }
      },
      deps: [logEventHandling, palmRejection, panZoom, stableIsReadOnly, handlePointerUp]
    },

    handleContextMenu: {
      handler: (e: Event) => {
        e.preventDefault(); // Prevent context menu on right-click
      },
      deps: []
    }
  });

  return handlers;
};
