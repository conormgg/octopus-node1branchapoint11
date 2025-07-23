
import React, { useRef, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { Stage, Layer } from 'react-konva';
import { useSharedWhiteboardState } from '@/hooks/useSharedWhiteboardState';
import { useCanvasEventHandlers } from '@/hooks/canvas/useCanvasEventHandlers';
import { useSelectEventHandlers } from '@/hooks/useSelectEventHandlers';
import { useCanvasKeyboardShortcuts } from '@/hooks/canvas/useCanvasKeyboardShortcuts';
import LinesList from './layers/LinesList';
import { SelectRenderer } from './SelectRenderer';

interface KonvaStageProps {
  width: number;
  height: number;
  whiteboardState: ReturnType<typeof useSharedWhiteboardState>;
  isReadOnly?: boolean;
  palmRejectionConfig?: any;
  normalizedState?: any;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const KonvaStage: React.FC<KonvaStageProps> = ({
  width,
  height,
  whiteboardState,
  isReadOnly = false,
  palmRejectionConfig,
  normalizedState,
  containerRef
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  
  const { state, selection } = whiteboardState;
  const currentTool = state.currentTool;
  const isDrawing = state.isDrawing;

  // Selection event handlers
  const selectHandlers = useSelectEventHandlers({
    stageRef,
    lines: state.lines,
    images: state.images,
    panZoomState: state.panZoomState,
    panZoom: whiteboardState.panZoom,
    onUpdateLine: whiteboardState.updateLine,
    onUpdateImage: whiteboardState.updateImage,
    onDeleteObjects: whiteboardState.deleteSelectedObjects,
    containerRef,
    mainSelection: selection
  });

  // Canvas event handlers for coordinating all input
  const canvasHandlers = useCanvasEventHandlers({
    stageRef,
    panZoomState: state.panZoomState,
    panZoom: whiteboardState.panZoom,
    currentTool,
    handlePointerDown: currentTool === 'select' ? selectHandlers.handlePointerDown : whiteboardState.handlePointerDown,
    handlePointerMove: currentTool === 'select' ? selectHandlers.handlePointerMove : whiteboardState.handlePointerMove,
    handlePointerUp: currentTool === 'select' ? selectHandlers.handlePointerUp : whiteboardState.handlePointerUp,
    isReadOnly
  });

  // Keyboard shortcuts for selection operations
  useCanvasKeyboardShortcuts({
    containerRef,
    currentTool,
    isReadOnly,
    selection,
    selectHandlers,
    lines: state.lines,
    images: state.images
  });

  // Reset handlers when tool changes
  useEffect(() => {
    canvasHandlers.resetHandlers();
  }, [currentTool, canvasHandlers]);

  const renderLines = () => {
    return (
      <LinesList
        lines={normalizedState?.linesArray || state.lines}
      />
    );
  };

  const renderSelectVisuals = () => {
    if (currentTool !== 'select') return null;

    return (
      <SelectRenderer
        selectedObjects={selection?.selectionState?.selectedObjects || []}
        hoveredObjectId={selectHandlers.selectState?.hoveredObjectId || null}
        selectionBounds={selection?.selectionState?.selectionBounds || null}
        isSelecting={selection?.selectionState?.isSelecting || false}
        lines={state.lines}
        images={state.images}
        groupBounds={selectHandlers.selectState?.groupBounds || null}
        dragOffset={selectHandlers.selectState?.dragOffset || null}
        isDraggingObjects={selectHandlers.selectState?.isDraggingObjects || false}
      />
    );
  };

  return (
    <Stage
      width={width}
      height={height}
      style={{
        backgroundColor: '#fff',
        touchAction: 'none',
        cursor: isDrawing ? 'crosshair' : currentTool === 'eraser' ? 'grab' : currentTool === 'select' ? 'pointer' : 'default'
      }}
      ref={stageRef}
      scaleX={state.panZoomState.scale}
      scaleY={state.panZoomState.scale}
      x={state.panZoomState.x}
      y={state.panZoomState.y}
      onPointerDown={canvasHandlers.onPointerDown}
      onPointerMove={canvasHandlers.onPointerMove}
      onPointerUp={canvasHandlers.onPointerUp}
      onContextMenu={canvasHandlers.onContextMenu}
      onTouchStart={canvasHandlers.onTouchStart}
      onTouchMove={canvasHandlers.onTouchMove}
      onTouchEnd={canvasHandlers.onTouchEnd}
    >
      <Layer>
        {renderLines()}
        {renderSelectVisuals()}
      </Layer>
    </Stage>
  );
};

export default KonvaStage;
