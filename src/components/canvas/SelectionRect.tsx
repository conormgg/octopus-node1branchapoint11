import React from 'react';
import { Rect } from 'react-konva';
import { SelectionBounds } from '@/types/whiteboard';

interface SelectionRectProps {
  selectionBounds: SelectionBounds | null;
  isVisible: boolean;
}

const SelectionRect: React.FC<SelectionRectProps> = ({
  selectionBounds,
  isVisible,
}) => {
  if (!isVisible || !selectionBounds) {
    return null;
  }

  const { x, y, width, height, rotation = 0 } = selectionBounds;

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={rotation}
      offsetX={width / 2}
      offsetY={height / 2}
      fill="rgba(0, 123, 255, 0.1)"
      stroke="rgba(0, 123, 255, 0.8)"
      strokeWidth={1}
      dash={[5, 5]}
      listening={false}
    />
  );
};

export default SelectionRect;
