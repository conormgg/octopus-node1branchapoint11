import { useCallback, useEffect } from 'react';
import Konva from 'konva';
import { LineObject, ImageObject } from '@/types/whiteboard';
import { usePanZoom } from '../usePanZoom';
import { useStageCoordinates } from '../useStageCoordinates';
import { useDrawingState } from '../useDrawingState';
import { useHistoryState } from '../useHistoryState';
import { useWhiteboardPersistence } from '../useWhiteboardPersistence';
import { useSelectEventHandlers } from '../useSelectEventHandlers';

interface UseKonvaKeyboardHandlersProps {
  stageRef: React.RefObject<Konva.Stage>;
  lines: LineObject[];
  images: ImageObject[];
  onUpdateLine: (lineId: string, updates: any) => void;
  onUpdateImage: (imageId: string, updates: any) => void;
  onDeleteObjects: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  panZoomState: { x: number; y: number; scale: number };
  panZoom: any; // Replace 'any' with the actual type of your panZoom object
  drawingMode: string;
  setDrawingMode: (mode: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  selectObjects: (objects: Array<{id: string, type: 'line' | 'image'}>) => void;
  clearSelection: () => void;
  setSelectionBounds: (bounds: any) => void;
  setIsSelecting: (selecting: boolean) => void;
  selectedObjects: Array<{id: string, type: 'line' | 'image'}>;
  isSelecting: boolean;
  selectionBounds: any;
}

export const useKonvaKeyboardHandlers = ({
  stageRef,
  lines,
  images,
  onUpdateLine,
  onUpdateImage,
  onDeleteObjects,
  panZoomState,
  panZoom,
  drawingMode,
  setDrawingMode,
  containerRef,
  selectObjects,
  clearSelection,
  setSelectionBounds,
  setIsSelecting,
  selectedObjects,
  isSelecting,
  selectionBounds
}: UseKonvaKeyboardHandlersProps) => {
  const { resetPanZoom } = usePanZoom();
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);
  const { clearDrawing } = useDrawingState();
  const { undo, redo } = useHistoryState();
  const { saveWhiteboard } = useWhiteboardPersistence();

  // Select tool handlers for delete functionality
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (document.activeElement !== containerRef.current) return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      selectHandlers?.deleteSelectedObjects();
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
      e.preventDefault();
      redo();
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      saveWhiteboard();
    }

    if (e.key === 'Escape') {
      if (drawingMode !== 'select') {
        setDrawingMode('select');
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === '0') {
      e.preventDefault();
      resetPanZoom();
    }
  }, [
    containerRef,
    selectHandlers,
    undo,
    redo,
    saveWhiteboard,
    drawingMode,
    setDrawingMode,
    resetPanZoom
  ]);

  useEffect(() => {
    containerRef.current?.focus();
    containerRef.current?.addEventListener('keydown', handleKeyDown);
    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, containerRef]);

  return {};
};
