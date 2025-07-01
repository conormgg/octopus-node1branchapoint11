
import { useMemo } from 'react';
import { PanZoomState } from '@/types/whiteboard';
import { usePanZoomCore } from './panZoom/usePanZoomCore';
import { usePanState } from './panZoom/usePanState';
import { useTouchHandlers } from './panZoom/useTouchHandlers';

export const usePanZoom = (
  panZoomState: PanZoomState,
  setPanZoomState: (state: PanZoomState) => void,
  containerRef?: React.RefObject<HTMLElement>,
  stageRef?: React.RefObject<any>,
  getRelativePointerPosition?: (stage: any, clientX: number, clientY: number) => { x: number; y: number },
  logDebugCoordinates?: (payload: any) => void
) => {
  // Core zoom and centering functionality
  const { zoom, handleWheel, centerOnBounds } = usePanZoomCore(panZoomState, setPanZoomState);
  
  // Pan state management
  const panHandlers = usePanState(panZoomState, setPanZoomState);
  
  // Touch event handlers with the correct container reference for coordinate calculations
  const touchHandlers = useTouchHandlers(
    panHandlers, 
    zoom, 
    panZoomState, 
    setPanZoomState, 
    containerRef, // This should be the outermost container that defines the coordinate space
    stageRef, // Pass stage ref for correct coordinate mapping
    getRelativePointerPosition, // Pass the coordinate transformation function
    logDebugCoordinates // Pass debug logger
  );

  // Wrap the return object in useMemo to stabilize its reference
  return useMemo(() => ({
    startPan: panHandlers.startPan,
    continuePan: panHandlers.continuePan,
    stopPan: panHandlers.stopPan,
    zoom,
    handleWheel,
    handleTouchStart: touchHandlers.handleTouchStart,
    handleTouchMove: touchHandlers.handleTouchMove,
    handleTouchEnd: touchHandlers.handleTouchEnd,
    isGestureActive: panHandlers.isGestureActive,
    centerOnBounds,
    debugCenterPoint: touchHandlers.debugCenterPoint,
    actualZoomFocalPoint: touchHandlers.actualZoomFocalPoint,
    debugFingerPoints: touchHandlers.debugFingerPoints,
    debugDrawingCoordinates: touchHandlers.debugDrawingCoordinates
  }), [
    panHandlers.startPan,
    panHandlers.continuePan,
    panHandlers.stopPan,
    zoom,
    handleWheel,
    touchHandlers.handleTouchStart,
    touchHandlers.handleTouchMove,
    touchHandlers.handleTouchEnd,
    panHandlers.isGestureActive,
    centerOnBounds,
    touchHandlers.debugCenterPoint,
    touchHandlers.actualZoomFocalPoint,
    touchHandlers.debugFingerPoints,
    touchHandlers.debugDrawingCoordinates
  ]);
};
