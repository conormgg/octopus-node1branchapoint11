
import React, { useRef, useEffect } from 'react';
import Konva from 'konva';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import { useNormalizedWhiteboardState } from '@/hooks/performance/useNormalizedWhiteboardState';
import { usePalmRejection } from '@/hooks/usePalmRejection';
import { useKonvaKeyboardHandlers } from '@/hooks/canvas/useKonvaKeyboardHandlers';
import { useKonvaPanZoomSync } from '@/hooks/canvas/useKonvaPanZoomSync';
import { useWheelEventHandlers } from '@/hooks/eventHandling/useWheelEventHandlers';
import { useUnifiedSelection } from '@/hooks/useUnifiedSelection';
import KonvaStageCanvas from './KonvaStageCanvas';
import KonvaImageContextMenuHandler from './KonvaImageContextMenuHandler';
import KonvaImageOperationsHandler from './KonvaImageOperationsHandler';
import { UnifiedSelectionRenderer } from './UnifiedSelectionRenderer';
import { SelectionContextMenu } from './SelectionContextMenu';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

interface KonvaStageProps {
  width: number;
  height: number;
  whiteboardState: ReturnType<typeof useWhiteboardState>;
  isReadOnly?: boolean;
  palmRejectionConfig?: {
    maxContactSize: number;
    minPressure: number;
    palmTimeoutMs: number;
    clusterDistance: number;
    preferStylus: boolean;
    enabled: boolean;
  };
  normalizedState?: ReturnType<typeof useNormalizedWhiteboardState>;
}

