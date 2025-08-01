import React, { useRef, useEffect, useCallback, useState } from 'react';
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
import SelectionGroup from './SelectionGroup';
import Select2ContextMenuHandler from './Select2ContextMenuHandler';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('toolSync');

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
  
  // Track transform state to prevent Select2 drag during transforms
  const [isTransformActive, setIsTransformActive] = useState(false);

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
  // Create unified delete function that works for both select and select2 tools
  const unifiedDeleteFunction = useCallback((selectedObjects?: Array<{id: string, type: 'line' | 'image'}>) => {
    // Use provided objects or get from selection state
    const objectsToDelete = selectedObjects || selection?.selectionState?.selectedObjects;
    
    if (!objectsToDelete || objectsToDelete.length === 0) return;

    // Check if this is a shared whiteboard and use operations function
    if ('operations' in whiteboardState && 
        whiteboardState.operations && 
        typeof whiteboardState.operations === 'object' && 
        'deleteSelectedObjects' in whiteboardState.operations &&
        typeof (whiteboardState.operations as any).deleteSelectedObjects === 'function') {
      (whiteboardState.operations as any).deleteSelectedObjects(objectsToDelete);
      selection?.clearSelection();
    } else if ('deleteSelectedObjects' in whiteboardState && typeof whiteboardState.deleteSelectedObjects === 'function') {
      whiteboardState.deleteSelectedObjects(objectsToDelete);
    } else {
      deleteSelectedObjects(objectsToDelete);
    }
  }, [whiteboardState, selection, deleteSelectedObjects]);

  debugLog('KonvaStage', 'Unified delete function initialized', {
    whiteboardId,
    hasOperations: 'operations' in whiteboardState,
    hasWhiteboardDelete: 'deleteSelectedObjects' in whiteboardState,
    hasSelection: !!selection
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
    // Pass unified delete function
    onDeleteObjects: unifiedDeleteFunction,
    mainSelection: selection // Pass main selection state for integration
  });

  useKonvaKeyboardHandlers({
    containerRef,
    whiteboardState,
    isReadOnly,
    whiteboardId,
    // Pass unified delete function
    unifiedDeleteFunction,
    // Pass select2 handlers when select2 tool is active
    select2Handlers: state.currentTool === 'select2' && stageEventHandlers ? {
      select2State: stageEventHandlers.select2State,
      deleteSelectedObjects: stageEventHandlers.deleteSelectedObjects || (() => {}),
      clearSelection: stageEventHandlers.clearSelect2Selection || (() => {})
    } : undefined
  });

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full select-none outline-none drawing-background" 
      style={{ 
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none' as any,
        touchAction,
        userSelect: 'none',
        pointerEvents: 'auto'
      } as React.CSSProperties}
      tabIndex={0}
      data-whiteboard-id={whiteboardId}
    >
      <Select2ContextMenuHandler
        selectedObjects={stageEventHandlers?.select2State?.selectedObjects || []}
        images={state.images}
        contextMenu={stageEventHandlers?.select2State?.contextMenu || { isVisible: false, x: 0, y: 0 }}
        onDeleteObjects={() => {
          if (stageEventHandlers?.select2MouseHandlers?.deleteSelectedObjects) {
            stageEventHandlers.select2MouseHandlers.deleteSelectedObjects();
          }
        }}
        onLockImages={() => {
          // Handle lock images
          const selectedImages = (stageEventHandlers?.select2State?.selectedObjects || [])
            .filter(obj => obj.type === 'image')
            .map(obj => state.images.find(img => img.id === obj.id))
            .filter(Boolean);
          
          selectedImages.forEach(image => {
            if (image && 'updateImage' in whiteboardState && whiteboardState.updateImage) {
              whiteboardState.updateImage(image.id, { locked: true });
            }
          });
        }}
        onUnlockImages={() => {
          // Handle unlock images
          const selectedImages = (stageEventHandlers?.select2State?.selectedObjects || [])
            .filter(obj => obj.type === 'image')
            .map(obj => state.images.find(img => img.id === obj.id))
            .filter(Boolean);
          
          selectedImages.forEach(image => {
            if (image && 'updateImage' in whiteboardState && whiteboardState.updateImage) {
              whiteboardState.updateImage(image.id, { locked: false });
            }
          });
        }}
        onHideContextMenu={() => {
          if (stageEventHandlers?.select2MouseHandlers?.hideContextMenu) {
            stageEventHandlers.select2MouseHandlers.hideContextMenu();
          }
        }}
        showContextMenu={() => {
          if (stageEventHandlers?.select2MouseHandlers?.showContextMenu) {
            stageEventHandlers.select2MouseHandlers.showContextMenu(containerRef);
          }
        }}
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
                  onTransformStateChange={setIsTransformActive}
                  currentTool={state.currentTool}
                  isVisible={!stageEventHandlers.select2State.isSelecting}
                />
              )}
            </>
          }
        />
      </KonvaImageContextMenuHandler>
      </Select2ContextMenuHandler>
    </div>
  );
};

export default KonvaStage;
