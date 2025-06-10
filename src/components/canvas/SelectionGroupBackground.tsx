
import React from 'react';
import { Rect } from 'react-konva';
import { GroupBounds } from '@/utils/groupBoundsCalculator';

interface SelectionGroupBackgroundProps {
  groupBounds: GroupBounds | null;
}

const SelectionGroupBackground: React.FC<SelectionGroupBackgroundProps> = ({ groupBounds }) => {
  if (!groupBounds) {
    return null;
  }

  return (
    <Rect
      name="group-background"
      x={groupBounds.x}
      y={groupBounds.y}
      width={groupBounds.width}
      height={groupBounds.height}
      fill="transparent"
      listening={true}
    />
  );
};

export default SelectionGroupBackground;
