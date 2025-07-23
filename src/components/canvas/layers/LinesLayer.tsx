
import React from 'react';
import { Layer } from 'react-konva';
import Konva from 'konva';
import { Tool, SelectionBounds, LineObject, ImageObject } from '@/types/whiteboard';
import { useNormalizedWhiteboardState } from '@/hooks/performance/useNormalizedWhiteboardState';
import LinesList from './LinesList';
import LayerOptimizationHandler from './LayerOptimizationHandler';

interface LinesLayerProps {
  layerRef: React.RefObject<Konva.Layer>;
  lines: LineObject[];
  images: ImageObject[];
  currentTool: Tool;
  selectionBounds?: SelectionBounds | null;
  isSelecting?: boolean;
  selection?: any;
  onUpdateLine?: (lineId: string, updates: Partial<LineObject>) => void;
  onUpdateImage?: (imageId: string, updates: Partial<ImageObject>) => void;
  onTransformEnd?: () => void;
  normalizedState?: ReturnType<typeof useNormalizedWhiteboardState>;
}

const LinesLayer: React.FC<LinesLayerProps> = ({
  layerRef,
  lines,
  images,
  currentTool,
  selectionBounds,
  isSelecting = false,
  selection,
  onUpdateLine,
  onUpdateImage,
  onTransformEnd,
  normalizedState
}) => {
  // Use the lines directly, no longer using complex viewport culling
  const linesToUse = lines;

  return (
    <Layer ref={layerRef} listening={true}>
      {/* LayerOptimizationHandler for performance */}
      <LayerOptimizationHandler 
        layerRef={layerRef}
        currentTool={currentTool}
        lineCount={lines.length}
        imageCount={images.length}
        isSelecting={isSelecting}
      />
      
      {/* Render all lines through LinesList component */}
      <LinesList
        lines={linesToUse}
        currentTool={currentTool}
        selection={selection}
        onUpdateLine={onUpdateLine}
      />
    </Layer>
  );
};

export default LinesLayer;
