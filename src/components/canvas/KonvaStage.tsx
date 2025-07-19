
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
    deleteSelectedObjects
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
    // Pass selection for select2 integration
    selection: selection
  });

  useKonvaKeyboardHandlers({
    containerRef,
    whiteboardState,
    isReadOnly,
    whiteboardId,
    // Pass both delete functions
    select2DeleteFunction,
    originalSelectDeleteFunction,
    // Pass select2 handlers when select2 tool is active - now uses main selection state
    select2Handlers: state.currentTool === 'select2' && stageEventHandlers ? {
      select2State: stageEventHandlers.select2State,
      deleteSelectedObjects: stageEventHandlers.deleteSelectedObjects || (() => {}),
      clearSelection: stageEventHandlers.clearSelect2Selection || (() => {})
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
              {/* No longer render Select2Renderer - main selection system handles all visual feedback */}
            </>
          }
        />
      </KonvaImageContextMenuHandler>
    </div>
  );
};

export default KonvaStage;
