import React from 'react';
import { Rect } from 'react-konva';

interface SelectionRectProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const SelectionRect: React.FC<SelectionRectProps> = ({ x1, y1, x2, y2 }) => {
  // Calculate the width and height of the rectangle
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  
  // Calculate the top-left corner of the rectangle
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  
  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(0, 161, 255, 0.3)"
      stroke="rgba(0, 161, 255, 0.7)"
      strokeWidth={1}
      dash={[4, 4]}
      perfectDrawEnabled={false}
      listening={false}
    />
  );
};

export default SelectionRect;
