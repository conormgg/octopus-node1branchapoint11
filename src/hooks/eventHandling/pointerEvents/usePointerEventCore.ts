import { useCallback, useMemo, useRef } from 'react';
import Konva from 'konva';
import { usePalmRejection } from '../../usePalmRejection';
import { useStageCoordinates } from '../../useStageCoordinates';
import { PanZoomState } from '@/types/whiteboard';
import { useMemoizedEventHandlers } from '@/hooks/performance/useMemoizedEventHandlers';

interface UsePointerEventCoreProps {
  stageRef: React.RefObject<Konva.Stage>;
  panZoomState: PanZoomState;
  palmRejection: ReturnType<typeof usePalmRejection>;
  palmRejectionConfig: {
    enabled: boolean;
  };
  panZoom: {
    startPan: (x: number, y: number) => void;
    continuePan: (x: number, y: number) => void;
    stopPan: () => void;
    zoom: (factor: number, centerX?: number, centerY?: number) => void;
  };
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  isReadOnly: boolean;
  currentToolRef: React.RefObject<string>;
  logEventHandling: (eventType: string, source: 'pointer' | 'touch' | 'mouse', detail?: Record<string, unknown>) => void;
  selection: any; // FIXED: Add selection object
}

export const usePointerEventCore = ({
  stageRef,
  panZoomState,
  palmRejection,
  palmRejectionConfig,
  panZoom,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly,
  currentToolRef,
  logEventHandling,
  selection // FIXED: Accept selection
}: UsePointerEventCoreProps) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  // Track active pointers for multi-touch gestures
  const activePointersRef = useRef<Map<number, PointerEvent>>(new Map());
  const gestureStateRef = useRef<{
    isMultiTouch: boolean;
    lastDistance: number;
    lastCenter: { x: number; y: number };
    isPanning: boolean;
    isDrawing: boolean;
  }>({
    isMultiTouch: false,
    lastDistance: 0,
    lastCenter: { x: 0, y: 0 },
    isPanning: false,
    isDrawing: false
  });

  // Memoize stable values to prevent unnecessary re-renders
  const stablePalmRejectionEnabled = useMemo(() => palmRejectionConfig.enabled, [palmRejectionConfig.enabled]);
  const stableIsReadOnly = useMemo(() => isReadOnly, [isReadOnly]);

  // Add document-level text selection prevention during drawing
  const preventTextSelection = useCallback(() => {
    const preventSelection = (e: Event) => e.preventDefault();
    const preventDragStart = (e: Event) => e.preventDefault();
    
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('dragstart', preventDragStart);
    
    return () => {
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('dragstart', preventDragStart);
    };
  }, []);

  // Helper function to calculate distance between two pointers
  const calculateDistance = useCallback((pointer1: PointerEvent, pointer2: PointerEvent) => {
    const dx = pointer1.clientX - pointer2.clientX;
    const dy = pointer1.clientY - pointer2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Helper function to calculate center point between two pointers
  const calculateCenter = useCallback((pointer1: PointerEvent, pointer2: PointerEvent) => {
    return {
      x: (pointer1.clientX + pointer2.clientX) / 2,
      y: (pointer1.clientY + pointer2.clientY) / 2
    };
  }, []);

  // Helper function to determine if we should handle drawing for this event
  const shouldHandleDrawing = useCallback((event: PointerEvent) => {
    // Don't handle drawing during multi-touch gestures
    if (gestureStateRef.current.isMultiTouch) {
      return false;
    }

    // Always handle stylus/pen input for drawing tools
    if (event.pointerType === 'pen') {
      const tool = currentToolRef.current;
      return tool === 'pencil' || tool === 'highlighter' || tool === 'eraser' || tool === 'select';
    }
    
    // For finger touches, only allow drawing if palm rejection allows it
    return !stableIsReadOnly && (!stablePalmRejectionEnabled || palmRejection.shouldProcessPointer(event));
  }, [currentToolRef, stableIsReadOnly, stablePalmRejectionEnabled, palmRejection]);

  // Helper function to determine if we should handle panning
  const shouldHandlePanning = useCallback((event: PointerEvent) => {
    // Right-click always triggers panning regardless of tool or read-only state
    if (event.button === 2 || event.buttons === 2) {
      return true;
    }
    
    // For stylus/pen input, only allow panning if not using a drawing tool
    if (event.pointerType === 'pen') {
      const tool = currentToolRef.current;
      return tool !== 'pencil' && tool !== 'highlighter' && tool !== 'eraser';
    }
    
    // For finger touches, allow single-touch panning when not drawing
    if (event.pointerType === 'touch') {
      // Allow panning for finger touches, but not if we're in a drawing tool and palm rejection would allow drawing
      const tool = currentToolRef.current;
      const isDrawingTool = tool === 'pencil' || tool === 'highlighter' || tool === 'eraser';
      
      if (isDrawingTool && !stableIsReadOnly) {
        // If it's a drawing tool and we could draw, don't pan
        return !(!stablePalmRejectionEnabled || palmRejection.shouldProcessPointer(event));
      }
      
      // Otherwise, allow panning for finger touches
      return true;
    }
    
    return false;
  }, [currentToolRef, stableIsReadOnly, stablePalmRejectionEnabled, palmRejection]);

  // FIXED: Helper function to check if we clicked on a Konva shape
  const isClickOnKonvaShape = useCallback((event: PointerEvent) => {
    const stage = stageRef.current;
    if (!stage) return false;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return false;
    
    const intersected = stage.getIntersection(pointerPos);
    // FIXED: Check if we have an intersection and it's not the stage background
    return intersected !== null && intersected !== stage;
  }, [stageRef]);

  // Use memoized event handlers for better performance
  const handlers = useMemoizedEventHandlers({
    handlePointerDownEvent: {
      handler: (e: PointerEvent) => {
        const stage = stageRef.current;
        if (!stage) return;

        // ALWAYS prevent default to stop text selection and other browser behaviors
        e.preventDefault();

        logEventHandling('pointerdown', 'pointer', { 
          pointerId: e.pointerId, 
          pointerType: e.pointerType,
          pressure: e.pressure,
          button: e.button,
          activePointers: activePointersRef.current.size
        });

        // Add to active pointers
        activePointersRef.current.set(e.pointerId, e);
        
        // Check if this is now a multi-touch gesture
        const isMultiTouch = activePointersRef.current.size > 1;
        gestureStateRef.current.isMultiTouch = isMultiTouch;

        if (isMultiTouch) {
          // Handle multi-touch pinch-to-zoom setup
          const pointers = Array.from(activePointersRef.current.values());
          if (pointers.length === 2) {
            const [pointer1, pointer2] = pointers;
            gestureStateRef.current.lastDistance = calculateDistance(pointer1, pointer2);
            gestureStateRef.current.lastCenter = calculateCenter(pointer1, pointer2);
          }
          return;
        }
        
        // Handle right-click pan - works for everyone, including read-only users
        if (shouldHandlePanning(e)) {
          gestureStateRef.current.isPanning = true;
          panZoom.startPan(e.clientX, e.clientY);
          return;
        }
        
        // FIXED: Special handling for select tool to preserve selection behavior
        if (currentToolRef.current === 'select' && selection) {
          const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
          
          // Check if clicking within existing selection bounds
          const isInSelectionBounds = selection.isPointInSelectionBounds && selection.isPointInSelectionBounds({ x, y });
          
          if (isInSelectionBounds && selection.selectionState?.selectedObjects?.length > 0) {
            // Clicking within selection bounds - allow group dragging without clearing selection
            // Don't call handlePointerDown here as it would interfere with selection logic
            return;
          }
          
          // Check if we clicked on a Konva shape
          const clickedOnShape = isClickOnKonvaShape(e);
          
          if (!clickedOnShape) {
            // Only clear selection and start drag-to-select if we clicked on empty space
            // This prevents clearing selection when clicking on individual objects
            const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
            handlePointerDown(x, y);
          }
          
          return;
        }
        
        // Handle drawing/selection input
        if (shouldHandleDrawing(e)) {
          gestureStateRef.current.isDrawing = true;
          
          // Enable document-level text selection prevention during drawing
          const cleanup = preventTextSelection();
          
          // Store cleanup function for later use
          (gestureStateRef.current as any).textSelectionCleanup = cleanup;
          
          const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
          handlePointerDown(x, y);
        }
      },
      deps: [stageRef, logEventHandling, shouldHandlePanning, shouldHandleDrawing, currentToolRef, panZoom, getRelativePointerPosition, handlePointerDown, calculateDistance, calculateCenter, preventTextSelection, selection, isClickOnKonvaShape]
    },

    handlePointerMoveEvent: {
      handler: (e: PointerEvent) => {
        const stage = stageRef.current;
        if (!stage) return;

        // ALWAYS prevent default during pointer move to stop text selection
        e.preventDefault();

        logEventHandling('pointermove', 'pointer', { 
          pointerId: e.pointerId, 
          pointerType: e.pointerType,
          pressure: e.pressure,
          buttons: e.buttons,
          activePointers: activePointersRef.current.size
        });

        // Update active pointer
        activePointersRef.current.set(e.pointerId, e);
        
        // Handle multi-touch pinch-to-zoom
        if (gestureStateRef.current.isMultiTouch && activePointersRef.current.size === 2) {
          const pointers = Array.from(activePointersRef.current.values());
          const [pointer1, pointer2] = pointers;
          
          const currentDistance = calculateDistance(pointer1, pointer2);
          const currentCenter = calculateCenter(pointer1, pointer2);
          
          if (gestureStateRef.current.lastDistance > 0) {
            const zoomFactor = currentDistance / gestureStateRef.current.lastDistance;
            panZoom.zoom(zoomFactor, gestureStateRef.current.lastCenter.x, gestureStateRef.current.lastCenter.y);
          }
          
          gestureStateRef.current.lastDistance = currentDistance;
          gestureStateRef.current.lastCenter = currentCenter;
          return;
        }
        
        // Handle single-touch pan (right-click or finger pan)
        if (gestureStateRef.current.isPanning || e.buttons === 2) {
          panZoom.continuePan(e.clientX, e.clientY);
          return;
        }
        
        // Handle drawing/selection input
        if (!gestureStateRef.current.isMultiTouch && shouldHandleDrawing(e)) {
          const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
          handlePointerMove(x, y);
        }
      },
      deps: [stageRef, logEventHandling, panZoom, shouldHandleDrawing, currentToolRef, getRelativePointerPosition, handlePointerMove, calculateDistance, calculateCenter]
    },

    handlePointerUpEvent: {
      handler: (e: PointerEvent) => {
        // ALWAYS prevent default on pointer up to stop text selection
        e.preventDefault();

        logEventHandling('pointerup', 'pointer', { 
          pointerId: e.pointerId, 
          pointerType: e.pointerType,
          button: e.button,
          activePointers: activePointersRef.current.size
        });

        // Remove from active pointers
        activePointersRef.current.delete(e.pointerId);
        
        // Update multi-touch state
        const wasMultiTouch = gestureStateRef.current.isMultiTouch;
        gestureStateRef.current.isMultiTouch = activePointersRef.current.size > 1;
        
        // If we're ending a multi-touch gesture, reset gesture state
        if (wasMultiTouch && !gestureStateRef.current.isMultiTouch) {
          gestureStateRef.current.lastDistance = 0;
          gestureStateRef.current.lastCenter = { x: 0, y: 0 };
        }
        
        // Clean up text selection prevention if we were drawing
        if (gestureStateRef.current.isDrawing && (gestureStateRef.current as any).textSelectionCleanup) {
          (gestureStateRef.current as any).textSelectionCleanup();
          delete (gestureStateRef.current as any).textSelectionCleanup;
          gestureStateRef.current.isDrawing = false;
        }
        
        // Handle right-click pan end or finger pan end
        if (e.button === 2 || gestureStateRef.current.isPanning) {
          gestureStateRef.current.isPanning = false;
          panZoom.stopPan();
          palmRejection.onPointerEnd(e.pointerId);
          return;
        }
        
        // Always clean up pointer tracking
        palmRejection.onPointerEnd(e.pointerId);
        
        // Handle drawing/selection end (only if not multi-touch)
        if (!wasMultiTouch && shouldHandleDrawing(e)) {
          handlePointerUp();
        }
      },
      deps: [logEventHandling, panZoom, palmRejection, shouldHandleDrawing, currentToolRef, handlePointerUp]
    },

    handlePointerLeaveEvent: {
      handler: (e: PointerEvent) => {
        // ALWAYS prevent default on pointer leave
        e.preventDefault();

        logEventHandling('pointerleave', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
        
        // Clean up text selection prevention if we were drawing
        if (gestureStateRef.current.isDrawing && (gestureStateRef.current as any).textSelectionCleanup) {
          (gestureStateRef.current as any).textSelectionCleanup();
          delete (gestureStateRef.current as any).textSelectionCleanup;
          gestureStateRef.current.isDrawing = false;
        }
        
        // Clean up this pointer
        activePointersRef.current.delete(e.pointerId);
        gestureStateRef.current.isMultiTouch = activePointersRef.current.size > 1;
        gestureStateRef.current.isPanning = false;
        
        palmRejection.onPointerEnd(e.pointerId);
        panZoom.stopPan(); // Always stop pan on leave
        
        // Only call handlePointerUp for drawing if not in read-only mode and not multi-touch
        if (!stableIsReadOnly && !gestureStateRef.current.isMultiTouch) {
          handlePointerUp();
        }
      },
      deps: [logEventHandling, palmRejection, panZoom, stableIsReadOnly, handlePointerUp]
    },

    handleContextMenu: {
      handler: (e: Event) => {
        e.preventDefault(); // Prevent context menu on right-click
      },
      deps: []
    }
  });

  return handlers;
};
