
import React, { useRef, useEffect, useState } from 'react';
import Konva from 'konva';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import { usePalmRejection } from '@/hooks/usePalmRejection';
import { useStageEventHandlers } from '@/hooks/useStageEventHandlers';
import KonvaStageCanvas from './KonvaStageCanvas';
import ImageRenderer from './ImageRenderer';
import LineRenderer from './LineRenderer';
import SelectionRect from './SelectionRect';

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
    clearSelection,
    selectObject,
    setTransforming,
    applyTransformation
  } = whiteboardState;

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

  // Add paste event listener with proper focus handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isReadOnly) return;

    const pasteHandler = (e: ClipboardEvent) => {
      console.log('Paste event detected in container');
      handlePaste(e, stageRef.current);
    };

    const focusHandler = () => {
      console.log('Container focused, paste events should work');
    };

    const clickHandler = () => {
      // Ensure container can receive paste events
      if (container) {
        container.focus();
        console.log('Container clicked and focused for paste');
      }
    };

    // Make container focusable and add event listeners
    container.setAttribute('tabIndex', '0');
    container.style.outline = 'none'; // Remove focus outline
    container.addEventListener('paste', pasteHandler);
    container.addEventListener('focus', focusHandler);
    container.addEventListener('click', clickHandler);

    // Focus the container initially to enable paste
    container.focus();
    console.log('Container setup complete for paste events');

    return () => {
      container.removeEventListener('paste', pasteHandler);
      container.removeEventListener('focus', focusHandler);
      container.removeEventListener('click', clickHandler);
    };
  }, [handlePaste, isReadOnly]);

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
    // Only handle deselection when in select mode
    if (state.currentTool !== 'select') return;
    
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      clearSelection();
      selectShape(null);
    }
  };

  // Helper function to update image state
  const updateImageState = (imageId: string, newAttrs: any) => {
    // Check if whiteboardState has updateImageState method (sync version)
    if ('updateImageState' in whiteboardState && typeof whiteboardState.updateImageState === 'function') {
      whiteboardState.updateImageState(imageId, newAttrs);
    } else {
      // Update the image directly in the state
      const updatedImages = state.images.map(img => 
        img.id === imageId ? { ...img, ...newAttrs } : img
      );
      
      // Update the state
      whiteboardState.setState((prev: any) => ({
        ...prev,
        images: updatedImages
      }));
      
      // Add to history after transformation is complete
      applyTransformation();
    }
  };
  
  // Helper function to update line state
  const updateLineState = (lineId: string, newAttrs: any) => {
    // Update the line directly in the state
    const updatedLines = state.lines.map(line => 
      line.id === lineId ? { ...line, ...newAttrs } : line
    );
    
    // Update the state
    whiteboardState.setState((prev: any) => ({
      ...prev,
      lines: updatedLines
    }));
    
    // Add to history after transformation is complete
    applyTransformation();
  };
  
  // Handle image selection
  const handleImageSelect = (id: string) => {
    if (state.currentTool === 'select') {
      selectObject(id);
      selectShape(id);
    }
  };
  
  // Handle line selection
  const handleLineSelect = (id: string) => {
    if (state.currentTool === 'select') {
      selectObject(id);
      selectShape(id);
    }
  };
  
  // Handle transformation start
  const handleTransformStart = () => {
    setTransforming(true);
  };
  
  // Handle transformation end
  const handleTransformEnd = () => {
    setTransforming(false);
    applyTransformation();
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
        onStageClick={checkDeselect}
        extraContent={
          <>
            {/* Selection Rectangle */}
            {state.currentTool === 'select' && state.selectionState.selectionRect && (
              <SelectionRect
                x1={state.selectionState.selectionRect.x1}
                y1={state.selectionState.selectionRect.y1}
                x2={state.selectionState.selectionRect.x2}
                y2={state.selectionState.selectionRect.y2}
              />
            )}
            
            {/* Lines */}
            {state.lines.map((line) => (
              <LineRenderer
                key={line.id}
                line={line}
                isSelected={state.currentTool === 'select' && state.selectionState.selectedIds.includes(line.id)}
                onSelect={() => handleLineSelect(line.id)}
                onChange={(newAttrs) => updateLineState(line.id, newAttrs)}
                onUpdateState={handleTransformEnd}
                onTransformStart={handleTransformStart}
              />
            ))}
            
            {/* Images */}
            {state.images?.map((image) => (
              <ImageRenderer
                key={image.id}
                imageObject={image}
                isSelected={state.currentTool === 'select' && state.selectionState.selectedIds.includes(image.id)}
                onSelect={() => handleImageSelect(image.id)}
                onChange={(newAttrs) => updateImageState(image.id, newAttrs)}
                onUpdateState={handleTransformEnd}
                onTransformStart={handleTransformStart}
              />
            )) || null}
          </>
        }
      />
    </div>
  );
};

export default KonvaStage;