const KonvaStage: React.FC<KonvaStageProps> = ({
  width,
  height,
  whiteboardState,
  isReadOnly = false,
  palmRejectionConfig = {
    maxContactSize: 40,
    minPressure: 0.1,
    palmTimeoutMs: 500,
    clusterDistance: 100,
    preferStylus: true,
    enabled: true
  },
  normalizedState
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    panZoom,
    selection,
    updateLine,
    deleteSelectedObjects
  } = whiteboardState;

  // Get whiteboard ID for this instance with proper typing
  const whiteboardId: string = 'whiteboardId' in whiteboardState && typeof whiteboardState.whiteboardId === 'string' 
    ? whiteboardState.whiteboardId 
    : 'default';

  const palmRejection = usePalmRejection(palmRejectionConfig);

  // Check if currently drawing
  const isDrawing = state.isDrawing || false;
  const isDrawingTool = state.currentTool === 'pencil' || state.currentTool === 'highlighter' || state.currentTool === 'eraser';

  // Dynamic touch-action based on drawing state
  const touchAction = React.useMemo(() => {
    if (isDrawing && isDrawingTool) {
      return 'none'; // Strict control during drawing
    }
    return palmRejectionConfig.enabled ? 'manipulation' : 'auto';
  }, [isDrawing, isDrawingTool, palmRejectionConfig.enabled]);

  // Use unified selection for select and select2 tools
  const unifiedSelection = useUnifiedSelection({
    stageRef,
    lines: state.lines,
    images: state.images,
    panZoomState: state.panZoomState,
    containerRef
  });

  // Debug tool state flow in KonvaStage
  useEffect(() => {
    debugLog('KonvaStage', 'Tool state in KonvaStage', {
      currentTool: state.currentTool,
      toolType: typeof state.currentTool,
      whiteboardId
    });
  }, [state.currentTool, whiteboardId]);

  // Use focused hooks for specific functionality
  useKonvaPanZoomSync({
    stageRef,
    panZoomState: state.panZoomState,
    currentTool: state.currentTool
  });

  // Add wheel event handling for zoom (works regardless of tool)
  useWheelEventHandlers({
    containerRef,
    panZoom: {
      handleWheel: panZoom.handleWheel
    }
  });

  // Determine the correct delete functions to use
  const hasSharedOperations = 'operations' in whiteboardState && 
    whiteboardState.operations && 
    typeof whiteboardState.operations === 'object' && 
    'deleteSelectedObjects' in whiteboardState.operations &&
    typeof (whiteboardState.operations as any).deleteSelectedObjects === 'function';

  const deleteFunction = hasSharedOperations 
    ? (whiteboardState.operations as any).deleteSelectedObjects 
    : ('deleteSelectedObjects' in whiteboardState && typeof whiteboardState.deleteSelectedObjects === 'function' 
       ? whiteboardState.deleteSelectedObjects 
       : deleteSelectedObjects);

  useKonvaKeyboardHandlers({
    containerRef,
    whiteboardState,
    isReadOnly,
    whiteboardId,
    // Pass unified selection handlers
    unifiedSelectionHandlers: (state.currentTool === 'select' || state.currentTool === 'select2') ? {
      selectionState: unifiedSelection.selectionState,
      deleteSelectedObjects: () => {
        if (unifiedSelection.selectionState.selectedObjects.length > 0 && deleteFunction) {
          deleteFunction(unifiedSelection.selectionState.selectedObjects);
          unifiedSelection.clearSelection();
        }
      },
      clearSelection: unifiedSelection.clearSelection
    } : undefined
  });

  // Calculate context menu position relative to the container with mobile support
  const getContextMenuPosition = (groupBounds: any) => {
    if (!groupBounds || !containerRef.current || !stageRef.current) {
      return { x: 0, y: 0 };
    }
    
    const container = containerRef.current;
    const stage = stageRef.current;
    
    // Get stage transform for coordinate conversion
    const stageTransform = stage.getAbsoluteTransform();
    
    // Calculate center of selection in world coordinates
    const selectionCenterWorld = {
      x: groupBounds.x + groupBounds.width / 2,
      y: groupBounds.y - 60 // 60px above selection
    };
    
    // Transform world coordinates to screen coordinates
    const screenPoint = stageTransform.point(selectionCenterWorld);
    
    // Get container bounds for boundary checking
    const containerRect = container.getBoundingClientRect();
    
    // Mobile-friendly positioning adjustments
    const isMobile = window.innerWidth < 768;
    const menuWidth = isMobile ? 250 : 200;
    const menuHeight = 60;
    
    // Calculate final position, ensuring it stays within container and viewport
    const finalPosition = {
      x: Math.max(10, Math.min(screenPoint.x - menuWidth / 2, containerRect.width - menuWidth - 10)),
      y: Math.max(10, Math.min(screenPoint.y, containerRect.height - menuHeight - 10))
    };
    
    return finalPosition;
  };

  // Handle delete for unified selection
  const handleUnifiedDelete = () => {
    debugLog('KonvaStage', 'Handle unified delete called');
    if (unifiedSelection.selectionState.selectedObjects.length > 0 && deleteFunction) {
      deleteFunction(unifiedSelection.selectionState.selectedObjects);
      unifiedSelection.clearSelection();
    }
  };

  // Handle image lock toggle for unified selection
  const handleUnifiedToggleLock = (imageIds: string[]) => {
    debugLog('KonvaStage', 'Handle unified toggle lock called', { imageIds });
    if ('toggleImageLock' in whiteboardState && whiteboardState.toggleImageLock) {
      imageIds.forEach(imageId => {
        whiteboardState.toggleImageLock(imageId);
      });
    }
  };

  // Context menu visibility logic - simplified
  const getContextMenuVisibility = () => {
    if ((state.currentTool !== 'select' && state.currentTool !== 'select2') || 
        unifiedSelection.selectionState.selectedObjects.length === 0 ||
        unifiedSelection.isDraggingObjects) {
      return { isVisible: false, menuPosition: { x: 0, y: 0 } };
    }

    // Calculate group bounds for context menu positioning
    const groupBounds = selection?.calculateSelectionBounds?.(
      unifiedSelection.selectionState.selectedObjects,
      state.lines,
      state.images
    );
    
    if (!groupBounds) {
      return { isVisible: false, menuPosition: { x: 0, y: 0 } };
    }
    
    const menuPosition = getContextMenuPosition(groupBounds);
    return { isVisible: true, menuPosition };
  };

  const { isVisible: contextMenuVisible, menuPosition } = getContextMenuVisibility();

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full select-none outline-none drawing-background relative" 
      style={{ 
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction,
        userSelect: 'none',
        pointerEvents: 'auto'
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        // Ensure keyboard events work for clipboard operations
        if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          // Let the keyboard handler deal with paste
        }
      }}
      data-whiteboard-id={whiteboardId}
    >
      <KonvaImageContextMenuHandler
        whiteboardState={whiteboardState}
        whiteboardId={whiteboardId}
      >
        <KonvaStageCanvas
          width={width}
          height={height}
          stageRef={stageRef}
          layerRef={layerRef}
          lines={state.lines}
          images={state.images}
          currentTool={state.currentTool}
          panZoomState={state.panZoomState}
          palmRejectionConfig={palmRejectionConfig}
          panZoom={panZoom}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          isReadOnly={isReadOnly}
          onStageClick={(e) => {
            const clickedOnEmpty = e.target === e.target.getStage();
            if (clickedOnEmpty) {
              if (state.currentTool === 'select' || state.currentTool === 'select2') {
                unifiedSelection.clearSelection();
              } else if (selection) {
                selection.clearSelection();
              }
            }
          }}
          selectionBounds={unifiedSelection.selectionState.selectionBounds}
          isSelecting={unifiedSelection.selectionState.isSelecting}
          selection={selection}
          onUpdateLine={updateLine}
          onUpdateImage={(imageId, updates) => {
            if ('updateImage' in whiteboardState && whiteboardState.updateImage) {
              whiteboardState.updateImage(imageId, updates);
            }
          }}
          onTransformEnd={() => {
            if ('addToHistory' in whiteboardState && whiteboardState.addToHistory) {
              whiteboardState.addToHistory();
            }
          }}
          normalizedState={normalizedState}
          // Use unified selection handlers when select tools are active
          unifiedSelectionHandlers={(state.currentTool === 'select' || state.currentTool === 'select2') ? {
            onMouseDown: unifiedSelection.handleMouseDown,
            onMouseMove: unifiedSelection.handleMouseMove,
            onMouseUp: unifiedSelection.handleMouseUp,
            onTouchStart: unifiedSelection.handleTouchStart,
            onTouchMove: unifiedSelection.handleTouchMove,
            onTouchEnd: unifiedSelection.handleTouchEnd
          } : undefined}
          extraContent={
            <>
              <KonvaImageOperationsHandler
                whiteboardState={whiteboardState}
                whiteboardId={whiteboardId}
              />
              {/* Unified selection renderer when select tools are active */}
              {(state.currentTool === 'select' || state.currentTool === 'select2') && (
                <UnifiedSelectionRenderer
                  selectionState={unifiedSelection.selectionState}
                  hoveredObjectId={unifiedSelection.hoveredObjectId}
                  lines={state.lines}
                  images={state.images}
                  onUpdateLine={updateLine}
                  onUpdateImage={(imageId, updates) => {
                    if ('updateImage' in whiteboardState && whiteboardState.updateImage) {
                      whiteboardState.updateImage(imageId, updates);
                    }
                  }}
                  onTransformEnd={() => {
                    if ('addToHistory' in whiteboardState && whiteboardState.addToHistory) {
                      whiteboardState.addToHistory();
                    }
                  }}
                  currentTool={state.currentTool}
                />
              )}
            </>
          }
        />
      </KonvaImageContextMenuHandler>

      {/* Unified Context Menu - DOM overlay positioned absolutely */}
      {contextMenuVisible && (
        <div
          className="absolute z-50"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            transform: 'translateX(-50%)', // Center horizontally
            pointerEvents: 'auto'
          }}
        >
          <SelectionContextMenu
            selectedObjects={unifiedSelection.selectionState.selectedObjects}
            groupBounds={selection?.calculateSelectionBounds?.(
              unifiedSelection.selectionState.selectedObjects,
              state.lines,
              state.images
            )}
            onDelete={handleUnifiedDelete}
            onToggleLock={handleUnifiedToggleLock}
            isVisible={true}
            images={state.images}
          />
        </div>
      )}
    </div>
  );
};

export default KonvaStage;
