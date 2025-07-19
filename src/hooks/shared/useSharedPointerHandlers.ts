
import { useCallback, useMemo } from 'react';
import { Tool } from '@/types/whiteboard';
import { SyncConfig } from '@/types/sync';

export const useSharedPointerHandlers = (
  state: { currentTool: Tool; lines: any[]; images: any[] },
  startDrawing: (x: number, y: number) => void,
  continueDrawing: (x: number, y: number) => void,
  stopDrawing: () => void,
  startErasing: (x: number, y: number) => void,
  continueErasing: (x: number, y: number) => void,
  stopErasing: () => void,
  syncConfig: SyncConfig | undefined,
  panZoom: any,
  selection?: any
) => {
  // Memoize stable references to prevent unnecessary re-renders
  const isReceiveOnly = useMemo(() => syncConfig?.isReceiveOnly, [syncConfig?.isReceiveOnly]);
  const stableCurrentTool = useMemo(() => state.currentTool, [state.currentTool]);
  const stableLines = useMemo(() => state.lines, [state.lines]);
  const stableImages = useMemo(() => state.images, [state.images]);
  const stableSelectionState = useMemo(() => selection?.selectionState, [selection?.selectionState]);

  // Handle pointer down - for drawing and selection operations
  const handlePointerDown = useCallback((x: number, y: number) => {
    // Don't allow operations in receive-only mode or during pan/zoom gestures
    if (isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      startDrawing(x, y);
    } else if (stableCurrentTool === 'eraser') {
      startErasing(x, y);
    } else if (stableCurrentTool === 'select' && selection) {
      console.log('[SharedPointer] Selection pointer down at:', { x, y });
      
      // Check if we have selection modes support
      if (selection.selectionModes) {
        const { shouldAllowObjectSelection, startPotentialDrag } = selection.selectionModes;
        
        // Check if clicking within existing selection bounds for group dragging
        if (selection.isPointInSelectionBounds && selection.isPointInSelectionBounds({ x, y }) && 
            stableSelectionState?.selectedObjects?.length > 0) {
          console.log('[SharedPointer] Clicking within selection bounds - allowing group drag');
          return;
        }
        
        // Start potential drag mode - we'll decide later if it's object selection or rectangle
        startPotentialDrag(x, y);
        
        // Check for individual objects only if we allow it
        if (shouldAllowObjectSelection() && selection.findObjectsAtPoint) {
          const foundObjects = selection.findObjectsAtPoint({ x, y }, stableLines, stableImages);
          
          if (foundObjects.length > 0) {
            console.log('[SharedPointer] Found object at point, selecting immediately');
            selection.selectionModes.selectObject();
            selection.selectObjects([foundObjects[0]]);
            return;
          }
        }
        
        // If no object found, we'll wait for drag movement to decide mode
      } else {
        // Fallback to old behavior if no selection modes
        console.log('[SharedPointer] Using fallback selection logic');
        const isInSelectionBounds = selection.isPointInSelectionBounds && selection.isPointInSelectionBounds({ x, y });
        
        if (isInSelectionBounds && stableSelectionState?.selectedObjects?.length > 0) {
          return;
        }
        
        const foundObjects = selection.findObjectsAtPoint ? selection.findObjectsAtPoint({ x, y }, stableLines, stableImages) : [];
        
        if (foundObjects.length > 0) {
          selection.selectObjects([foundObjects[0]]);
        } else {
          selection.clearSelection();
          selection.setIsSelecting(true);
          selection.setSelectionBounds({ x, y, width: 0, height: 0 });
        }
      }
    }
  }, [stableCurrentTool, stableLines, stableImages, stableSelectionState?.selectedObjects?.length, startDrawing, startErasing, isReceiveOnly, panZoom, selection]);

  // Handle pointer move - for drawing and selection operations
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't allow operations in receive-only mode or during pan/zoom gestures
    if (isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      continueDrawing(x, y);
    } else if (stableCurrentTool === 'eraser') {
      continueErasing(x, y);
    } else if (stableCurrentTool === 'select' && selection) {
      // Check if we have selection modes support
      if (selection.selectionModes) {
        const { checkDragThreshold, isRectangleDragging, selectionMode } = selection.selectionModes;
        
        // If we're in potential drag mode, check if we should switch to rectangle
        if (selectionMode.type === 'potential_drag') {
          checkDragThreshold(x, y);
        }
        
        // If we're actively dragging a rectangle, update its bounds
        if (isRectangleDragging() && selectionMode.startPoint && selection.setSelectionBounds) {
          const bounds = {
            x: Math.min(selectionMode.startPoint.x, x),
            y: Math.min(selectionMode.startPoint.y, y),
            width: Math.abs(x - selectionMode.startPoint.x),
            height: Math.abs(y - selectionMode.startPoint.y)
          };
          console.log('[SharedPointer] Updating rectangle bounds:', bounds);
          selection.setSelectionBounds(bounds);
          selection.setIsSelecting(true);
        }
      } else {
        // Fallback to old behavior
        if (stableSelectionState?.isSelecting && selection.setSelectionBounds && stableSelectionState.selectionBounds) {
          const bounds = stableSelectionState.selectionBounds;
          const newBounds = {
            x: Math.min(bounds.x, x),
            y: Math.min(bounds.y, y),
            width: Math.abs(x - bounds.x),
            height: Math.abs(y - bounds.y)
          };
          selection.setSelectionBounds(newBounds);
        }
      }
    }
  }, [stableCurrentTool, stableSelectionState?.isSelecting, stableSelectionState?.selectionBounds, continueDrawing, continueErasing, isReceiveOnly, panZoom, selection]);

  // Handle pointer up - for drawing and selection operations
  const handlePointerUp = useCallback(() => {
    // Don't allow operations in receive-only mode
    if (isReceiveOnly) return;
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      stopDrawing();
    } else if (stableCurrentTool === 'eraser') {
      stopErasing();
    } else if (stableCurrentTool === 'select' && selection) {
      console.log('[SharedPointer] Selection pointer up');
      
      // Check if we have selection modes support
      if (selection.selectionModes) {
        const { selectionMode, completeRectangleSelection, resetSelection } = selection.selectionModes;
        
        if (selectionMode.type === 'rectangle_selection') {
          // Complete rectangle selection
          console.log('[SharedPointer] Completing rectangle selection');
          
          if (selection.setIsSelecting && selection.setSelectionBounds && selection.findObjectsInBounds && selection.selectObjects) {
            const bounds = stableSelectionState?.selectionBounds;
            if (bounds && (bounds.width > 2 || bounds.height > 2)) { // Lowered threshold
              console.log('[SharedPointer] Finding objects in bounds:', bounds);
              const objectsInBounds = selection.findObjectsInBounds(bounds, stableLines, stableImages);
              console.log('[SharedPointer] Found objects in bounds:', objectsInBounds);
              selection.selectObjects(objectsInBounds);
            } else {
              console.log('[SharedPointer] Rectangle too small, clearing selection');
              selection.clearSelection();
            }
            
            selection.setIsSelecting(false);
            selection.setSelectionBounds(null);
          }
          
          completeRectangleSelection();
        } else if (selectionMode.type === 'potential_drag') {
          // Potential drag that didn't become a rectangle - treat as click to clear
          console.log('[SharedPointer] Potential drag ended without rectangle - clearing selection');
          selection.clearSelection();
          resetSelection();
        } else if (selectionMode.type === 'object_selected') {
          // Object was already selected in pointer down
          resetSelection();
        }
      } else {
        // Fallback to old behavior
        if (stableSelectionState?.isSelecting && selection.setIsSelecting && selection.setSelectionBounds && selection.findObjectsInBounds && selection.selectObjects) {
          const bounds = stableSelectionState.selectionBounds;
          if (bounds && (bounds.width > 5 || bounds.height > 5)) {
            const objectsInBounds = selection.findObjectsInBounds(bounds, stableLines, stableImages);
            selection.selectObjects(objectsInBounds);
          }
          
          selection.setIsSelecting(false);
          selection.setSelectionBounds(null);
        }
      }
    }
  }, [stableCurrentTool, stableLines, stableImages, stableSelectionState?.isSelecting, stableSelectionState?.selectionBounds, stopDrawing, stopErasing, isReceiveOnly, selection]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
