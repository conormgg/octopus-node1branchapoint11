
import React, { useRef, useEffect } from 'react';
import { Group, Transformer, Rect } from 'react-konva';
import Konva from 'konva';
import { LineObject, ImageObject, SelectedObject } from '@/types/whiteboard';
import LineRenderer from './LineRenderer';
import ImageRenderer from './ImageRenderer';

interface GroupTransformerProps {
  selectedObjects: SelectedObject[];
  lines: LineObject[];
  images: ImageObject[];
  groupBounds: { x: number; y: number; width: number; height: number } | null;
  onTransformEnd: (updates: { x: number; y: number; scaleX: number; scaleY: number; rotation: number }) => void;
}

const GroupTransformer: React.FC<GroupTransformerProps> = ({
  selectedObjects,
  lines,
  images,
  groupBounds,
  onTransformEnd
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (selectedObjects.length > 1 && groupBounds && groupRef.current && transformerRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedObjects, groupBounds]);

  if (selectedObjects.length <= 1 || !groupBounds) {
    return null;
  }

  const handleTransformEnd = () => {
    const group = groupRef.current;
    if (group) {
      onTransformEnd({
        x: group.x(),
        y: group.y(),
        scaleX: group.scaleX(),
        scaleY: group.scaleY(),
        rotation: group.rotation()
      });
    }
  };

  return (
    <>
      <Group
        ref={groupRef}
        x={groupBounds.x}
        y={groupBounds.y}
        width={groupBounds.width}
        height={groupBounds.height}
        onTransformEnd={handleTransformEnd}
      >
        {/* Background rect for group bounds */}
        <Rect
          x={0}
          y={0}
          width={groupBounds.width}
          height={groupBounds.height}
          fill="transparent"
          stroke="rgba(0, 123, 255, 0.5)"
          strokeWidth={2}
          dash={[5, 5]}
          name="group-background"
        />
        
        {/* Render selected objects within group */}
        {selectedObjects.map(obj => {
          if (obj.type === 'line') {
            const line = lines.find(l => l.id === obj.id);
            if (!line) return null;
            
            return (
              <LineRenderer
                key={obj.id}
                line={{
                  ...line,
                  x: line.x - groupBounds.x,
                  y: line.y - groupBounds.y
                }}
                isSelected={false}
                currentTool="select2"
              />
            );
          } else if (obj.type === 'image') {
            const image = images.find(i => i.id === obj.id);
            if (!image) return null;
            
            return (
              <ImageRenderer
                key={obj.id}
                imageObject={{
                  ...image,
                  x: image.x - groupBounds.x,
                  y: image.y - groupBounds.y
                }}
                isSelected={false}
                onSelect={() => {}}
                onChange={() => {}}
                onUpdateState={() => {}}
                currentTool="select2"
              />
            );
          }
          return null;
        })}
      </Group>
      
      {/* Transformer for the group */}
      <Transformer
        ref={transformerRef}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 20 || newBox.height < 20) {
            return oldBox;
          }
          return newBox;
        }}
        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
      />
    </>
  );
};

export default GroupTransformer;
