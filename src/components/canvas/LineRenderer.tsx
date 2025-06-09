import React from 'react';
import { Line } from 'react-konva';
import { LineObject } from '@/types/whiteboard';
import Konva from 'konva';

interface LineRendererProps {
  line: LineObject;
}

const LineRenderer: React.FC<LineRendererProps> = ({ line }) => {
  // Don't render eraser strokes - they are used for stroke deletion, not visual feedback
  if (line.tool === 'eraser') return null;

  return (
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
      listening={false}
    />
  );
};

export default LineRenderer;
