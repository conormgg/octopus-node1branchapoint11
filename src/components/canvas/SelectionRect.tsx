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

  return (
    <Rect
      x={selectionBounds.x + (rotation !== 0 ? selectionBounds.width / 2 : 0)}
      y={selectionBounds.y + (rotation !== 0 ? selectionBounds.height / 2 : 0)}
      width={selectionBounds.width}
      height={selectionBounds.height}
      rotation={rotation}
      offsetX={rotation !== 0 ? selectionBounds.width / 2 : 0}
      offsetY={rotation !== 0 ? selectionBounds.height / 2 : 0}
      fill="transparent"
      stroke="rgba(0, 0, 0, 0.8)"
      strokeWidth={1}
      dash={[5, 5]}
      listening={false}
    />
  );
};

export default SelectionRect;
