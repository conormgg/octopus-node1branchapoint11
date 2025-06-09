
import React, { useRef, useEffect, useState } from 'react';
import Konva from 'konva';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import { usePalmRejection } from '@/hooks/usePalmRejection';
import { useStageEventHandlers } from '@/hooks/useStageEventHandlers';
import KonvaStageCanvas from './KonvaStageCanvas';
import ImageRenderer from './ImageRenderer';

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
  }
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, selectShape] = useState<string | null>(null);

  const {
    state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePaste,
    addToHistory,
    panZoom,
    selection,
    updateLine,
    updateImage
  } = whiteboardState;

  // Get whiteboard ID for this instance
  const whiteboardId = 'whiteboardId' in whiteboardState ? whiteboardState.whiteboardId : undefined;

  const palmRejection = usePalmRejection(palmRejectionConfig);

  // Apply pan/zoom transformations to the stage
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.x(state.panZoomState.x);
    stage.y(state.panZoomState.y);
    stage.scaleX(state.panZoomState.scale);
    stage.scaleY(state.panZoomState.scale);
  }, [state.panZoomState]);

  // Store current tool on stage for access in event handlers
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    stage.setAttr('currentTool', state.currentTool);
  }, [state.currentTool]);

  // Add paste event listener and keyboard shortcuts with whiteboard-specific handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isReadOnly) return;

    const pasteHandler = (e: ClipboardEvent) => {
      console.log(`[${whiteboardId}] Paste event detected in container`);
      console.log(`[${whiteboardId}] Active element:`, document.activeElement);
      console.log(`[${whiteboardId}] Container:`, container);
      
      // Handle paste event - the event listener is already on the correct container
      handlePaste(e, stageRef.current);
    };

    const keyDownHandler = (e: KeyboardEvent) => {
      // Only handle keyboard events if this container is focused
      if (document.activeElement !== container && !container.contains(document.activeElement)) {
        return;
      }

      // Escape key - clear selection
      if (e.key === 'Escape' && selection?.clearSelection) {
        selection.clearSelection();
        e.preventDefault();
      }
      
      // Delete key - remove selected objects
      if ((e.key === 'Delete' || e.key === 'Backspace') && selection?.selectionState?.selectedObjects?.length > 0) {
        console.log(`[${whiteboardId}] Delete key pressed - selected objects:`, selection.selectionState.selectedObjects);
        
        // Check if whiteboardState has deleteSelectedObjects method
        if ('deleteSelectedObjects' in whiteboardState && typeof whiteboardState.deleteSelectedObjects === 'function') {
          whiteboardState.deleteSelectedObjects();
        }
        
        e.preventDefault();
      }
    };

    const focusHandler = () => {
      console.log(`[${whiteboardId}] Container focused, paste events should work`);
    };

    const clickHandler = (e: MouseEvent) => {
      // Ensure container can receive paste events
      if (container && e.target && container.contains(e.target as Node)) {
        container.focus();
        console.log(`[${whiteboardId}] Container clicked and focused for paste`);
      }
    };

    // Make container focusable and add event listeners
    const tabIndexValue =
      typeof whiteboardId === 'string'
        ? String(1000 + whiteboardId.charCodeAt(0))
        : '1000';
    container.setAttribute('tabIndex', tabIndexValue);
    container.setAttribute('id', `whiteboard-container-${whiteboardId || 'unknown'}`);
    container.style.outline = 'none'; // Remove focus outline
    container.addEventListener('paste', pasteHandler);
    container.addEventListener('keydown', keyDownHandler);
    container.addEventListener('focus', focusHandler);
    container.addEventListener('click', (e: MouseEvent) => {
      // Only focus this container, and log which one is being focused
      container.focus();
      setTimeout(() => {
        console.log(`[${whiteboardId}] Container clicked and focused for paste. document.activeElement.id:`, (document.activeElement as HTMLElement)?.id);
      }, 0);
    });

    // Don't auto-focus the container - only focus when explicitly clicked
    console.log(`[${whiteboardId}] Container setup complete for paste events and keyboard shortcuts`);

    return () => {
      container.removeEventListener('paste', pasteHandler);
      container.removeEventListener('keydown', keyDownHandler);
      container.removeEventListener('focus', focusHandler);
      container.removeEventListener('click', clickHandler);
    };
  }, [handlePaste, isReadOnly, selection, whiteboardId]);

  // Set up all event handlers
  useStageEventHandlers({
    containerRef,
    stageRef,
    panZoomState: state.panZoomState,
    palmRejection,
    palmRejectionConfig,
    panZoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isReadOnly
  });

  // Handle shape selection/deselection
  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  // Helper function to update image state - use the sync-enabled version
  const updateImageState = (imageId: string, newAttrs: any) => {
    // Always use the sync-enabled updateImage function if available
    if (updateImage) {
      updateImage(imageId, newAttrs);
    } else {
      console.log(`[${whiteboardId}] Image update requested but no updateImage available on the provided state object.`);
    }
  };

  // Helper function to update line state - use the sync-enabled version
  const updateLineState = (lineId: string, newAttrs: any) => {
    // Always use the sync-enabled updateLine function if available
    if (updateLine) {
      console.log(`[${whiteboardId}] Updating line ${lineId} with sync-enabled function:`, newAttrs);
      updateLine(lineId, newAttrs);
    } else {
      console.log(`[${whiteboardId}] Line update requested but no updateLine available on the provided state object.`);
    }
  };

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
      <KonvaStageCanvas
        width={width}
        height={height}
        stageRef={stageRef}
        layerRef={layerRef}
        lines={state.lines}
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
        onUpdateLine={updateLineState}
        extraContent={
          <>
            {state.images?.map((image) => (
              <ImageRenderer
                key={image.id}
                imageObject={image}
                isSelected={selection?.isObjectSelected(image.id) || false}
                isHovered={selection?.hoveredObjectId === image.id}
                onSelect={() => {
                  if (selection && state.currentTool === 'select') {
                    selection.selectObjects([{ id: image.id, type: 'image' }]);
                  }
                }}
                onChange={(newAttrs) => {
                  updateImageState(image.id, newAttrs);
                }}
                onUpdateState={() => {
                  if (addToHistory) {
                    addToHistory();
                  }
                }}
                currentTool={state.currentTool}
                onMouseEnter={state.currentTool === 'select' ? () => {
                  if (selection?.setHoveredObjectId) {
                    selection.setHoveredObjectId(image.id);
                  }
                } : undefined}
                onMouseLeave={state.currentTool === 'select' ? () => {
                  if (selection?.setHoveredObjectId) {
                    selection.setHoveredObjectId(null);
                  }
                } : undefined}
              />
            )) || null}
          </>
        }
      />
    </div>
  );
};

export default KonvaStage;
