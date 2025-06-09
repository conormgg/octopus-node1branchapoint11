
import React, { useRef, useEffect } from 'react';
import { Image, Transformer } from 'react-konva';
import Konva from 'konva';
import { ImageObject } from '@/types/whiteboard';
import useImage from 'use-image';

interface ImageRendererProps {
  imageObject: ImageObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<ImageObject>) => void;
  onUpdateState: () => void;
  onTransformStart?: () => void;
}

const ImageRenderer: React.FC<ImageRendererProps> = ({
  imageObject,
  isSelected,
  onSelect,
  onChange,
  onUpdateState,
  onTransformStart,
}) => {
  const [image] = useImage(imageObject.src);
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected) {
      trRef.current?.nodes([imageRef.current!]);
      trRef.current?.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({
      x: e.target.x(),
      y: e.target.y(),
    });
    onUpdateState();
  };

  const handleTransformStart = () => {
    if (onTransformStart) {
      onTransformStart();
    }
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
      });
      onUpdateState();
    }
  };

  return (
    <>
      <Image
        onClick={onSelect}
        onTap={onSelect}
        ref={imageRef}
        image={image}
        x={imageObject.x}
        y={imageObject.y}
        draggable={isSelected}
        onDragStart={onSelect}
        onDragEnd={handleDragEnd}
        onTransformStart={handleTransformStart}
        onTransformEnd={handleTransformEnd}
        {...(imageObject.width && { width: imageObject.width })}
        {...(imageObject.height && { height: imageObject.height })}
      />
      {isSelected && (
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
};

export default ImageRenderer;
