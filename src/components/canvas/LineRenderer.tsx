import React from 'react';
import { Line } from 'react-konva';
import { LineObject } from '@/types/whiteboard';
import { useWhiteboardContext } from '@/contexts/WhiteboardContext';
import { useSelectionState } from '@/hooks/useSelectionState';
import { useSelectEventHandlers } from '@/hooks/useSelectEventHandlers';

interface LineRendererProps {
  line: LineObject;
  isSelected: boolean;
  stageRef: React.RefObject<any>;
  lines: LineObject[];
  images: any[];
  panZoomState: { x: number; y: number; scale: number };
  panZoom: any;
  onUpdateLine: (lineId: string, updates: any) => void;
  onUpdateImage: (imageId: string, updates: any) => void;
  onDeleteObjects: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const LineRenderer: React.FC<LineRendererProps> = ({
  line,
  isSelected,
  stageRef,
  lines,
  images,
  panZoomState,
  panZoom,
  onUpdateLine,
  onUpdateImage,
  onDeleteObjects,
  containerRef
}) => {
  const { selectObjects, clearSelection, setSelectionBounds, setIsSelecting, selectionState: { selectedObjects, isSelecting, selectionBounds } } = useSelectionState();
  const { currentTool } = useWhiteboardContext();

  // Select handlers for interaction
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

  return (
    <Line
      key={line.id}
      points={line.points}
      x={line.x}
      y={line.y}
      stroke={line.stroke}
      strokeWidth={line.strokeWidth}
      lineCap={line.lineCap}
      lineJoin={line.lineJoin}
      opacity={line.opacity}
      tension={line.tension}
      closed={line.closed}
      rotation={line.rotation}
      scaleX={line.scaleX}
      scaleY={line.scaleY}
      dash={line.dash}
      // Add selection styling
      strokeWidth={isSelected ? line.strokeWidth + 2 : line.strokeWidth}
      stroke={isSelected ? 'rgba(0, 123, 255, 0.8)' : line.stroke}
      // Disable listening for events when the select tool is active
      listening={currentTool !== 'select'}
    />
  );
};

export default LineRenderer;
