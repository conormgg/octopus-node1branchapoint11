import { useCallback, useRef } from 'react';
import Konva from 'konva';
import { LineObject, ImageObject } from '@/types/whiteboard';
import { usePanZoom } from './usePanZoom';
import { useDrawingState } from './useDrawingState';
import { useEraser } from './useEraser';
import { useHistory } from './useHistory';
import { useSelectionState } from './useSelectionState';
import { PanZoomState } from '@/types/whiteboard';
import { useSelectEventHandlers } from './useSelectEventHandlers';
import { useTouchToSelectionBridge } from './eventHandling/useTouchToSelectionBridge';
import { useTouchEventHandlers } from './eventHandling/useTouchEventHandlers';
import { useEventDeduplication } from './eventHandling/useEventDeduplication';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

interface UseStageEventHandlersProps {
  stageRef: React.RefObject<Konva.Stage>;
  lines: LineObject[];
  images: ImageObject[];
  panZoomState: PanZoomState;
  onUpdateLine: (lineId: string, updates: any) => void;
  onUpdateImage: (imageId: string, updates: any) => void;
  onDeleteObjects: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  currentTool: string;
  isReadOnly: boolean;
  selectObjects: (objects: Array<{id: string, type: 'line' | 'image'}>) => void;
  clearSelection: () => void;
  setSelectionBounds: (bounds: any) => void;
  setIsSelecting: (selecting: boolean) => void;
  selectedObjects: Array<{id: string, type: 'line' | 'image'}>;
  isSelecting: boolean;
  selectionBounds: any;
  panZoom: any; // panZoom object with isGestureActive method
}

export const useStageEventHandlers = ({
  stageRef,
  lines,
  images,
  panZoomState,
  onUpdateLine,
  onUpdateImage,
  onDeleteObjects,
  containerRef,
  currentTool,
  isReadOnly,
  selectObjects,
  clearSelection,
  setSelectionBounds,
  setIsSelecting,
  selectedObjects,
  isSelecting,
  selectionBounds,
  panZoom
}: UseStageEventHandlersProps) => {
  const { addLine } = useDrawingState();
  const { handlePointerDown: handleEraserPointerDown, handlePointerMove: handleEraserPointerMove } = useEraser({ lines, onUpdateLine, onDeleteObjects });
  const { recordOperation } = useHistory();

  // Select tool handlers
  const selectHandlers = useSelectEventHandlers({
    stageRef,
    lines,
    images,
    panZoomState,
    panZoom,
    onUpdateLine,
    onUpdateImage,
    onDeleteObjects,
    containerRef,
    mainSelection: {
      selectObjects,
      clearSelection,
      setSelectionBounds,
      setIsSelecting,
      selectionState: {
        selectedObjects,
        isSelecting,
        selectionBounds
      }
    }
  });

  // Deduplication hook
  const { deduplicateEvent } = useEventDeduplication();

  // Touch event handlers
  const { handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel } = useTouchEventHandlers({
    panZoomState,
    stageRef,
    currentTool,
    isReadOnly,
    selectHandlers,
    panZoom
  });

  // Touch-to-selection bridge for select tool
  const touchToSelectionBridge = useTouchToSelectionBridge({
    panZoomState,
    handlePointerDown: selectHandlers.handlePointerDown,
    handlePointerMove: selectHandlers.handlePointerMove,
    handlePointerUp: selectHandlers.handlePointerUp,
    currentTool,
    isReadOnly,
    stageRef
  });

  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (isReadOnly) return;

    // Deduplicate event
    if (deduplicateEvent(e.evt)) {
      debugLog('Events', 'handlePointerDown: Duplicate event, ignoring', { event: e.evt });
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;

    // Route event based on current tool
    switch (currentTool) {
      case 'pencil':
      case 'highlighter':
        // Start drawing
        const newLine = addLine({ stage, event: e.evt, panZoomState });
        if (newLine) {
          recordOperation({
            type: 'add',
            objectId: newLine.id,
            objectType: 'line',
            object: newLine
          });
        }
        break;
      case 'eraser':
        handleEraserPointerDown(e);
        break;
      case 'select':
        selectHandlers?.handlePointerDown(e.evt.clientX, e.evt.clientY, e.evt.ctrlKey);
        break;
      default:
        console.warn(`Unknown tool: ${currentTool}`);
    }
  }, [addLine, currentTool, handleEraserPointerDown, isReadOnly, panZoomState, recordOperation, stageRef, deduplicateEvent, selectHandlers]);

  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (isReadOnly) return;

    // Deduplicate event
    if (deduplicateEvent(e.evt)) {
      debugLog('Events', 'handlePointerMove: Duplicate event, ignoring', { event: e.evt });
      return;
    }

    switch (currentTool) {
      case 'pencil':
      case 'highlighter':
        // Continue drawing
        break;
      case 'eraser':
        handleEraserPointerMove(e);
        break;
      case 'select':
        selectHandlers?.handlePointerMove(e.evt.clientX, e.evt.clientY);
        break;
      default:
        console.warn(`Unknown tool: ${currentTool}`);
    }
  }, [currentTool, handleEraserPointerMove, isReadOnly, addLine, deduplicateEvent, selectHandlers]);

  const handlePointerUp = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (isReadOnly) return;

    // Deduplicate event
    if (deduplicateEvent(e.evt)) {
      debugLog('Events', 'handlePointerUp: Duplicate event, ignoring', { event: e.evt });
      return;
    }

    switch (currentTool) {
      case 'pencil':
      case 'highlighter':
        // End drawing - handled by drawing state
        break;
      case 'eraser':
        // End erasing - handled by eraser state
        break;
      case 'select':
        selectHandlers?.handlePointerUp();
        break;
      default:
        console.warn(`Unknown tool: ${currentTool}`);
    }
  }, [currentTool, isReadOnly, deduplicateEvent, selectHandlers]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    if (panZoom.isGestureActive()) return;
    panZoom.handleWheel(e);
  }, [panZoom]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    handleWheel
  };
};
