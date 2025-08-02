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
  onDeleteObjects?: (selectedObjects?: Array<{id: string, type: 'line' | 'image'}>) => void;
  // Main selection state for select2 integration
  mainSelection?: {
    selectObjects: (objects: Array<{id: string, type: 'line' | 'image'}>) => void;
    clearSelection: () => void;
    setSelectionBounds: (bounds: any) => void;
    setIsSelecting: (selecting: boolean) => void;
    selectionState: {
      selectedObjects: Array<{id: string, type: 'line' | 'image'}>;
      isSelecting: boolean;
      selectionBounds: any;
    };
  };
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
  mainSelection
}: UseStageEventHandlersProps) => {
  const currentToolRef = useRef<string>(currentTool || 'pencil');
  const { logEventHandling } = useEventDebug(palmRejectionConfig);
  const { supportsPointerEvents } = usePointerEventDetection();
  
  // Track pan state locally for Select2 tool
  const isPanningRef = useRef(false);

  debugLog('StageEventHandlers', 'Initializing with unified delete function', {
    currentTool,
    hasDeleteFunction: !!onDeleteObjects,
    hasMainSelection: !!mainSelection
  });

  // Select2 event handlers with update functions, delete function, and main selection integration
  const select2Handlers = useSelect2EventHandlers({
    stageRef,
    lines,
    images,
    panZoomState,
    panZoom,
    onUpdateLine,
    onUpdateImage,
    onDeleteObjects,
    containerRef,
    mainSelection // Pass main selection state for integration
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

  // Pointer event handlers - handles single-touch interactions with proper coordinate transformation
  usePointerEventHandlers({
    containerRef,
    stageRef,
    panZoomState,
    palmRejection,
    palmRejectionConfig,
    panZoom,
    handlePointerDown: currentTool === 'select2' ? 
      (worldX: number, worldY: number, ctrlKey?: boolean, button?: number, clientX?: number, clientY?: number) => {
        // For right-click (button 2), bypass Select2 and use pan/zoom directly with screen coordinates
        if (button === 2 && clientX !== undefined && clientY !== undefined) {
          isPanningRef.current = true;
          panZoom.startPan(clientX, clientY);
          return;
        }
        // For left-click and other buttons, use Select2
        select2Handlers.handlePointerDown(worldX, worldY, ctrlKey || false, button || 0);
      } : handlePointerDown,
    handlePointerMove: currentTool === 'select2' ? 
      (worldX: number, worldY: number, clientX?: number, clientY?: number) => {
        // Check if we're currently panning (right-click drag)
        if (isPanningRef.current && clientX !== undefined && clientY !== undefined) {
          panZoom.continuePan(clientX, clientY);
          return;
        }
        // Otherwise use Select2
        select2Handlers.handlePointerMove(worldX, worldY);
      } : handlePointerMove,
    handlePointerUp: currentTool === 'select2' ? 
      () => {
        // Check if we were panning and stop it
        if (isPanningRef.current) {
          isPanningRef.current = false;
          panZoom.stopPan();
          return;
        }
        // Otherwise use Select2
        select2Handlers.handlePointerUp();
      } : handlePointerUp,
    isReadOnly,
    currentToolRef,
    logEventHandling,
    supportsPointerEvents
  });

  // Return select2 state for rendering when using select2 tool
  if (currentTool === 'select2') {
    return {
      select2State: select2Handlers.select2State,
      clearSelect2Selection: select2Handlers.clearSelection,
      deleteSelectedObjects: select2Handlers.deleteSelectedObjects,
      handleTransformHandleMouseDown: select2Handlers.handleTransformHandleMouseDown,
      handleTransformMouseMove: select2Handlers.handleTransformMouseMove,
      handleTransformMouseUp: select2Handlers.handleTransformMouseUp,
      select2MouseHandlers: {
        onMouseDown: select2Handlers.handleMouseDown,
        onMouseMove: select2Handlers.handleMouseMove,
        onMouseUp: select2Handlers.handleMouseUp,
        deleteSelectedObjects: select2Handlers.deleteSelectedObjects,
        showContextMenu: select2Handlers.showContextMenu,
        hideContextMenu: select2Handlers.hideContextMenu
      }
    };
  }

  return {};
};
