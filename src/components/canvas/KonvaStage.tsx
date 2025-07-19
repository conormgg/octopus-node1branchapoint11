
import React, { useRef, useEffect, useCallback } from 'react';
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

  const {
    state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    panZoom,
    selection,
    updateLine,
    addToHistory
  } = whiteboardState;

  // Get whiteboard ID for this instance with proper typing
  const whiteboardId: string = 'whiteboardId' in whiteboardState && typeof whiteboardState.whiteboardId === 'string' 
    ? whiteboardState.whiteboardId 
    : 'default';

  const palmRejection = usePalmRejection(palmRejectionConfig);

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

  // Select2-specific delete function that mirrors the original logic
  const handleSelect2Delete = useCallback((selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => {
    if (!selectedObjects || selectedObjects.length === 0) return;

    // Get direct access to the state updater from whiteboardState
    // Since we can't access setState directly, we'll use the existing pattern
    // This mirrors exactly what deleteSelectedObjects does in useWhiteboardState
    
    // Filter the selected objects by type
    const selectedLineIds = selectedObjects
      .filter(obj => obj.type === 'line')
      .map(obj => obj.id);
    const selectedImageIds = selectedObjects
      .filter(obj => obj.type === 'image')
      .map(obj => obj.id);

    // We need to manually update the state since we can't access setState
    // This is a temporary workaround - the proper solution would be to expose a generic delete function
    if ('state' in whiteboardState && typeof whiteboardState.state === 'object') {
      // Create new arrays without the selected objects
      const newLines = state.lines.filter(line => !selectedLineIds.includes(line.id));
      const newImages = state.images.filter(image => !selectedImageIds.includes(image.id));
      
      // Update the state object directly (this is a hack but necessary)
      // @ts-ignore - We're bypassing the type system temporarily
      whiteboardState.state.lines = newLines;
      // @ts-ignore
      whiteboardState.state.images = newImages;
      
      // Force a re-render by triggering a state change
      // This is not ideal but works around the current architecture
      if (addToHistory) {
        addToHistory();
      }
    }

    console.log(`[${whiteboardId}] Select2 deleted ${selectedObjects.length} objects`);
  }, [state.lines, state.images, whiteboardId, addToHistory]);

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
    // Pass select2-specific delete function
    onDeleteObjects: handleSelect2Delete
  });

  useKonvaKeyboardHandlers({
    containerRef,
    whiteboardState,
    isReadOnly,
    whiteboardId,
    // Pass select2 handlers when select2 tool is active
    select2Handlers: state.currentTool === 'select2' && stageEventHandlers ? {
      select2State: stageEventHandlers.select2State,
      deleteSelectedObjects: stageEventHandlers.deleteSelectedObjects || (() => {})
    } : undefined
  });

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full select-none outline-none" 
      style={{ 
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: palmRejectionConfig.enabled ? 'manipulation' : 'auto'
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
            </>
          }
        />
      </KonvaImageContextMenuHandler>
    </div>
  );
};

export default KonvaStage;
