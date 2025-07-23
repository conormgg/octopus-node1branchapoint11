import React, { useState, useRef, useCallback, useEffect } from 'react';
import Konva from 'konva';
import { Stage, Layer } from 'react-konva';
import { LineObject, ImageObject, WhiteboardOptions, Point, SelectionBounds, SelectedObject } from '@/types/whiteboard';
import { usePanZoom } from '@/hooks/usePanZoom';
import { useDrawingState } from '@/hooks/useDrawingState';
import { useEraserState } from '@/hooks/useEraserState';
import { useStageEventHandlers } from '@/hooks/useStageEventHandlers';
import { useHistoryState } from '@/hooks/useHistoryState';
import { useWhiteboardPersistence } from '@/hooks/useWhiteboardPersistence';
import { useRemoteOperationHandler } from '@/hooks/useRemoteOperationHandler';
import { useSyncWhiteboardState } from '@/hooks/useSharedWhiteboardState';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePalmRejection } from '@/hooks/usePalmRejection';
import { useGroupTransform } from '@/hooks/useGroupTransform';
import { useWindowManager } from '@/components/WindowManager';
import { useKonvaKeyboardHandlers } from '@/hooks/canvas/useKonvaKeyboardHandlers';

import { LinesList } from './layers/LinesList';
import { ImagesList } from './layers/ImagesList';
import { DrawingLayer } from './layers/DrawingLayer';
import { SelectionRect } from './SelectionRect';
import { SelectionGroup } from './SelectionGroup';
import { SelectRenderer } from './SelectRenderer';
import { useSelectEventHandlers } from '@/hooks/useSelectEventHandlers';

