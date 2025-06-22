
import React, { useRef, useEffect } from 'react';
import { Line, Transformer } from 'react-konva';
import Konva from 'konva';
import { LineObject, Tool } from '@/types/whiteboard';

interface LineRendererProps {
  line: LineObject;
  isSelected: boolean;
  isHovered?: boolean;
  currentTool: Tool;
  onSelect?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onDragEnd?: (newPosition: { x: number; y: number }) => void;
  onTransformEnd?: (newAttributes: Partial<LineObject>) => void;
}

const LineRenderer: React.FC<LineRendererProps> = React.memo(({
  line,
  isSelected,
  isHovered = false,
  currentTool,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  onDragEnd,
  onTransformEnd
}) => {
  const lineRef = useRef<Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && currentTool === 'select') {
      trRef.current?.nodes([lineRef.current!]);
      trRef.current?.getLayer()?.batchDraw();
    }
  }, [isSelected, currentTool]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (onDragEnd) {
      console.log(`[Line Movement] Line ${line.id} drag ended at:`, {
        x: e.target.x(),
        y: e.target.y()
      });
      onDragEnd({
        x: e.target.x(),
        y: e.target.y()
      });
    }
  };

  const handleTransformEnd = () => {
    const node = lineRef.current;
    if (node && onTransformEnd) {
      const newAttributes = {
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation()
      };
      console.log(`[Line Movement] Line ${line.id} transform ended:`, newAttributes);
      onTransformEnd(newAttributes);
    }
  };

  return (
    <>
      <Line
        ref={lineRef}
        points={line.points}
        stroke={isHovered && !isSelected ? 'rgba(0, 123, 255, 0.3)' : line.color}
        strokeWidth={isHovered && !isSelected ? line.strokeWidth + 2 : line.strokeWidth}
        x={line.x}
        y={line.y}
        scaleX={line.scaleX}
        scaleY={line.scaleY}
        rotation={line.rotation}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
        draggable={currentTool === 'select' && isSelected}
        onClick={onSelect}
        onTap={onSelect}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && currentTool === 'select' && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Memoization optimization
  return (
    prevProps.line.id === nextProps.line.id &&
    prevProps.line.x === nextProps.line.x &&
    prevProps.line.y === nextProps.line.y &&
    prevProps.line.scaleX === nextProps.line.scaleX &&
    prevProps.line.scaleY === nextProps.line.scaleY &&
    prevProps.line.rotation === nextProps.line.rotation &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.currentTool === nextProps.currentTool
  );
});

export default LineRenderer;
