
import React, { useRef, useEffect, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer } from 'react-konva';
import { useStageEventHandlers } from '@/hooks/useStageEventHandlers';
import { useKonvaPanZoomSync } from '@/hooks/canvas/useKonvaPanZoomSync';
import { useKonvaKeyboardHandlers } from '@/hooks/canvas/useKonvaKeyboardHandlers';
import { useSelect2EventHandlers } from '@/hooks/useSelect2EventHandlers';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import { LinesLayer } from './layers/LinesLayer';
import { ImagesLayer } from './layers/ImagesLayer';
import { Select2Renderer } from './Select2Renderer';
import { SelectionRect } from './SelectionRect';
import { WhiteboardState } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('stage');

interface KonvaStageProps {
  stageRef: React.RefObject<Konva.Stage>;
  whiteboardState: ReturnType<typeof useWhiteboardState> | any;
  whiteboardId?: string;
  isReadOnly?: boolean;
  hasGlobalSelection?: boolean;
  onSelectionChange?: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  onClearSelection?: () => void;
  onSetSelectionBounds?: (bounds: any) => void;
  onSetIsSelecting?: (isSelecting: boolean) => void;
  onObjectUpdate?: (objectId: string, updates: any, objectType: 'line' | 'image') => void;
  onObjectDelete?: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  allowSelection?: boolean;
  onDoubleClick?: (e: any) => void;
  onPointerDown?: (worldX: number, worldY: number, ctrlKey: boolean) => void;
  onPointerMove?: (worldX: number, worldY: number) => void;
  onPointerUp?: () => void;
}

const KonvaStage: React.FC<KonvaStageProps> = ({
  stageRef,
  whiteboardState,
  whiteboardId,
  isReadOnly = false,
  hasGlobalSelection = false,
  onSelectionChange,
  onClearSelection,
  onSetSelectionBounds,
  onSetIsSelecting,
  onObjectUpdate,
  onObjectDelete,
  allowSelection = true,
  onDoubleClick,
  onPointerDown,
  onPointerMove,
  onPointerUp
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });

  debugLog('KonvaStage', 'Rendering', {
    whiteboardId,
    isReadOnly,
    hasGlobalSelection,
    allowSelection,
    linesCount: whiteboardState.state.lines.length,
    imagesCount: whiteboardState.state.images.length
  });

  // Extract state for cleaner access
  const { state } = whiteboardState;

  // Set up pan/zoom synchronization
  useKonvaPanZoomSync(stageRef, whiteboardState.panZoom);

  // Set up stage event handlers for drawing/panning
  const stageHandlers = useStageEventHandlers(
    stageRef,
    whiteboardState,
    isReadOnly,
    hasGlobalSelection,
    onDoubleClick,
    onPointerDown,
    onPointerMove,
    onPointerUp
  );

  // Set up select2 event handlers if selection is enabled
  const select2Handlers = useSelect2EventHandlers({
    stageRef,
    lines: state.lines,
    images: state.images,
    panZoomState: state.panZoomState,
    panZoom: whiteboardState.panZoom,
    onUpdateLine: whiteboardState.updateLine,
    onUpdateImage: whiteboardState.updateImage,
    onDeleteObjects: onObjectDelete, // Will be replaced with new delete system
    containerRef,
    mainSelection: hasGlobalSelection ? {
      selectObjects: onSelectionChange || (() => {}),
      clearSelection: onClearSelection || (() => {}),
      setSelectionBounds: onSetSelectionBounds || (() => {}),
      setIsSelecting: onSetIsSelecting || (() => {}),
      selectionState: {
        selectedObjects: [],
        isSelecting: false,
        selectionBounds: null
      }
    } : undefined
  });

  // Set up keyboard handlers (delete functionality will be replaced)
  useKonvaKeyboardHandlers({
    containerRef,
    whiteboardState,
    isReadOnly,
    whiteboardId,
    select2DeleteFunction: undefined, // Removed - will be replaced
    originalSelectDeleteFunction: undefined, // Removed - will be replaced
    select2Handlers
  });

  // Update stage dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setStageDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Determine which handlers to use based on current tool
  const shouldUseSelect2 = allowSelection && state.currentTool === 'select' && !isReadOnly;
  const eventHandlers = shouldUseSelect2 ? {
    onMouseDown: select2Handlers.handleMouseDown,
    onMouseMove: select2Handlers.handleMouseMove,
    onMouseUp: select2Handlers.handleMouseUp,
    onClick: select2Handlers.handleStageClick
  } : {
    onPointerDown: stageHandlers.handlePointerDown,
    onPointerMove: stageHandlers.handlePointerMove,
    onPointerUp: stageHandlers.handlePointerUp,
    onWheel: stageHandlers.handleWheel
  };

  debugLog('KonvaStage', 'Event handlers configured', {
    shouldUseSelect2,
    currentTool: state.currentTool,
    allowSelection,
    isReadOnly
  });

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{ 
        cursor: shouldUseSelect2 ? 'default' : 'inherit',
        touchAction: 'none'
      }}
    >
      <Stage
        ref={stageRef}
        width={stageDimensions.width}
        height={stageDimensions.height}
        scaleX={state.panZoomState.scale}
        scaleY={state.panZoomState.scale}
        x={state.panZoomState.x}
        y={state.panZoomState.y}
        {...eventHandlers}
      >
        <Layer>
          <LinesLayer 
            lines={state.lines} 
            hoveredObjectId={shouldUseSelect2 ? select2Handlers.select2State.hoveredObjectId : null}
            selectedObjectIds={shouldUseSelect2 ? select2Handlers.select2State.selectedObjects.map(obj => obj.id) : []}
          />
          <ImagesLayer 
            images={state.images}
            hoveredObjectId={shouldUseSelect2 ? select2Handlers.select2State.hoveredObjectId : null}
            selectedObjectIds={shouldUseSelect2 ? select2Handlers.select2State.selectedObjects.map(obj => obj.id) : []}
          />
          
          {shouldUseSelect2 && (
            <Select2Renderer
              select2State={select2Handlers.select2State}
              panZoomState={state.panZoomState}
            />
          )}
          
          {hasGlobalSelection && (
            <SelectionRect
              selectionBounds={null} // Will be managed by new system
              isSelecting={false} // Will be managed by new system
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default KonvaStage;
