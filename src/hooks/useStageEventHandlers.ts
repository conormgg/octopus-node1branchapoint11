
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
  onUpdateLine?: (lineId: string, updates: any) => void;
  onUpdateImage?: (imageId: string, updates: any) => void;
  onDeleteObjects?: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  onDeleteObjectsNoParams?: () => void;
  // Add selection parameter for select2 integration
  selection?: any;
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
  images = [],
  onUpdateLine,
  onUpdateImage,
  onDeleteObjects,
  onDeleteObjectsNoParams,
  selection
}: UseStageEventHandlersProps) => {
  const currentToolRef = useRef<string>(currentTool || 'pencil');
  const { logEventHandling } = useEventDebug(palmRejectionConfig);
  const { supportsPointerEvents } = usePointerEventDetection();

  debugLog('StageEventHandlers', 'Initializing with delete functions', {
    currentTool,
    hasDeleteFunction: !!onDeleteObjects,
    hasDeleteNoParams: !!onDeleteObjectsNoParams,
    deleteFunction: onDeleteObjects ? 'provided' : 'none',
    deleteNoParamsFunction: onDeleteObjectsNoParams ? 'provided' : 'none'
  });

  // Select2 event handlers with main selection integration
  const select2Handlers = currentTool === 'select2' && selection ? useSelect2EventHandlers({
    stageRef,
    lines,
    images,
    panZoomState,
    onUpdateLine,
    onUpdateImage,
    onDeleteObjects,
    containerRef,
    selection
  }) : null;

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
        // For select tools, allow native touch behavior; for others, prevent it
        container.style.touchAction = (currentTool === 'select' || currentTool === 'select2') ? 'manipulation' : 'none';
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
    handlePointerDown: currentTool === 'select2' && select2Handlers ? 
      (worldX: number, worldY: number) => {
        select2Handlers.handlePointerDown(worldX, worldY);
      } : handlePointerDown,
    handlePointerMove: currentTool === 'select2' && select2Handlers ? 
      (worldX: number, worldY: number) => {
        select2Handlers.handlePointerMove(worldX, worldY);
      } : handlePointerMove,
    handlePointerUp: currentTool === 'select2' && select2Handlers ? 
      select2Handlers.handlePointerUp : handlePointerUp,
    isReadOnly,
    currentToolRef,
    logEventHandling,
    supportsPointerEvents
  });

  // Return handlers for select2 when active
  if (currentTool === 'select2' && select2Handlers) {
    return {
      select2State: select2Handlers.select2State,
      clearSelect2Selection: select2Handlers.clearSelection,
      deleteSelectedObjects: select2Handlers.deleteSelectedObjects,
      select2MouseHandlers: {
        onMouseDown: select2Handlers.handleMouseDown,
        onMouseMove: select2Handlers.handleMouseMove,
        onMouseUp: select2Handlers.handleMouseUp
      }
    };
  }

  return {};
};
