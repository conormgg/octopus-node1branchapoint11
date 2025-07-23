import React, { useRef, useEffect } from 'react';
import { Group, Rect, Transformer } from 'react-konva';
import { SelectedObject, LineObject, ImageObject } from '@/types/whiteboard';
import { useWhiteboard } from '@/context/WhiteboardContext';
import { usePanZoom } from '@/hooks/usePanZoom';
import { useSelectEventHandlers } from '@/hooks/useSelectEventHandlers';

interface SelectionGroupProps {
  selectedObjects: SelectedObject[];
  lines: LineObject[];
  images: ImageObject[];
  stageRef: React.RefObject<any>;
  transformerRef: React.RefObject<Transformer>;
}

const SelectionGroup: React.FC<SelectionGroupProps> = ({
  selectedObjects,
  lines,
  images,
  stageRef,
  transformerRef
}) => {
  const { onUpdateLine, onUpdateImage, onDeleteObjects } = useWhiteboard();
  const { panZoomState, panZoom } = usePanZoom();
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    if (!transformerRef.current) return;

    const transformerNode = transformerRef.current.getNode();
    if (!transformerNode) return;

    if (selectedObjects.length > 0 && groupRef.current) {
      transformerNode.nodes([groupRef.current]);
      transformerRef.current.moveToTop();
      transformerRef.current.show();
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.hide();
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedObjects, transformerRef]);

  // Select handlers for interaction
  const selectHandlers = useSelectEventHandlers({
    stageRef,
    lines,
    images,
    panZoomState,
    panZoom,
    onUpdateLine,
    onUpdateImage,
    onDeleteObjects,
    containerRef: null,
    mainSelection: {
      selectObjects: () => {},
      clearSelection: () => {},
      setSelectionBounds: () => {},
      setIsSelecting: () => {},
      selectionState: {
        selectedObjects: [],
        isSelecting: false,
        selectionBounds: null
      }
    }
  });

  return (
    <Group
      ref={groupRef}
      draggable
      onDragStart={() => {
        // Disable drag during pan/zoom
        if (panZoom.isGestureActive()) {
          return;
        }
      }}
      onDragEnd={(e) => {
        if (panZoom.isGestureActive()) {
          return;
        }

        selectedObjects.forEach(obj => {
          if (obj.type === 'line' && onUpdateLine) {
            const line = lines.find(l => l.id === obj.id);
            if (line) {
              onUpdateLine(obj.id, {
                x: line.x + e.target.x() - (line.x || 0),
                y: line.y + e.target.y() - (line.y || 0)
              });
            }
          } else if (obj.type === 'image' && onUpdateImage) {
            const image = images.find(i => i.id === obj.id);
            if (image) {
              onUpdateImage(obj.id, {
                x: image.x + e.target.x() - (image.x || 0),
                y: image.y + e.target.y() - (image.y || 0)
              });
            }
          }
        });
      }}
    />
  );
};

export default SelectionGroup;
