
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
  // Viewport props for culling
  stageRef?: React.RefObject<Konva.Stage>;
}

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';
const USE_LAYER_OPTIMIZATION = false; // Feature flag - start disabled for safety
const USE_VIEWPORT_CULLING = true; // Feature flag for viewport culling

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
  // Layer optimization hook with conservative settings
  const layerOptimization = useCanvasLayerOptimization(layerRef, {
    enableStaticCaching: USE_LAYER_OPTIMIZATION,
    cacheThreshold: 20, // Only cache when 20+ objects
    maxCacheAge: 5000   // 5 second cache lifetime
  });

  // Calculate current viewport bounds
  const getViewportBounds = React.useCallback(() => {
    if (!stageRef?.current) return null;
    
    const stage = stageRef.current;
    const scale = stage.scaleX(); // Assume uniform scaling
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    
    // Convert stage coordinates to world coordinates
    const worldX = -stage.x() / scale;
    const worldY = -stage.y() / scale;
    const worldWidth = stageWidth / scale;
    const worldHeight = stageHeight / scale;
    
    return {
      x: worldX,
      y: worldY,
      width: worldWidth,
      height: worldHeight,
      scale
    };
  }, [stageRef]);

  // Check if a line is within viewport bounds
  const isLineInViewport = React.useCallback((line: LineObject, viewport: any) => {
    if (!viewport || !USE_VIEWPORT_CULLING) return true;
    
    // Calculate line bounds from points
    const points = line.points;
    if (points.length < 2) return true; // Always show incomplete lines
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i] + line.x;
      const y = points[i + 1] + line.y;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    
    // Add buffer zone around viewport for smooth scrolling
    const buffer = 100;
    const viewportLeft = viewport.x - buffer;
    const viewportTop = viewport.y - buffer;
    const viewportRight = viewport.x + viewport.width + buffer;
    const viewportBottom = viewport.y + viewport.height + buffer;
    
    // Check if line bounds intersect with viewport
    const isVisible = !(
      maxX < viewportLeft ||
      minX > viewportRight ||
      maxY < viewportTop ||
      minY > viewportBottom
    );
    
    return isVisible;
  }, []);

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
  const allLinesToRender = useNormalized 
    ? normalizedState.lineIds.map(id => normalizedState.getLineById(id)).filter(Boolean)
    : lines;

  // Apply viewport culling to lines
  const viewport = getViewportBounds();
  const linesToRender = React.useMemo(() => {
    if (!USE_VIEWPORT_CULLING || !viewport) {
      return allLinesToRender;
    }
    
    const visibleLines = allLinesToRender.filter(line => 
      line && isLineInViewport(line, viewport)
    );
    
    if (DEBUG_ENABLED && allLinesToRender.length > 0) {
      debugLog('Culling', 'Viewport culling results', {
        totalLines: allLinesToRender.length,
        visibleLines: visibleLines.length,
        culledLines: allLinesToRender.length - visibleLines.length,
        viewport: {
          x: Math.round(viewport.x),
          y: Math.round(viewport.y),
          width: Math.round(viewport.width),
          height: Math.round(viewport.height),
          scale: viewport.scale.toFixed(2)
        }
      });
    }
    
    return visibleLines;
  }, [allLinesToRender, viewport, isLineInViewport]);

  // Get images for selection group - either from normalized state or direct array
  const imagesToUse = useNormalized && normalizedState.imageCount > 0
    ? normalizedState.imageIds.map(id => normalizedState.getImageById(id)).filter(Boolean)
    : images;

  // Trigger layer optimization when static content changes
  React.useEffect(() => {
    if (USE_LAYER_OPTIMIZATION && !isSelecting) {
      // Only optimize when not actively drawing or erasing
      const isActiveDrawing = currentTool === 'pencil' || currentTool === 'eraser';
      
      if (!isActiveDrawing) {
        const totalObjects = linesToRender.length + imagesToUse.length;
        if (totalObjects >= 20) {
          debugLog('Optimization', 'Considering layer cache update', {
            totalObjects,
            currentTool,
            isSelecting
          });
          
          // Use optimized layer update after a brief delay to ensure rendering is complete
          setTimeout(() => {
            layerOptimization.updateLayerOptimized();
          }, 100);
        }
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
    if (USE_LAYER_OPTIMIZATION) {
      const isActiveDrawing = currentTool === 'pencil' || currentTool === 'eraser';
      
      if (isActiveDrawing || isSelecting) {
        debugLog('Optimization', 'Disabling cache during active drawing/selection');
        layerOptimization.disableStaticLayerCache();
      }
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
