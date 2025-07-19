
import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { usePalmRejection } from './usePalmRejection';
import { useStageCoordinates } from './useStageCoordinates';
import { PanZoomState } from '@/types/whiteboard';
import { useEventDebug } from './eventHandling/useEventDebug';
import { useWheelEventHandlers } from './eventHandling/useWheelEventHandlers';
import { useTouchEventHandlers } from './eventHandling/useTouchEventHandlers';
import { usePointerEventHandlers } from './eventHandling/usePointerEventHandlers';
import { usePointerEventDetection } from './eventHandling/usePointerEventDetection';
import { useSelect2EventHandlers } from './useSelect2EventHandlers';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('touchEvents');

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
  currentTool: string;
  lines?: any[];
  images?: any[];
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
  isReadOnly,
  currentTool,
  lines = [],
  images = []
}: UseStageEventHandlersProps) => {
  const currentToolRef = useRef<string>(currentTool || 'pencil');
  const { logEventHandling } = useEventDebug(palmRejectionConfig);
  const { supportsPointerEvents } = usePointerEventDetection();

  // Create a synchronized panZoomState that updates when stage transforms change
  const [syncedPanZoomState, setSyncedPanZoomState] = useRef(panZoomState);
  
  // Sync panZoomState with actual stage transformation
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const syncTransformation = () => {
      const actualTransform = {
        x: stage.x(),
        y: stage.y(),
        scale: stage.scaleX() // Assuming uniform scaling
      };

      // Only update if there's a significant difference
      const threshold = 0.001;
      if (Math.abs(actualTransform.x - syncedPanZoomState.current.x) > threshold ||
          Math.abs(actualTransform.y - syncedPanZoomState.current.y) > threshold ||
          Math.abs(actualTransform.scale - syncedPanZoomState.current.scale) > threshold) {
        
        debugLog('StageEventHandlers', 'Syncing panZoomState with stage', {
          previous: syncedPanZoomState.current,
          actual: actualTransform,
          provided: panZoomState
        });
        
        setSyncedPanZoomState.current = actualTransform;
      }
    };

    // Sync on every animation frame during transformations
    const syncInterval = setInterval(syncTransformation, 16); // ~60fps

    // Also sync on specific events
    stage.on('dragend', syncTransformation);
    stage.on('transformend', syncTransformation);

    return () => {
      clearInterval(syncInterval);
      stage.off('dragend', syncTransformation);
      stage.off('transformend', syncTransformation);
    };
  }, [stageRef, panZoomState]);

  // Update syncedPanZoomState when panZoomState prop changes
  useEffect(() => {
    setSyncedPanZoomState.current = panZoomState;
  }, [panZoomState]);

  // Select2 event handlers with synced pan/zoom state
  const select2Handlers = useSelect2EventHandlers({
    lines,
    images,
    panZoomState: syncedPanZoomState.current,
    stageRef
  });

  // Update current tool ref when currentTool prop changes
  useEffect(() => {
    if (currentTool && currentTool !== currentToolRef.current) {
      debugLog('StageEventHandlers', 'Tool changed via prop', {
        previousTool: currentToolRef.current,
        newTool: currentTool
      });
      
      currentToolRef.current = currentTool;
      
      // Update touch-action when tool changes
      const container = containerRef.current;
      if (container) {
        // For select tool, allow native touch behavior; for others, prevent it
        container.style.touchAction = currentTool === 'select' ? 'manipulation' : 'none';
        debugLog('StageEventHandlers', 'Updated touch-action via prop', {
          tool: currentTool,
          touchAction: container.style.touchAction
        });
      }
    }
  }, [currentTool, containerRef]);

  // Log current tool state periodically for debugging
  useEffect(() => {
    const logToolState = () => {
      const stage = stageRef.current;
      const stageAttr = stage?.getAttr('currentTool');
      debugLog('StageEventHandlers', 'Tool state check', {
        refTool: currentToolRef.current,
        stageAttr,
        refUndefined: currentToolRef.current === undefined,
        stageUndefined: stageAttr === undefined,
        match: currentToolRef.current === stageAttr
      });
    };
    
    const interval = setInterval(logToolState, 2000);
    return () => clearInterval(interval);
  }, [stageRef]);

  // Wheel event handlers - always active for pan/zoom
  useWheelEventHandlers({
    containerRef,
    panZoom
  });

  // Touch events for multi-touch gestures - ALWAYS enabled now
  useTouchEventHandlers({
    containerRef,
    panZoom,
    logEventHandling,
    supportsPointerEvents,
    palmRejectionEnabled: palmRejectionConfig.enabled,
    currentTool: currentToolRef.current
  });

  // Pointer event handlers - handles single-touch interactions
  usePointerEventHandlers({
    containerRef,
    stageRef,
    panZoomState,
    palmRejection,
    palmRejectionConfig,
    panZoom,
    handlePointerDown: currentTool === 'select2' ? 
      (x: number, y: number, e?: PointerEvent) => {
        // For select2, pass raw client coordinates with event context
        if (e) {
          select2Handlers.handlePointerDown(e.clientX, e.clientY, e.ctrlKey);
        } else {
          // Fallback - convert world coordinates back to client coordinates (not ideal)
          const stage = stageRef.current;
          if (stage) {
            const container = stage.container();
            const rect = container.getBoundingClientRect();
            const clientX = x * panZoomState.scale + panZoomState.x + rect.left;
            const clientY = y * panZoomState.scale + panZoomState.y + rect.top;
            select2Handlers.handlePointerDown(clientX, clientY);
          }
        }
      } : handlePointerDown,
    handlePointerMove: currentTool === 'select2' ? 
      (x: number, y: number, e?: PointerEvent) => {
        // For select2, pass raw client coordinates with event context
        if (e) {
          select2Handlers.handlePointerMove(e.clientX, e.clientY);
        } else {
          // Fallback - convert world coordinates back to client coordinates (not ideal)
          const stage = stageRef.current;
          if (stage) {
            const container = stage.container();
            const rect = container.getBoundingClientRect();
            const clientX = x * panZoomState.scale + panZoomState.x + rect.left;
            const clientY = y * panZoomState.scale + panZoomState.y + rect.top;
            select2Handlers.handlePointerMove(clientX, clientY);
          }
        }
      } : handlePointerMove,
    handlePointerUp: currentTool === 'select2' ? 
      select2Handlers.handlePointerUp : handlePointerUp,
    isReadOnly,
    currentToolRef,
    logEventHandling,
    supportsPointerEvents
  });

  // Return select2 state for rendering when using select2 tool
  if (currentTool === 'select2') {
    return {
      select2State: select2Handlers.select2State,
      clearSelect2Selection: select2Handlers.clearSelection
    };
  }

  return {};
};
