
import React, { useRef, useEffect } from 'react';
import { Image, Transformer } from 'react-konva';
import Konva from 'konva';
import { ImageObject } from '@/types/whiteboard';
import useImage from 'use-image';

interface ImageRendererProps {
  imageObject: ImageObject;
  isSelected: boolean;
  isHovered?: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<ImageObject>) => void;
  onUpdateState: () => void;
  onGroupDragStart?: (objectId: string) => void;
  onGroupDragMove?: (objectId: string, x: number, y: number) => void;
  onGroupDragEnd?: () => void;
  currentTool?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const ImageRenderer: React.FC<ImageRendererProps> = React.memo(({
  imageObject,
  isSelected,
  isHovered = false,
  onSelect,
  onChange,
  onUpdateState,
  onGroupDragStart,
  onGroupDragMove,
  onGroupDragEnd,
  currentTool = 'pencil',
  onMouseEnter,
  onMouseLeave,
}) => {
  const [image] = useImage(imageObject.src);
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && currentTool === 'select') {
      trRef.current?.nodes([imageRef.current!]);
      trRef.current?.getLayer()?.batchDraw();
    }
  }, [isSelected, currentTool]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({
      x: e.target.x(),
      y: e.target.y(),
    });
    onUpdateState();
  };

  const handleTransformEnd = () => {
    const node = imageRef.current;
    if (node) {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      onChange({
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(node.height() * scaleY),
        rotation: node.rotation(), // Include rotation in the update
      });
      onUpdateState();
    }
  };

  return (
    <>
      <Image
        onClick={onSelect}
        onTap={onSelect}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        ref={imageRef}
        image={image}
        x={imageObject.x}
        y={imageObject.y}
        rotation={imageObject.rotation || 0} // Apply rotation from imageObject
        draggable={currentTool === 'select' && isSelected}
        onDragStart={(e) => {
          onSelect();
          if (onGroupDragStart) {
            onGroupDragStart(imageObject.id);
          }
        }}
        onDragMove={(e) => {
          if (onGroupDragMove) {
            const node = e.target;
            onGroupDragMove(imageObject.id, node.x(), node.y());
          }
        }}
        onDragEnd={(e) => {
          handleDragEnd(e);
          if (onGroupDragEnd) {
            onGroupDragEnd();
          }
        }}
        onTransformEnd={handleTransformEnd}
        stroke={isHovered && !isSelected ? 'rgba(0, 123, 255, 0.3)' : undefined}
        strokeWidth={isHovered && !isSelected ? 2 : 0}
        {...(imageObject.width && { width: imageObject.width })}
        {...(imageObject.height && { height: imageObject.height })}
      />
      {isSelected && currentTool === 'select' && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if these specific props change
  return (
    prevProps.imageObject.id === nextProps.imageObject.id &&
    prevProps.imageObject.src === nextProps.imageObject.src &&
    prevProps.imageObject.x === nextProps.imageObject.x &&
    prevProps.imageObject.y === nextProps.imageObject.y &&
    prevProps.imageObject.width === nextProps.imageObject.width &&
    prevProps.imageObject.height === nextProps.imageObject.height &&
    prevProps.imageObject.rotation === nextProps.imageObject.rotation &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.currentTool === nextProps.currentTool
  );
});

export default ImageRenderer;
