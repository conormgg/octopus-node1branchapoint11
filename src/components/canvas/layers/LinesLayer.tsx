
import React from 'react';
import { Layer } from 'react-konva';
import Konva from 'konva';
import { Tool, SelectionBounds, LineObject, ImageObject } from '@/types/whiteboard';
import { useNormalizedWhiteboardState } from '@/hooks/performance/useNormalizedWhiteboardState';
import { useViewportCulling } from '@/hooks/canvas/useViewportCulling';
import SelectionRect from '../SelectionRect';
import SelectionGroup from '../SelectionGroup';
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
  // Optional normalized state for performance optimization
  normalizedState?: ReturnType<typeof useNormalizedWhiteboardState>;
  onUpdateLine?: (lineId: string, updates: any) => void;
  onUpdateImage?: (imageId: string, updates: any) => void;
  onTransformEnd?: () => void;
  // Viewport props for culling
  stageRef?: React.RefObject<Konva.Stage>;
}

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[LinesLayer:${context}] ${action}`, data || '');
  }
};

const LinesLayer: React.FC<LinesLayerProps> = ({
  layerRef,
  lines,
  images,
  currentTool,
  selectionBounds,
  isSelecting = false,
  selection,
  normalizedState,
  onUpdateLine,
  onUpdateImage,
  onTransformEnd,
  stageRef
}) => {
  const { cullLines } = useViewportCulling(stageRef);

  console.log('[DEBUG] LinesLayer render - isSelecting:', isSelecting, 'selectionBounds:', selectionBounds);
  console.log('[DEBUG] LinesLayer selection state:', selection?.selectionState);

  // Use normalized state if available, otherwise fall back to array-based approach
  const useNormalized = normalizedState && normalizedState.lineCount > 0;
  
  if (DEBUG_ENABLED && useNormalized) {
    debugLog('Performance', 'Using normalized state for rendering', {
      lineCount: normalizedState.lineCount,
      imageCount: normalizedState.imageCount
    });
  }

  // Get lines to render - either from normalized state or direct array
  const allLinesToRender = useNormalized 
    ? normalizedState.lineIds.map(id => normalizedState.getLineById(id)).filter(Boolean)
    : lines;

  // Apply viewport culling to lines
  const linesToRender = React.useMemo(() => {
    return cullLines(allLinesToRender);
  }, [allLinesToRender, cullLines]);

  // Get images for selection group - either from normalized state or direct array
  const imagesToUse = useNormalized && normalizedState.imageCount > 0
    ? normalizedState.imageIds.map(id => normalizedState.getImageById(id)).filter(Boolean)
    : images;

  return (
    <Layer ref={layerRef}>
      {/* Layer optimization handler */}
      <LayerOptimizationHandler
        layerRef={layerRef}
        lineCount={linesToRender.length}
        imageCount={imagesToUse.length}
        currentTool={currentTool}
        isSelecting={isSelecting}
      />

      {/* Individual lines - hide transformers when part of a group */}
      <LinesList
        lines={linesToRender}
        currentTool={currentTool}
        selection={selection}
        onUpdateLine={onUpdateLine}
      />
      
      {/* Selection Group - handles multiple selected objects as one entity */}
      {selection?.selectionState?.selectedObjects && (
        <SelectionGroup
          selectedObjects={selection.selectionState.selectedObjects}
          lines={allLinesToRender} // Use all lines for selection, not culled ones
          images={imagesToUse}
          onUpdateLine={onUpdateLine}
          onUpdateImage={onUpdateImage}
          onTransformEnd={onTransformEnd}
          currentTool={currentTool}
          isVisible={!isSelecting} // Hide during drag-to-select
        />
      )}
      
      {/* Selection rectangle - rendered on top of everything */}
      <SelectionRect
        selectionBounds={selectionBounds}
        isVisible={isSelecting}
      />
    </Layer>
  );
};

export default LinesLayer;
