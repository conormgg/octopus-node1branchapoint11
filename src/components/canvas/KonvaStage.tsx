
import React, { useRef, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { Stage, Layer } from 'react-konva';
import { useSharedWhiteboardState } from '@/hooks/useSharedWhiteboardState';
import { useCanvasEventHandlers } from '@/hooks/canvas/useCanvasEventHandlers';
import { useSelectEventHandlers } from '@/hooks/useSelectEventHandlers';
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
    onUpdateLine: whiteboardState.operations?.updateLine,
    onUpdateImage: whiteboardState.operations?.updateImage,
    onDeleteObjects: whiteboardState.operations?.deleteSelectedObjects,
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

  // Keyboard event handling
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isReadOnly) return;

      // Delete selected objects
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (currentTool === 'select' && selection?.selectionState?.selectedObjects?.length > 0) {
          e.preventDefault();
          selectHandlers.deleteSelectedObjects();
        }
      }

      // Select all
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        if (currentTool === 'select') {
          e.preventDefault();
          if (selection?.selectAll) {
            selection.selectAll(state.lines, state.images);
          }
        }
      }

      // Clear selection
      if (e.key === 'Escape') {
        if (currentTool === 'select') {
          e.preventDefault();
          selectHandlers.clearSelection();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isReadOnly, currentTool, selection, selectHandlers, state.lines, state.images, containerRef]);

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
