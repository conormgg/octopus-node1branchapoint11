import React from 'react';
import { Rect } from 'react-konva';
import { SelectionBounds } from '@/types/whiteboard';

interface SelectionRectProps {
  selectionBounds: SelectionBounds | null;
  isVisible: boolean;
  rotation?: number;
}

const SelectionRect: React.FC<SelectionRectProps> = ({
  selectionBounds,
  isVisible,
  rotation = 0
}) => {
  if (!isVisible || !selectionBounds) {
    return null;
  }

  const x = selectionBounds.x + selectionBounds.width / 2;
  const y = selectionBounds.y + selectionBounds.height / 2;

  return (
    <Rect
      x={x}
      y={y}
      width={selectionBounds.width}
      height={selectionBounds.height}
      rotation={rotation}
      offsetX={selectionBounds.width / 2}
      offsetY={selectionBounds.height / 2}
      fill="rgba(0, 123, 255, 0.1)"
      stroke="rgba(0, 123, 255, 0.8)"
      strokeWidth={1}
      dash={[5, 5]}
      listening={false}
    />
  );
};

export default SelectionRect;