interface KonvaStageProps {
  lines: LineObject[];
  images: ImageObject[];
  options?: WhiteboardOptions;
  onLineAdd: (line: LineObject) => void;
  onLineUpdate: (lineId: string, updates: Partial<LineObject>) => void;
  onLineDelete: (lineId: string) => void;
  onImageAdd: (image: ImageObject) => void;
  onImageUpdate: (imageId: string, updates: Partial<ImageObject>) => void;
  onImageDelete: (imageId: string) => void;
  onDeleteObjects: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  onClear: () => void;
  isReadOnly?: boolean;
  syncConfig?: any;
  containerRef: React.RefObject<HTMLDivElement>;
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

const KonvaStage: React.FC<KonvaStageProps> = ({
  lines,
  images,
  options,
  onLineAdd,
  onLineUpdate,
  onLineDelete,
  onImageAdd,
  onImageUpdate,
  onImageDelete,
  onDeleteObjects,
  onClear,
  isReadOnly = false,
  syncConfig,
  containerRef,
  mainSelection
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [currentTool, setCurrentTool] = useState<string>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<SelectedObject[]>([]);
  const [selectionBounds, setSelectionBounds] = useState<SelectionBounds | null>(null);

  // Sync state setup (if syncConfig is provided)
  const {
    remoteLines,
    remoteImages,
    addRemoteLine,
    updateRemoteLine,
    deleteRemoteLine,
    addRemoteImage,
    updateRemoteImage,
    deleteRemoteImage,
    clearRemoteBoard
  } = useSyncWhiteboardState({
    syncConfig,
    onLineAdd,
    onLineUpdate,
    onLineDelete,
    onImageAdd,
    onImageUpdate,
    onImageDelete,
    onClear
  });

  // Use either local or remote state based on syncConfig
  const effectiveLines = syncConfig ? remoteLines : lines;
  const effectiveImages = syncConfig ? remoteImages : images;

  // Pan and zoom functionality
  const { panZoomState, panZoom, resetPanZoom } = usePanZoom({
    initialScale: options?.initialScale,
    initialPosition: options?.initialPosition
  });

  // Drawing state and handlers
  const {
    drawingState,
    startDrawing,
    updateDrawing,
    endDrawing,
    clearDrawing
  } = useDrawingState({
    onLineAdd: syncConfig ? addRemoteLine : onLineAdd,
    isReadOnly
  });

  // Eraser state and handlers
  const {
    eraserState,
    startErasing,
    updateErasing,
    endErasing
  } = useEraserState({
    lines: effectiveLines,
    onLineDelete: syncConfig ? deleteRemoteLine : onLineDelete,
    isReadOnly
  });

  // History state (undo/redo)
  const { history, recordOperation, undo, redo, resetHistory } = useHistoryState();

  // Whiteboard persistence (save/load)
  const { saveWhiteboard, loadWhiteboard } = useWhiteboardPersistence({
    lines: effectiveLines,
    images: effectiveImages,
    onClear,
    onLoad: (loadedLines: LineObject[], loadedImages: ImageObject[]) => {
      // Handle loading lines and images
    }
  });

  // Remote operation handling
  useRemoteOperationHandler({
    addLine: syncConfig ? addRemoteLine : onLineAdd,
    updateLine: syncConfig ? updateRemoteLine : onLineUpdate,
    deleteLine: syncConfig ? deleteRemoteLine : onLineDelete,
    addImage: syncConfig ? addRemoteImage : onImageAdd,
    updateImage: syncConfig ? updateRemoteImage : onImageUpdate,
    deleteImage: syncConfig ? deleteRemoteImage : onImageDelete,
    clearBoard: syncConfig ? clearRemoteBoard : onClear
  });

  // Mobile detection hook
  const isMobile = useIsMobile();

  // Palm rejection hook
  const { isPalmTouching, handleTouchStart, handleTouchMove, handleTouchEnd } = usePalmRejection();

  // Group transformation hook
  const { transformGroup } = useGroupTransform({
    selectedObjects,
    lines: effectiveLines,
    images: effectiveImages,
    onLineUpdate: syncConfig ? updateRemoteLine : onLineUpdate,
    onImageUpdate: syncConfig ? updateRemoteImage : onImageUpdate,
    recordOperation
  });

  // Window management hook
  const { openWindow } = useWindowManager();

  // Keyboard handlers
  useKonvaKeyboardHandlers({
    stageRef,
    lines: effectiveLines,
    images: effectiveImages,
    panZoomState,
    panZoom,
    onUpdateLine: syncConfig ? updateRemoteLine : onLineUpdate,
    onUpdateImage: syncConfig ? updateRemoteImage : onImageUpdate,
    onDeleteObjects,
    containerRef,
    mainSelection: {
      selectObjects: setSelectedObjects,
      clearSelection: () => {
        setSelectedObjects([]);
        setSelectionBounds(null);
      },
      setSelectionBounds,
      setIsSelecting,
      selectionState: {
        selectedObjects,
        isSelecting,
        selectionBounds
      }
    }
  });

  // Select tool handlers
  const selectHandlers = useSelectEventHandlers({
    stageRef,
    lines: effectiveLines,
    images: effectiveImages,
    panZoomState,
    panZoom,
    onUpdateLine: syncConfig ? updateRemoteLine : onLineUpdate,
    onUpdateImage: syncConfig ? updateRemoteImage : onImageUpdate,
    onDeleteObjects,
    containerRef,
    mainSelection: {
      selectObjects: setSelectedObjects,
      clearSelection: () => {
        setSelectedObjects([]);
        setSelectionBounds(null);
      },
      setSelectionBounds,
      setIsSelecting,
      selectionState: {
        selectedObjects,
        isSelecting,
        selectionBounds
      }
    }
  });

  // Event handlers for the stage
  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleStageClick,
    clearSelection,
    deleteSelectedObjects
  } = useStageEventHandlers({
    stageRef,
    lines: effectiveLines,
    images: effectiveImages,
    panZoomState,
    panZoom,
    onUpdateLine: syncConfig ? updateRemoteLine : onLineUpdate,
    onUpdateImage: syncConfig ? updateRemoteImage : onImageUpdate,
    onDeleteObjects,
    containerRef,
    mainSelection: {
      selectObjects: setSelectedObjects,
      clearSelection: () => {
        setSelectedObjects([]);
        setSelectionBounds(null);
      },
      setSelectionBounds,
      setIsSelecting,
      selectionState: {
        selectedObjects,
        isSelecting,
        selectionBounds
      }
    }
  });

  const handleToolChange = useCallback((tool: string) => {
    setCurrentTool(tool);
    setIsDrawing(tool === 'pencil' || tool === 'highlighter');
    setIsErasing(tool === 'eraser');
    setIsSelecting(tool === 'select');
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (stageRef.current) {
      panZoom.handleWheel(e, stageRef.current);
    }
  }, [panZoom]);

  const renderLines = () => {
    return (
      <LinesList
        lines={effectiveLines}
        stageRef={stageRef}
        panZoomState={panZoomState}
        panZoom={panZoom}
        onLineUpdate={syncConfig ? updateRemoteLine : onLineUpdate}
        onDeleteObjects={onDeleteObjects}
        containerRef={containerRef}
        mainSelection={{
          selectObjects: setSelectedObjects,
          clearSelection: () => {
            setSelectedObjects([]);
            setSelectionBounds(null);
          },
          setSelectionBounds,
          setIsSelecting,
          selectionState: {
            selectedObjects,
            isSelecting,
            selectionBounds
          }
        }}
      />
    );
  };

  const renderImages = () => {
    return (
      <ImagesList
        images={effectiveImages}
        stageRef={stageRef}
        panZoomState={panZoomState}
        panZoom={panZoom}
        onImageUpdate={syncConfig ? updateRemoteImage : onImageUpdate}
        onDeleteObjects={onDeleteObjects}
        containerRef={containerRef}
        mainSelection={{
          selectObjects: setSelectedObjects,
          clearSelection: () => {
            setSelectedObjects([]);
            setSelectionBounds(null);
          },
          setSelectionBounds,
          setIsSelecting,
          selectionState: {
            selectedObjects,
            isSelecting,
            selectionBounds
          }
        }}
      />
    );
  };

  const renderDrawingLayer = () => {
    if (!isDrawing) return null;

    return (
      <DrawingLayer
        drawingState={drawingState}
        onDrawingUpdate={updateDrawing}
        onDrawingEnd={endDrawing}
        panZoomState={panZoomState}
        isReadOnly={isReadOnly}
      />
    );
  };

  const renderSelectVisuals = () => {
    if (currentTool !== 'select') return null;

    return (
      <SelectRenderer
        selectedObjects={selectHandlers.selectState.selectedObjects}
        hoveredObjectId={selectHandlers.selectState.hoveredObjectId}
        selectionBounds={selectHandlers.selectState.selectionBounds}
        isSelecting={selectHandlers.selectState.isSelecting}
        lines={effectiveLines}
        images={effectiveImages}
        groupBounds={selectHandlers.selectState.groupBounds}
        dragOffset={selectHandlers.selectState.dragOffset}
        isDraggingObjects={selectHandlers.selectState.isDraggingObjects}
      />
    );
  };

  return (
    <Stage
      width={options?.width || 800}
      height={options?.height || 600}
      style={{
        backgroundColor: options?.backgroundColor || '#fff',
        touchAction: 'none',
        cursor: isDrawing ? 'crosshair' : isErasing ? 'grab' : isSelecting ? 'pointer' : 'default'
      }}
      ref={stageRef}
      scaleX={panZoomState.scale}
      scaleY={panZoomState.scale}
      x={panZoomState.x}
      y={panZoomState.y}
      currentTool={currentTool}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleStageClick}
    >
      <Layer>
        {renderLines()}
        {renderImages()}
        {renderDrawingLayer()}
        {renderSelectVisuals()}
      </Layer>
    </Stage>
  );
};

export default KonvaStage;
