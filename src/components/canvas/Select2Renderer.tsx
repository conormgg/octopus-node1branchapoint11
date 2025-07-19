import React from 'react';
import { Rect } from 'react-konva';
import { SelectionBounds, SelectedObject } from '@/types/whiteboard';

interface Select2RendererProps {
  selectedObjects: SelectedObject[];
  hoveredObjectId: string | null;
  selectionBounds: SelectionBounds | null;
  isSelecting: boolean;
}

export const Select2Renderer: React.FC<Select2RendererProps> = ({
  selectedObjects,
  hoveredObjectId,
  selectionBounds,
  isSelecting
}) => {
  return (
    <>
      {/* Selection rectangle during drag-to-select */}
      {isSelecting && selectionBounds && (
        <Rect
          x={selectionBounds.x}
          y={selectionBounds.y}
          width={selectionBounds.width}
          height={selectionBounds.height}
          fill="rgba(0, 123, 255, 0.1)"
          stroke="rgba(0, 123, 255, 0.5)"
          strokeWidth={1}
          dash={[5, 5]}
          listening={false}
        />
      )}

      {/* Visual feedback for selected objects */}
      {selectedObjects.map(obj => (
        <Rect
          key={`selection-${obj.id}`}
          x={0} // Will be positioned by parent
          y={0}
          width={100} // Will be sized by parent
          height={100}
          fill="transparent"
          stroke="rgba(0, 123, 255, 0.8)"
          strokeWidth={2}
          listening={false}
          visible={false} // For now, just keeping the structure
        />
      ))}

      {/* Visual feedback for hovered object */}
      {hoveredObjectId && (
        <Rect
          key={`hover-${hoveredObjectId}`}
          x={0}
          y={0}
          width={100}
          height={100}
          fill="transparent"
          stroke="rgba(0, 123, 255, 0.4)"
          strokeWidth={1}
          listening={false}
          visible={false} // For now, just keeping the structure
        />
      )}
    </>
  );
};