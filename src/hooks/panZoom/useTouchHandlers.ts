
import { useCallback, useRef, useState } from 'react';
import { toast } from '../use-toast';
import { coordinateBuffer, maybeShowConsolidatedToast } from '../coordinateDebugBuffer';

// Debug flag to show zoom center visualization
const SHOW_ZOOM_CENTER_DEBUG = true;

export const useTouchHandlers = (
  panHandlers: any,
  zoom: (factor: number, centerX?: number, centerY?: number) => void,
  panZoomState: any,
  setPanZoomState: (state: any) => void,
  containerRef?: React.RefObject<HTMLElement>,
  stageRef?: React.RefObject<any>, // Accept Konva.Stage ref for correct coordinate mapping
  getRelativePointerPosition?: (stage: any, clientX: number, clientY: number) => { x: number; y: number },
  logDebugCoordinates?: (payload: any) => void // Optional debug logger
) => {
  // Wrapper around zoom function to capture actual focal point
  const zoomWithTracking = useCallback((factor: number, centerX?: number, centerY?: number) => {
    // Track the actual focal point being used
    if (SHOW_ZOOM_CENTER_DEBUG && centerX !== undefined && centerY !== undefined) {
      setActualZoomFocalPoint({ x: centerX, y: centerY });
    }
    return zoom(factor, centerX, centerY);
  }, [zoom]);

  // Debug state for center point visualization
  const [debugCenterPoint, setDebugCenterPoint] = useState<{ x: number; y: number } | null>(null);
  const [actualZoomFocalPoint, setActualZoomFocalPoint] = useState<{ x: number; y: number } | null>(null);
  // Debug state for finger positions (for troubleshooting)
  const [debugFingerPoints, setDebugFingerPoints] = useState<{ x: number; y: number }[] | null>(null);
  // Debug state for captured drawing coordinates (simulates what drawing would produce)
  const [debugDrawingCoordinates, setDebugDrawingCoordinates] = useState<{ x: number; y: number }[] | null>(null);

  // Track touch state for pinch-to-zoom
  const touchStateRef = useRef<{
    lastDistance: number;
    lastCenter: { x: number; y: number };
  }>({
    lastDistance: 0,
    lastCenter: { x: 0, y: 0 }
  });

  const getTouchDistance = useCallback((touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Use the same coordinate calculation approach as drawing system
  const getTouchCenter = useCallback((touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;
    
    // Use stage container for consistency with drawing system
    if (stageRef?.current && typeof stageRef.current.container === 'function') {
      const rect = stageRef.current.container().getBoundingClientRect();
      return {
        x: centerX - rect.left,
        y: centerY - rect.top
      };
    }
    
    return { x: centerX, y: centerY };
  }, [stageRef]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    console.log('[TouchHandlers] Touch start with', e.touches.length, 'touches');
    
    // Only handle multi-touch gestures (2+ fingers)
    if (e.touches.length >= 2) {
      panHandlers.setIsGestureActiveState(true);
      
      const center = getTouchCenter(e.touches);
      
      // Initialize touch state
      touchStateRef.current.lastDistance = getTouchDistance(e.touches);
      touchStateRef.current.lastCenter = center;
      
      // Start pan tracking at the center point
      panHandlers.startPan(center.x, center.y);
      
      console.log('[TouchHandlers] Touch start center:', center);
    }
  }, [getTouchDistance, getTouchCenter, panHandlers]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    console.log('[TouchHandlers] [DEBUG] handleTouchMove called', e.touches.length, 'touches', e);
    
    // Only handle multi-touch gestures
    if (e.touches.length >= 2) {
      const currentDistance = getTouchDistance(e.touches);
      const currentCenter = getTouchCenter(e.touches);

      // Collect all four coordinate systems for each finger
      let debugCoords: any[] = [];
      let rect: DOMRect | null = null;
      if (stageRef?.current && typeof stageRef.current.container === 'function') {
        rect = stageRef.current.container().getBoundingClientRect();
      }
      for (let i = 0; i < 2; i++) {
        const touch = e.touches[i];
        // Screen (client) coordinates
        const screen = { x: touch.clientX, y: touch.clientY };
        // Viewport (container) coordinates
        const viewport = rect
          ? { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
          : { x: touch.clientX, y: touch.clientY };
        // World coordinates (drawing/canvas space)
        let world = viewport;
        if (getRelativePointerPosition && stageRef?.current) {
          world = getRelativePointerPosition(stageRef.current, touch.clientX, touch.clientY);
        }
        // Local coordinates (for a shape, not available here, so set to null)
        const local = null;
        debugCoords.push({ screen, viewport, world, local });
      }
      // Optionally send debug coordinates to teacher view
      if (typeof logDebugCoordinates === 'function') {
        logDebugCoordinates({
          type: 'pinch',
          touches: debugCoords,
          timestamp: Date.now()
        });
      }
      // Store in buffer for consolidated toast
      if (!coordinateBuffer.pinch) {
        coordinateBuffer.pinch = [debugCoords[0], debugCoords[1]];
      }
      maybeShowConsolidatedToast();

      // Get both finger positions using the same transformation as drawing logic
      let fingerPoints: { x: number; y: number }[] = [];
      if (getRelativePointerPosition && stageRef?.current) {
        // Use the exact same coordinate transformation as drawing
        fingerPoints = [
          getRelativePointerPosition(stageRef.current, e.touches[0].clientX, e.touches[0].clientY),
          getRelativePointerPosition(stageRef.current, e.touches[1].clientX, e.touches[1].clientY)
        ];
      } else if (rect) {
        // Use stage container coordinates (same as drawing system)
        fingerPoints = [
          { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top },
          { x: e.touches[1].clientX - rect.left, y: e.touches[1].clientY - rect.top }
        ];
      } else {
        // If no stage available, skip debug rendering to avoid coordinate mismatch
        console.warn('[TouchHandlers] No stage container available, skipping debug finger points');
        fingerPoints = [];
      }

      const { lastDistance, lastCenter } = touchStateRef.current;

      if (lastDistance > 0) {
        // Calculate zoom factor with threshold to prevent micro-movements
        const zoomFactor = currentDistance / lastDistance;
        const zoomThreshold = 0.02; // Only zoom if change is significant

        // Calculate pan delta from center movement
        const panDeltaX = currentCenter.x - lastCenter.x;
        const panDeltaY = currentCenter.y - lastCenter.y;
        const panThreshold = 2; // Minimum movement in pixels

        // Only update if there's meaningful change
        const shouldZoom = Math.abs(zoomFactor - 1) > zoomThreshold;
        const shouldPan = Math.abs(panDeltaX) > panThreshold || Math.abs(panDeltaY) > panThreshold;

        if (shouldZoom) {
          console.log('[TouchHandlers] Zooming with factor:', zoomFactor, 'at center:', currentCenter);
          // Use the same coordinate system as mouse wheel events
          zoomWithTracking(zoomFactor, currentCenter.x, currentCenter.y);
        }

        if (shouldPan) {
          // Apply pan transformation
          panHandlers.continuePan(currentCenter.x, currentCenter.y);
        }

        // Update debug center point and finger points if enabled
        if (SHOW_ZOOM_CENTER_DEBUG) {
          setDebugCenterPoint(currentCenter);
          setDebugFingerPoints(fingerPoints);
          // Also capture what the drawing coordinates would be
          setDebugDrawingCoordinates(fingerPoints);
        }
      } else {
        // Still update finger points for initial two-finger placement (only if we have valid coordinates)
        if (SHOW_ZOOM_CENTER_DEBUG && fingerPoints.length > 0) {
          setDebugFingerPoints(fingerPoints);
          // Also capture what the drawing coordinates would be
          setDebugDrawingCoordinates(fingerPoints);
        }
      }

      // Update state for next iteration
      touchStateRef.current.lastDistance = currentDistance;
      touchStateRef.current.lastCenter = currentCenter;
    }
  }, [getTouchDistance, getTouchCenter, zoomWithTracking, panHandlers]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    console.log('[TouchHandlers] Touch end with', e.touches.length, 'remaining touches');
    
    // Reset gesture state when no touches remain
    if (e.touches.length === 0) {
      panHandlers.setIsGestureActiveState(false);
      panHandlers.stopPan();
      touchStateRef.current.lastDistance = 0;
      // Do NOT clear debug state, so the last dots/crosshair remain for screenshotting
      // (If you want to clear, you can add a manual button or timeout later)
    } else if (e.touches.length === 1) {
      // When going from multi-touch to single touch, stop gesture
      panHandlers.setIsGestureActiveState(false);
      panHandlers.stopPan();
      touchStateRef.current.lastDistance = 0;
      // Do NOT clear debug state, so the last dots/crosshair remain for screenshotting
    }
  }, [panHandlers]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    debugCenterPoint: SHOW_ZOOM_CENTER_DEBUG ? debugCenterPoint : null,
    actualZoomFocalPoint: SHOW_ZOOM_CENTER_DEBUG ? actualZoomFocalPoint : null,
    debugFingerPoints: SHOW_ZOOM_CENTER_DEBUG ? debugFingerPoints : null,
    debugDrawingCoordinates: SHOW_ZOOM_CENTER_DEBUG ? debugDrawingCoordinates : null
  };
};
