
import React, { useRef, useEffect } from 'react';
import Konva from 'konva';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import { useNormalizedWhiteboardState } from '@/hooks/performance/useNormalizedWhiteboardState';
import { usePalmRejection } from '@/hooks/usePalmRejection';
import { useStageEventHandlers } from '@/hooks/useStageEventHandlers';
import { useKonvaKeyboardHandlers } from '@/hooks/canvas/useKonvaKeyboardHandlers';
import { useKonvaPanZoomSync } from '@/hooks/canvas/useKonvaPanZoomSync';
import KonvaStageCanvas from './KonvaStageCanvas';
import KonvaImageContextMenuHandler from './KonvaImageContextMenuHandler';
import KonvaImageOperationsHandler from './KonvaImageOperationsHandler';
import { Select2Renderer } from './Select2Renderer';
import { SelectionContextMenu } from './SelectionContextMenu';
import SelectionGroup from './SelectionGroup';
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

  // Determine the correct delete functions to use
  // Check if this is a shared whiteboard (has operations property) vs regular whiteboard
  const hasSharedOperations = 'operations' in whiteboardState && 
    whiteboardState.operations && 
    typeof whiteboardState.operations === 'object' && 
    'deleteSelectedObjects' in whiteboardState.operations &&
    typeof (whiteboardState.operations as any).deleteSelectedObjects === 'function';

  // For select2: use the real implementation that accepts parameters
  const select2DeleteFunction = hasSharedOperations 
    ? (whiteboardState.operations as any).deleteSelectedObjects 
    : ('deleteSelectedObjects' in whiteboardState && typeof whiteboardState.deleteSelectedObjects === 'function' 
       ? (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => whiteboardState.deleteSelectedObjects(selectedObjects)
       : deleteSelectedObjects);

  // For original select: use the wrapper that reads from selection state
  const originalSelectDeleteFunction = hasSharedOperations 
    ? deleteSelectedObjects  // This is the wrapper in shared whiteboards
    : ('deleteSelectedObjects' in whiteboardState && typeof whiteboardState.deleteSelectedObjects === 'function' 
       ? whiteboardState.deleteSelectedObjects 
       : deleteSelectedObjects);

  debugLog('KonvaStage', 'Delete function selection', {
    whiteboardId,
    hasOperations: 'operations' in whiteboardState,
    hasSharedDelete: hasSharedOperations,
    usingSharedDelete: hasSharedOperations,
    select2DeleteFunction: select2DeleteFunction ? 'available' : 'none',
    originalSelectDeleteFunction: originalSelectDeleteFunction ? 'available' : 'none'
  });

  // Set up all event handlers with proper update functions for select2
  const stageEventHandlers = useStageEventHandlers({
    containerRef,
    stageRef,
    panZoomState: state.panZoomState,
    palmRejection,
    palmRejectionConfig,
    panZoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isReadOnly,
    currentTool: state.currentTool,
    lines: state.lines,
    images: state.images,
    // Pass update functions for select2 object movement
    onUpdateLine: updateLine,
    onUpdateImage: 'updateImage' in whiteboardState && whiteboardState.updateImage ? whiteboardState.updateImage : undefined,
    // Pass the select2 delete function (accepts parameters)
    onDeleteObjects: select2DeleteFunction,
    // Pass the original select delete function (wrapper, no parameters)
    onDeleteObjectsNoParams: originalSelectDeleteFunction,
    mainSelection: selection // Pass main selection state for integration
  });

  useKonvaKeyboardHandlers({
    containerRef,
    whiteboardState,
    isReadOnly,
    whiteboardId,
    // Pass both delete functions
    select2DeleteFunction,
    originalSelectDeleteFunction,
    // Pass select2 handlers when select2 tool is active
    select2Handlers: state.currentTool === 'select2' && stageEventHandlers ? {
      select2State: stageEventHandlers.select2State,
      deleteSelectedObjects: stageEventHandlers.deleteSelectedObjects || (() => {}),
      clearSelection: stageEventHandlers.clearSelect2Selection || (() => {})
    } : undefined
  });

  // Calculate context menu position relative to the container
  const getContextMenuPosition = (groupBounds: any) => {
    if (!groupBounds || !containerRef.current || !stageRef.current) {
      debugLog('KonvaStage', 'Missing refs for context menu positioning', {
        hasGroupBounds: !!groupBounds,
        hasContainer: !!containerRef.current,
        hasStage: !!stageRef.current
      });
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
    
    // Calculate final position, ensuring it stays within container
    const finalPosition = {
      x: Math.max(10, Math.min(screenPoint.x, containerRect.width - 200)), // Keep menu within bounds
      y: Math.max(10, screenPoint.y) // Don't go above container
    };
    
    debugLog('KonvaStage', 'Context menu position calculation', {
      groupBounds,
      selectionCenterWorld,
      screenPoint,
      containerWidth: containerRect.width,
      finalPosition
    });
    
    return finalPosition;
  };

  // Handle delete for select2
  const handleSelect2Delete = () => {
    debugLog('KonvaStage', 'Handle select2 delete called');
    if (stageEventHandlers && stageEventHandlers.select2State && stageEventHandlers.deleteSelectedObjects) {
      stageEventHandlers.deleteSelectedObjects();
    }
  };

  // Handle image lock toggle for select2
  const handleSelect2ToggleLock = (imageIds: string[]) => {
    debugLog('KonvaStage', 'Handle select2 toggle lock called', { imageIds });
    if ('toggleImageLock' in whiteboardState && whiteboardState.toggleImageLock) {
      imageIds.forEach(imageId => {
        whiteboardState.toggleImageLock(imageId);
      });
    }
  };

  // Improved context menu visibility logic with debugging
  const getContextMenuVisibility = () => {
    if (state.currentTool !== 'select2' || !stageEventHandlers || !stageEventHandlers.select2State) {
      debugLog('KonvaStage', 'Context menu hidden - not select2 tool or no handlers', {
        currentTool: state.currentTool,
        hasHandlers: !!stageEventHandlers,
        hasSelect2State: !!(stageEventHandlers && stageEventHandlers.select2State)
      });
      return { isVisible: false, menuPosition: { x: 0, y: 0 } };
    }

    const { selectedObjects, groupBounds, isDraggingObjects, isSelecting } = stageEventHandlers.select2State;
    
    // Context menu should be visible when:
    // 1. Objects are selected
    // 2. Not currently dragging objects
    // 3. Not currently doing drag selection
    // 4. Has valid group bounds
    const isVisible = selectedObjects.length > 0 && 
                     !isDraggingObjects && 
                     !isSelecting && 
                     !!groupBounds;
    
    debugLog('KonvaStage', 'Context menu visibility check', {
      selectedCount: selectedObjects.length,
      hasGroupBounds: !!groupBounds,
      isDraggingObjects,
      isSelecting,
      isVisible,
      groupBounds
    });
    
    if (!isVisible || !groupBounds) {
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
            if (clickedOnEmpty && selection) {
              selection.clearSelection();
            }
          }}
          selectionBounds={selection?.selectionState?.selectionBounds || null}
          isSelecting={selection?.selectionState?.isSelecting || false}
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
          select2MouseHandlers={state.currentTool === 'select2' && stageEventHandlers ? stageEventHandlers.select2MouseHandlers : undefined}
          select2TouchHandlers={state.currentTool === 'select2' && stageEventHandlers ? {
            onTouchStart: stageEventHandlers.select2TouchHandlers?.onTouchStart || (() => {}),
            onTouchMove: stageEventHandlers.select2TouchHandlers?.onTouchMove || (() => {}),
            onTouchEnd: stageEventHandlers.select2TouchHandlers?.onTouchEnd || (() => {})
          } : undefined}
          extraContent={
            <>
              <KonvaImageOperationsHandler
                whiteboardState={whiteboardState}
                whiteboardId={whiteboardId}
              />
              {/* Select2 overlay when select2 tool is active */}
              {state.currentTool === 'select2' && stageEventHandlers && (
                <Select2Renderer
                  selectedObjects={stageEventHandlers.select2State?.selectedObjects || []}
                  hoveredObjectId={stageEventHandlers.select2State?.hoveredObjectId || null}
                  selectionBounds={stageEventHandlers.select2State?.selectionBounds || null}
                  isSelecting={stageEventHandlers.select2State?.isSelecting || false}
                  groupBounds={stageEventHandlers.select2State?.groupBounds || null}
                  lines={state.lines}
                  images={state.images}
                  dragOffset={stageEventHandlers.select2State?.dragOffset || null}
                  isDraggingObjects={stageEventHandlers.select2State?.isDraggingObjects || false}
                />
              )}
              {/* SelectionGroup for select2 - show transform handles when objects are selected and not selecting */}
              {state.currentTool === 'select2' && stageEventHandlers && stageEventHandlers.select2State && (
                <SelectionGroup
                  selectedObjects={stageEventHandlers.select2State.selectedObjects}
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
                  isVisible={!stageEventHandlers.select2State.isSelecting}
                />
              )}
            </>
          }
        />
      </KonvaImageContextMenuHandler>

      {/* Select2 Context Menu - DOM overlay positioned absolutely */}
      {contextMenuVisible && stageEventHandlers && stageEventHandlers.select2State && (
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
            selectedObjects={stageEventHandlers.select2State.selectedObjects}
            groupBounds={stageEventHandlers.select2State.groupBounds}
            onDelete={handleSelect2Delete}
            onToggleLock={handleSelect2ToggleLock}
            isVisible={true}
            images={state.images}
          />
        </div>
      )}
    </div>
  );
};

export default KonvaStage;
