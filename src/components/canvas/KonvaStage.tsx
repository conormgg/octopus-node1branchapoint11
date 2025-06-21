
import React, { useRef, useEffect } from 'react';
import Konva from 'konva';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import { useNormalizedWhiteboardState } from '@/hooks/performance/useNormalizedWhiteboardState';
// TABLET-FRIENDLY: Import new consolidated tablet hooks
import { useTabletEventHandling, TabletEventConfig } from '@/hooks/tablet';
import { useStageEventHandlers } from '@/hooks/useStageEventHandlers';
import { useKonvaKeyboardHandlers } from '@/hooks/canvas/useKonvaKeyboardHandlers';
import { useKonvaPanZoomSync } from '@/hooks/canvas/useKonvaPanZoomSync';
import KonvaStageCanvas from './KonvaStageCanvas';
import KonvaImageContextMenuHandler from './KonvaImageContextMenuHandler';
import KonvaImageOperationsHandler from './KonvaImageOperationsHandler';

/**
 * TABLET-FRIENDLY: Legacy palm rejection config interface for backward compatibility
 */
interface PalmRejectionConfig {
  maxContactSize: number;
  minPressure: number;
  palmTimeoutMs: number;
  clusterDistance: number;
  preferStylus: boolean;
  enabled: boolean;
}

interface KonvaStageProps {
  width: number;
  height: number;
  whiteboardState: ReturnType<typeof useWhiteboardState>;
  isReadOnly?: boolean;
  palmRejectionConfig?: PalmRejectionConfig;
  normalizedState?: ReturnType<typeof useNormalizedWhiteboardState>;
}

/**
 * TABLET-FRIENDLY: Main Konva stage component with comprehensive tablet support
 * @description Coordinates canvas rendering with optimized tablet event handling
 */
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
    updateLine
  } = whiteboardState;

  // TABLET-FRIENDLY: Get whiteboard ID for this instance with proper typing
  const whiteboardId: string = 'whiteboardId' in whiteboardState && typeof whiteboardState.whiteboardId === 'string' 
    ? whiteboardState.whiteboardId 
    : 'default';

  // TABLET-FRIENDLY: Convert legacy config to new tablet config format
  const tabletConfig: Partial<TabletEventConfig> = {
    palmRejectionEnabled: palmRejectionConfig.enabled,
    maxContactSize: palmRejectionConfig.maxContactSize,
    minPressure: palmRejectionConfig.minPressure,
    palmTimeoutMs: palmRejectionConfig.palmTimeoutMs,
    clusterDistance: palmRejectionConfig.clusterDistance,
    preferStylus: palmRejectionConfig.preferStylus,
    preventTextSelection: true,
    enableSafariOptimizations: true
  };

  // TABLET-FRIENDLY: Initialize consolidated tablet event handling
  const {
    palmRejection,
    config: finalTabletConfig,
    eventStrategy
  } = useTabletEventHandling({
    containerRef,
    stageRef,
    panZoomState: state.panZoomState,
    config: tabletConfig,
    panZoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isReadOnly
  });

  // TABLET-FRIENDLY: Add text selection prevention at DOM level
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // TABLET-FRIENDLY: Add event listeners to prevent text selection
    container.addEventListener('selectstart', preventSelection);
    container.addEventListener('dragstart', preventSelection);

    return () => {
      container.removeEventListener('selectstart', preventSelection);
      container.removeEventListener('dragstart', preventSelection);
    };
  }, []);

  // Use focused hooks for specific functionality
  useKonvaPanZoomSync({
    stageRef,
    panZoomState: state.panZoomState,
    currentTool: state.currentTool
  });

  useKonvaKeyboardHandlers({
    containerRef,
    whiteboardState,
    isReadOnly,
    whiteboardId
  });

  // TABLET-FRIENDLY: Set up all event handlers with new tablet-aware system
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

  // TABLET-FRIENDLY: Enhanced touch action for iPad stylus support
  const getTouchAction = () => {
    // Use 'none' for better stylus support when palm rejection is enabled
    if (finalTabletConfig.palmRejectionEnabled) {
      return 'none';
    }
    // Fall back to manipulation for better compatibility when palm rejection is disabled
    return 'manipulation';
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full select-none outline-none" 
      style={{ 
        // TABLET-FRIENDLY: Comprehensive touch and selection prevention
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: getTouchAction(),
        userSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        // TABLET-FRIENDLY: iPad-specific optimizations for stylus input
        WebkitTextSizeAdjust: 'none',
        WebkitFontSmoothing: 'antialiased'
      }}
      tabIndex={0}
      data-whiteboard-id={whiteboardId}
      // TABLET-FRIENDLY: Prevent default behaviors that interfere with drawing
      onPointerDown={(e) => e.preventDefault()}
      onMouseDown={(e) => e.preventDefault()}
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
          extraContent={
            <KonvaImageOperationsHandler
              whiteboardState={whiteboardState}
              whiteboardId={whiteboardId}
            />
          }
        />
      </KonvaImageContextMenuHandler>
    </div>
  );
};

export default KonvaStage;
