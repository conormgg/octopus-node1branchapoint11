import React, { useRef, useEffect } from 'react';
import { Line } from 'react-konva';
import { LineObject } from '@/types/whiteboard';
import { usePanZoom } from '@/hooks';
import { useDrawingState } from '@/hooks';
import { useEraser } from '@/hooks/useEraser';
import { useObjectZIndex } from '@/hooks/useObjectZIndex';
import { useSelectEventHandlers } from '@/hooks/useSelectEventHandlers';

interface LinesListProps {
  lines: LineObject[];
  onUpdateLine: (id: string, updates: any) => void;
  onDeleteObjects: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  selectedObjects: Array<{id: string, type: 'line' | 'image'}>;
  stageRef: React.RefObject<any>;
  containerRef: React.RefObject<HTMLDivElement>;
  currentTool: string;
  onLineDoubleClick: (line: LineObject) => void;
  isReadOnly: boolean;
  onLineUpdate: (lineId: string, updates: Partial<LineObject>) => void;
}

const LinesList: React.FC<LinesListProps> = ({
  lines,
  onUpdateLine,
  onDeleteObjects,
  selectedObjects,
  stageRef,
  containerRef,
  currentTool,
  onLineDoubleClick,
  isReadOnly,
  onLineUpdate
}) => {
  const { panZoomState } = usePanZoom();
  const { setDrawingMode } = useDrawingState();
  const { handlePointerMove: handleEraseMove } = useEraser();
  const { bringToFront, getZIndex } = useObjectZIndex();

  // Select handlers for interaction
  const selectHandlers = useSelectEventHandlers({
    stageRef,
    lines,
    images: [],
    panZoomState,
    panZoom: { isGestureActive: () => false }, // Dummy panZoom object
    onUpdateLine,
    onUpdateImage: () => {},
    onDeleteObjects,
    containerRef,
    mainSelection: {
      selectObjects: () => {},
      clearSelection: () => {},
      setSelectionBounds: () => {},
      setIsSelecting: () => {},
      selectionState: {
        selectedObjects: [],
        isSelecting: false,
        selectionBounds: null
      }
    }
  });

  // Handle line click
  const handleLineClick = (line: LineObject) => {
    if (currentTool === 'select' && !isReadOnly) {
      selectHandlers.handlePointerDown(line.x, line.y);
    }
  };

  return (
    <>
      {lines.map((line) => (
        <Line
          key={line.id}
          id={line.id}
          points={line.points}
          stroke={line.stroke}
          strokeWidth={line.strokeWidth}
          lineCap={line.lineCap}
          lineJoin={line.lineJoin}
          opacity={line.opacity}
          tension={line.tension}
          x={line.x}
          y={line.y}
          scaleX={line.scaleX}
          scaleY={line.scaleY}
          rotation={line.rotation}
          dash={line.dash}
          visible={line.visible}
          listening={currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser' || currentTool === 'select'}
          draggable={false}
          onClick={() => handleLineClick(line)}
          onTap={() => handleLineClick(line)}
          onMouseMove={(e) => {
            if (currentTool === 'eraser') {
              handleEraseMove(e);
            }
          }}
          onTransform={() => {
            if (currentTool === 'select' && !isReadOnly) {
              const node = e.target;
              const updates = {
                x: node.x(),
                y: node.y(),
                scaleX: node.scaleX(),
                scaleY: node.scaleY(),
                rotation: node.rotation(),
              };
              onLineUpdate(line.id, updates);
            }
          }}
          onDblClick={() => {
            if (currentTool === 'select' && !isReadOnly) {
              onLineDoubleClick(line);
            }
          }}
          onDblTap={() => {
            if (currentTool === 'select' && !isReadOnly) {
              onLineDoubleClick(line);
            }
          }}
        />
      ))}
    </>
  );
};

export default LinesList;
