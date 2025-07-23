import React from 'react';
import { Layer } from 'react-konva';
import Konva from 'konva';
import { Tool, SelectionBounds, LineObject, ImageObject } from '@/types/whiteboard';
import { useNormalizedWhiteboardState } from '@/hooks/performance/useNormalizedWhiteboardState';
// Removed legacy selection components - now using unified selection
// Legacy: import SelectionRect from '../SelectionRect';
// Legacy: import SelectionGroup from '../SelectionGroup';
import LinesList from './LinesList';
import LayerOptimizationHandler from './LayerOptimizationHandler';

interface LinesLayerProps {
  layerRef: React.RefObject<Konva.Layer>;
  lines: LineObject[];
  images: ImageObject[];
  currentTool: Tool;
  selectionBounds?: SelectionBounds | null;
  isSelecting?: boolean;
  selection?: any; // Legacy prop - no longer used
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
  selection, // Legacy prop - no longer used
  onUpdateLine,
  onUpdateImage,
  onTransformEnd,
  normalizedState
}) => {
  // Use the lines directly, no longer using complex viewport culling
  const linesToUse = lines;
  const imagesToUse = images;

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
        onUpdateLine={onUpdateLine}
      />
      
      {/* Legacy selection components removed - now using unified selection */}
      {/* SelectionGroup and SelectionRect functionality moved to Select2Renderer */}
    </Layer>
  );
};

export default LinesLayer;