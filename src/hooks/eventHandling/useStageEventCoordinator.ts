
import React from 'react';
import Konva from 'konva';
import { usePalmRejection } from '../usePalmRejection';
import { PanZoomState } from '@/types/whiteboard';
import { useEventDebug } from './useEventDebug';
import { useWheelEventHandlers } from './useWheelEventHandlers';
import { useTouchEventHandlers } from './useTouchEventHandlers';
import { usePointerEventHandlers } from './usePointerEventHandlers';
import { useToolSyncHandler } from './useToolSyncHandler';
import { usePointerEventDetection } from './usePointerEventDetection';

interface UseStageEventCoordinatorProps {
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

export const useStageEventCoordinator = ({
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
}: UseStageEventCoordinatorProps) => {
  const { logEventHandling } = useEventDebug(palmRejectionConfig);
  const { currentToolRef } = useToolSyncHandler({ stageRef, containerRef });
  const { supportsPointerEvents } = usePointerEventDetection();

  // Wheel event handlers - always active for pan/zoom
  useWheelEventHandlers({
    containerRef,
    panZoom
  });

  // Touch event handlers for pinch/pan - always works regardless of read-only status
  useTouchEventHandlers({
    containerRef,
    panZoom,
    logEventHandling,
    supportsPointerEvents,
    palmRejectionEnabled: palmRejectionConfig.enabled
  });

  // Pointer event handlers - tool-aware implementation
  usePointerEventHandlers({
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
  });
};
