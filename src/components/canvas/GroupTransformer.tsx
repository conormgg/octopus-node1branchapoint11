
import React, { useRef, useEffect } from 'react';
import { Group, Transformer, Rect } from 'react-konva';
import Konva from 'konva';
import { SelectedObject, LineObject, ImageObject } from '@/types/whiteboard';
import { useGroupTransform } from '@/hooks/useGroupTransform';

interface GroupTransformerProps {
  selectedObjects: SelectedObject[];
  lines: LineObject[];
  images: ImageObject[];
  groupBounds: { x: number; y: number; width: number; height: number } | null;
  onUpdateLine?: (lineId: string, updates: Partial<LineObject>) => void;
  onUpdateImage?: (imageId: string, updates: Partial<ImageObject>) => void;
  onTransformEnd?: () => void;
  currentTool?: string;
}

export const GroupTransformer: React.FC<GroupTransformerProps> = ({
  selectedObjects,
  lines,
  images,
  groupBounds,
  onUpdateLine,
  onUpdateImage,
  onTransformEnd,
  currentTool = 'pencil'
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Only show group transformer for multiple selected objects with selection tools
  const showGroupTransformer = selectedObjects.length > 1 && 
    (currentTool === 'select' || currentTool === 'select2') && 
    groupBounds;

  const selectedLines = selectedObjects
    .filter(obj => obj.type === 'line')
    .map(obj => lines.find(line => line.id === obj.id))
    .filter(Boolean) as LineObject[];

  const selectedImages = selectedObjects
    .filter(obj => obj.type === 'image')
    .map(obj => images.find(image => image.id === obj.id))
    .filter(Boolean) as ImageObject[];

  const { handleTransformEnd } = useGroupTransform({
    selectedLines,
    selectedImages,
    onUpdateLine,
    onUpdateImage,
    onTransformEnd
  });

  useEffect(() => {
    if (showGroupTransformer && groupRef.current) {
      trRef.current?.nodes([groupRef.current]);
      trRef.current?.getLayer()?.batchDraw();
    }
  }, [showGroupTransformer, groupBounds]);

  if (!showGroupTransformer) {
    return null;
  }

  return (
    <Group
      ref={groupRef}
      x={groupBounds!.x}
      y={groupBounds!.y}
      width={groupBounds!.width}
      height={groupBounds!.height}
      listening={false}
    >
      {/* Invisible background for transformer to work with */}
      <Rect
        name="group-background"
        x={0}
        y={0}
        width={groupBounds!.width}
        height={groupBounds!.height}
        fill="transparent"
        stroke="rgba(0, 123, 255, 0.8)"
        strokeWidth={2}
        dash={[5, 5]}
        listening={false}
      />
      
      <Transformer
        ref={trRef}
        listening={currentTool === 'select'}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 10 || newBox.height < 10) {
            return oldBox;
          }
          return newBox;
        }}
        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
        onTransformEnd={() => handleTransformEnd(groupRef)}
      />
    </Group>
  );
};
