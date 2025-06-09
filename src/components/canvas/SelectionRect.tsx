import React from 'react';
import { Rect } from 'react-konva';
import { SelectionBounds } from '@/types/whiteboard';

interface SelectionRectProps {
  selectionBounds: SelectionBounds | null;
  isVisible: boolean;
}

const SelectionRect: React.FC<SelectionRectProps> = ({
  selectionBounds,
  isVisible
}) => {
  if (!isVisible || !selectionBounds) {
    return null;
  }

  return (
    <Rect
      x={selectionBounds.x}
      y={selectionBounds.y}
      width={selectionBounds.width}
      height={selectionBounds.height}
      fill="rgba(0, 123, 255, 0.1)"
      stroke="rgba(0, 123, 255, 0.8)"
      strokeWidth={1}
      dash={[5, 5]}
      listening={false}
    />
  );
};

export default SelectionRect;
