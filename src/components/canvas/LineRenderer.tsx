import React from 'react';
import { Line } from 'react-konva';
import { LineObject } from '@/types/whiteboard';
import Konva from 'konva';

interface LineRendererProps {
  line: LineObject;
  isSelected?: boolean;
  onSelect?: () => void;
}

const LineRenderer: React.FC<LineRendererProps> = ({ line, isSelected = false, onSelect }) => {
  // Don't render eraser strokes - they are used for stroke deletion, not visual feedback
  if (line.tool === 'eraser') return null;

  return (
    <>
      {/* Selection highlight - render behind the line */}
      {isSelected && (
        <Line
          points={line.points}
          stroke="rgba(0, 123, 255, 0.5)"
          strokeWidth={line.strokeWidth + 4}
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
          listening={false}
        />
      )}
      
      {/* Main line */}
      <Line
        id={line.id}
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
        listening={onSelect ? true : false}
        onClick={onSelect}
        onTap={onSelect}
      />
    </>
  );
};

export default LineRenderer;
