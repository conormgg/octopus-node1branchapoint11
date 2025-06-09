import React, { useRef, useEffect } from 'react';
import { Line, Transformer } from 'react-konva';
import { LineObject } from '@/types/whiteboard';
import Konva from 'konva';

interface LineRendererProps {
  line: LineObject;
  isSelected?: boolean;
  onSelect?: () => void;
  onChange?: (newAttrs: Partial<LineObject>) => void;
  onUpdateState?: () => void;
  onTransformStart?: () => void;
}

const LineRenderer: React.FC<LineRendererProps> = ({ 
  line, 
  isSelected = false, 
  onSelect, 
  onChange, 
  onUpdateState,
  onTransformStart
}) => {
  // Don't render eraser strokes - they are used for stroke deletion, not visual feedback
  if (line.tool === 'eraser') return null;

  const lineRef = useRef<Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && lineRef.current) {
      trRef.current.nodes([lineRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (onChange) {
      onChange({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
    if (onUpdateState) {
      onUpdateState();
    }
  };

  const handleTransformStart = () => {
    if (onTransformStart) {
      onTransformStart();
    }
  };

  const handleTransformEnd = () => {
    if (!lineRef.current || !onChange || !onUpdateState) return;

    const node = lineRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Update the line with new transform values
    onChange({
      x: node.x(),
      y: node.y(),
      scaleX,
      scaleY,
      rotation
    });

    onUpdateState();
  };

  return (
    <>
      <Line
        id={line.id}
        ref={lineRef}
        points={line.points}
        stroke={line.color}
        strokeWidth={line.strokeWidth}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation="source-over"
        x={line.x}
        y={line.y}
        scaleX={line.scaleX}
        scaleY={line.scaleY}
        rotation={line.rotation}
        perfectDrawEnabled={false}
        listening={!!onSelect} // Only listen for events if selectable
        onClick={onSelect}
        onTap={onSelect}
        draggable={isSelected && !!onChange}
        onDragStart={onSelect}
        onDragEnd={handleDragEnd}
        onTransformStart={handleTransformStart}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default LineRenderer;
