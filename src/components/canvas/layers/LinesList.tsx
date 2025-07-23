import React from 'react';
import { Line } from 'react-konva';
import { LineObject } from '@/types/whiteboard';

interface LinesListProps {
  lines: LineObject[];
}

const LinesList: React.FC<LinesListProps> = ({ lines }) => {

  return (
    <>
      {lines.map((line) => (
        <Line
          key={line.id}
          id={line.id}
          points={line.points}
          stroke={line.color}
          strokeWidth={line.strokeWidth}
          x={line.x}
          y={line.y}
          scaleX={line.scaleX}
          scaleY={line.scaleY}
          rotation={line.rotation}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation={line.tool === 'highlighter' ? 'multiply' : 'source-over'}
          opacity={line.tool === 'highlighter' ? 0.5 : 1}
        />
      ))}
    </>
  );
};

export default LinesList;
