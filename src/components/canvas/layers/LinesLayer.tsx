
import React from 'react';
import { Layer } from 'react-konva';
import Konva from 'konva';
import { Tool, SelectionBounds, LineObject, ImageObject } from '@/types/whiteboard';
import { useNormalizedWhiteboardState } from '@/hooks/performance/useNormalizedWhiteboardState';
import { useCanvasLayerOptimization } from '@/hooks/canvas/useCanvasLayerOptimization';
import LineRenderer from '../LineRenderer';
import SelectionRect from '../SelectionRect';
import SelectionGroup from '../SelectionGroup';

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
}

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';
const USE_LAYER_OPTIMIZATION = false; // Feature flag - start disabled for safety

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
  onTransformEnd
}) => {
  // Layer optimization hook with conservative settings
  const layerOptimization = useCanvasLayerOptimization(layerRef, {
    enableStaticCaching: USE_LAYER_OPTIMIZATION,
    cacheThreshold: 20, // Only cache when 20+ objects
    maxCacheAge: 5000   // 5 second cache lifetime
  });

  // Use normalized state if available, otherwise fall back to array-based approach
  const useNormalized = normalizedState && normalizedState.lineCount > 0;
  
  if (DEBUG_ENABLED && useNormalized) {
    debugLog('Performance', 'Using normalized state for rendering', {
      lineCount: normalizedState.lineCount,
      imageCount: normalizedState.imageCount
    });
  }

  // Log layer optimization status
  if (DEBUG_ENABLED && USE_LAYER_OPTIMIZATION) {
    debugLog('Optimization', 'Layer optimization enabled', {
      totalObjects: lines.length + images.length,
      cacheThreshold: 20,
      willCache: lines.length + images.length >= 20
    });
  }

  // Get lines to render - either from normalized state or direct array
  const linesToRender = useNormalized 
    ? normalizedState.lineIds.map(id => normalizedState.getLineById(id)).filter(Boolean)
    : lines;

  // Get images for selection group - either from normalized state or direct array
  const imagesToUse = useNormalized && normalizedState.imageCount > 0
    ? normalizedState.imageIds.map(id => normalizedState.getImageById(id)).filter(Boolean)
    : images;

  // Trigger layer optimization when static content changes
  React.useEffect(() => {
    if (USE_LAYER_OPTIMIZATION && !isSelecting && currentTool !== 'pencil' && currentTool !== 'eraser') {
      const totalObjects = linesToRender.length + imagesToUse.length;
      if (totalObjects >= 20) {
        debugLog('Optimization', 'Considering layer cache update', {
          totalObjects,
          isDrawing: currentTool === 'pencil',
          isSelecting
        });
        
        // Use optimized layer update after a brief delay to ensure rendering is complete
        setTimeout(() => {
          layerOptimization.updateLayerOptimized();
        }, 100);
      }
    }
  }, [
    linesToRender.length, 
    imagesToUse.length, 
    isSelecting, 
    currentTool, 
    layerOptimization,
    USE_LAYER_OPTIMIZATION
  ]);

  // Disable cache during active drawing for best responsiveness
  React.useEffect(() => {
    if (USE_LAYER_OPTIMIZATION && (currentTool === 'pencil' || currentTool === 'eraser' || isSelecting)) {
      debugLog('Optimization', 'Disabling cache during active drawing/selection');
      layerOptimization.disableStaticLayerCache();
    }
  }, [currentTool, isSelecting, layerOptimization, USE_LAYER_OPTIMIZATION]);

  return (
    <Layer ref={layerRef}>
      {/* Individual lines - hide transformers when part of a group */}
      {linesToRender.map((line) => {
        if (!line) return null; // Safety check for filtered items
        
        const isSelected = selection?.isObjectSelected?.(line.id) || false;
        const isInGroup = selection?.selectionState?.selectedObjects?.length > 1 && isSelected;
        
        return (
          <LineRenderer 
            key={line.id} 
            line={line}
            isSelected={isSelected && !isInGroup} // Hide individual selection when in group
            isHovered={selection?.hoveredObjectId === line.id}
            currentTool={currentTool}
            onSelect={currentTool === 'select' ? () => {
              if (selection) {
                selection.selectObjects([{ id: line.id, type: 'line' }]);
              }
            } : undefined}
            onMouseEnter={currentTool === 'select' ? () => {
              if (selection?.setHoveredObjectId) {
                selection.setHoveredObjectId(line.id);
              }
            } : undefined}
            onMouseLeave={currentTool === 'select' ? () => {
              if (selection?.setHoveredObjectId) {
                selection.setHoveredObjectId(null);
              }
            } : undefined}
            onDragEnd={(newPosition) => {
              if (onUpdateLine) {
                onUpdateLine(line.id, newPosition);
              }
            }}
          />
        );
      })}
      
      {/* Selection Group - handles multiple selected objects as one entity */}
      {selection?.selectionState?.selectedObjects && (
        <SelectionGroup
          selectedObjects={selection.selectionState.selectedObjects}
          lines={linesToRender}
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
