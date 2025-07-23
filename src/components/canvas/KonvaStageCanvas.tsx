import React, { useCallback, useEffect, useRef } from 'react';
import Konva from 'konva';
import { Stage } from 'react-konva';
import { LineObject, ImageObject } from '@/types/whiteboard';
import { usePanZoom } from '@/hooks/usePanZoom';
import { useDrawingState } from '@/hooks/useDrawingState';
import { useEraserState } from '@/hooks/useEraserState';
import { useStageEventHandlers } from '@/hooks/useStageEventHandlers';
import { usePalmRejection } from '@/hooks/usePalmRejection';
import { useHistoryState } from '@/hooks/useHistoryState';
import { useSelectionState } from '@/hooks/useSelectionState';
import { useGroupTransform } from '@/hooks/useGroupTransform';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKonvaKeyboardHandlers } from '@/hooks/canvas/useKonvaKeyboardHandlers';
import { SelectRenderer } from './SelectRenderer';
import { useSelectEventHandlers } from '@/hooks/useSelectEventHandlers';

interface KonvaStageCanvasProps {
  lines: LineObject[];
  images: ImageObject[];
  onAddLine: (line: Omit<LineObject, 'id'>) => string;
  onUpdateLine: (lineId: string, updates: Partial<LineObject>) => void;
  onRemoveLine: (lineId: string) => void;
  onAddImage: (image: Omit<ImageObject, 'id'>) => string;
  onUpdateImage: (imageId: string, updates: Partial<ImageObject>) => void;
  onRemoveImage: (imageId: string) => void;
  onDeleteObjects: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  stageWidth: number;
  stageHeight: number;
  currentTool: string;
  isReadOnly: boolean;
  setContainer: React.Dispatch<React.SetStateAction<HTMLDivElement | null>>;
}

const KonvaStageCanvas: React.FC<KonvaStageCanvasProps> = ({
  lines,
  images,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onAddImage,
  onUpdateImage,
  onRemoveImage,
  onDeleteObjects,
  stageWidth,
  stageHeight,
  currentTool,
  isReadOnly,
  setContainer
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // History state for undo/redo
  const { addHistoryEntry } = useHistoryState();

  // Main selection state
  const {
    selectionState: { selectedObjects, isSelecting, selectionBounds },
    selectObjects,
    clearSelection,
    setSelectionBounds,
    setIsSelecting
  } = useSelectionState();

  // Pan and zoom functionality
  const { panZoom, panZoomState } = usePanZoom({ stageRef });

  // Drawing tool functionality
  const {
    drawingState,
    startDrawing,
    updateDrawing,
    endDrawing,
    clearDrawing
  } = useDrawingState({
    onAddLine,
    currentTool,
    isReadOnly,
    addHistoryEntry
  });

  // Eraser tool functionality
  const {
    eraserState,
    startErasing,
    updateErasing,
    endErasing
  } = useEraserState({
    lines,
    onUpdateLine,
    currentTool,
    isReadOnly,
    addHistoryEntry
  });

  // Group transformation
  useGroupTransform({
    stageRef,
    selectedObjects,
    lines,
    images,
    onUpdateLine,
    onUpdateImage,
    panZoomState,
    addHistoryEntry
  });

  // Palm rejection for touch devices
  const { isPalmTouching } = usePalmRejection({ stageRef });

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

  // Keyboard event handlers (delete)
  useKonvaKeyboardHandlers({
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

  // Set container ref for focus management
  useEffect(() => {
    if (containerRef.current) {
      setContainer(containerRef.current);
    }
  }, [setContainer]);

  // Event handlers for the Konva stage
  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = useStageEventHandlers({
    stageRef,
    lines,
    images,
    panZoomState,
    panZoom,
    onUpdateLine,
    onUpdateImage,
    onDeleteObjects,
    currentTool,
    isReadOnly,
    isPalmTouching,
    drawingState,
    startDrawing,
    updateDrawing,
    endDrawing,
    eraserState,
    startErasing,
    updateErasing,
    endErasing,
    selectObjects,
    clearSelection,
    setSelectionBounds,
    setIsSelecting,
    containerRef
  });

  const renderSelectVisuals = () => {
    if (currentTool !== 'select') return null;

    return (
      <SelectRenderer
        selectedObjects={selectHandlers.selectState.selectedObjects}
        hoveredObjectId={selectHandlers.selectState.hoveredObjectId}
        selectionBounds={selectHandlers.selectState.selectionBounds}
        isSelecting={selectHandlers.selectState.isSelecting}
        lines={lines}
        images={images}
        groupBounds={selectHandlers.selectState.groupBounds}
        dragOffset={selectHandlers.selectState.dragOffset}
        isDraggingObjects={selectHandlers.selectState.isDraggingObjects}
      />
    );
  };

  return (
    <div
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
      ref={containerRef}
      tabIndex={0}
    >
      <Stage
        width={stageWidth}
        height={stageHeight}
        style={{
          backgroundColor: '#fff',
          cursor: drawingState.isDrawing ? 'crosshair' : 'default'
        }}
        ref={stageRef}
        {...panZoom.getEventHandlers()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        currentTool={currentTool}
      >
        {/* Render whiteboard content here (lines, images, etc.) */}
        {renderSelectVisuals()}
      </Stage>
    </div>
  );
};

export default KonvaStageCanvas;
