import { useCallback } from 'react';
import { WhiteboardState, SelectionState } from '@/types/whiteboard';

export const useSelectionState = (
  state: WhiteboardState,
  setState: (updater: (prev: any) => any) => void,
  addToHistory: () => void
) => {
  // Select a single object by ID
  const selectObject = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectionState: {
        ...prev.selectionState,
        selectedIds: [id],
        selectionRect: null
      }
    }));
  }, [setState]);

  // Add an object to the current selection
  const addToSelection = useCallback((id: string) => {
    setState(prev => {
      // Don't add if already selected
      if (prev.selectionState.selectedIds.includes(id)) {
        return prev;
      }
      
      return {
        ...prev,
        selectionState: {
          ...prev.selectionState,
          selectedIds: [...prev.selectionState.selectedIds, id],
          selectionRect: null
        }
      };
    });
  }, [setState]);

  // Remove an object from the current selection
  const removeFromSelection = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectionState: {
        ...prev.selectionState,
        selectedIds: prev.selectionState.selectedIds.filter(selectedId => selectedId !== id),
        selectionRect: null
      }
    }));
  }, [setState]);

  // Clear the entire selection
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectionState: {
        ...prev.selectionState,
        selectedIds: [],
        selectionRect: null
      }
    }));
  }, [setState]);

  // Select all objects
  const selectAll = useCallback(() => {
    setState(prev => {
      const lineIds = prev.lines.map(line => line.id);
      const imageIds = prev.images.map(image => image.id);
      
      return {
        ...prev,
        selectionState: {
          ...prev.selectionState,
          selectedIds: [...lineIds, ...imageIds],
          selectionRect: null
        }
      };
    });
  }, [setState]);

  // Start creating a selection rectangle
  const startSelectionRect = useCallback((x: number, y: number) => {
    setState(prev => ({
      ...prev,
      selectionState: {
        ...prev.selectionState,
        selectionRect: { x1: x, y1: y, x2: x, y2: y }
      }
    }));
  }, [setState]);

  // Update the selection rectangle as the pointer moves
  const updateSelectionRect = useCallback((x: number, y: number) => {
    setState(prev => {
      if (!prev.selectionState.selectionRect) return prev;
      
      return {
        ...prev,
        selectionState: {
          ...prev.selectionState,
          selectionRect: {
            ...prev.selectionState.selectionRect,
            x2: x,
            y2: y
          }
        }
      };
    });
  }, [setState]);

  // Complete the selection rectangle and select objects within it
  const completeSelectionRect = useCallback(() => {
    setState(prev => {
      const rect = prev.selectionState.selectionRect;
      if (!rect) return prev;
      
      // Normalize rectangle coordinates (in case of dragging from bottom-right to top-left, etc.)
      const x1 = Math.min(rect.x1, rect.x2);
      const y1 = Math.min(rect.y1, rect.y2);
      const x2 = Math.max(rect.x1, rect.x2);
      const y2 = Math.max(rect.y1, rect.y2);
      
      // Find objects within the selection rectangle
      const selectedLineIds = prev.lines
        .filter(line => isLineInRect(line, x1, y1, x2, y2))
        .map(line => line.id);
      
      const selectedImageIds = prev.images
        .filter(image => isImageInRect(image, x1, y1, x2, y2))
        .map(image => image.id);
      
      return {
        ...prev,
        selectionState: {
          ...prev.selectionState,
          selectedIds: [...selectedLineIds, ...selectedImageIds],
          selectionRect: null
        }
      };
    });
  }, [setState]);

  // Set the transformation state
  const setTransforming = useCallback((isTransforming: boolean) => {
    setState(prev => ({
      ...prev,
      selectionState: {
        ...prev.selectionState,
        isTransforming
      }
    }));
  }, [setState]);

  // Apply transformations to selected objects and add to history
  const applyTransformation = useCallback(() => {
    // Add to history after transformation is complete
    addToHistory();
  }, [addToHistory]);

  // Helper function to check if a line is within a rectangle
  const isLineInRect = (line: any, x1: number, y1: number, x2: number, y2: number) => {
    // For simplicity, check if any point of the line is within the rectangle
    for (let i = 0; i < line.points.length; i += 2) {
      const pointX = line.x + line.points[i] * line.scaleX;
      const pointY = line.y + line.points[i + 1] * line.scaleY;
      
      if (pointX >= x1 && pointX <= x2 && pointY >= y1 && pointY <= y2) {
        return true;
      }
    }
    return false;
  };

  // Helper function to check if an image is within a rectangle
  const isImageInRect = (image: any, x1: number, y1: number, x2: number, y2: number) => {
    const imageX1 = image.x;
    const imageY1 = image.y;
    const imageX2 = image.x + (image.width || 0);
    const imageY2 = image.y + (image.height || 0);
    
    // Check if any corner of the image is within the rectangle
    // or if the rectangle is completely inside the image
    return (
      (imageX1 >= x1 && imageX1 <= x2 && imageY1 >= y1 && imageY1 <= y2) ||
      (imageX2 >= x1 && imageX2 <= x2 && imageY1 >= y1 && imageY1 <= y2) ||
      (imageX1 >= x1 && imageX1 <= x2 && imageY2 >= y1 && imageY2 <= y2) ||
      (imageX2 >= x1 && imageX2 <= x2 && imageY2 >= y1 && imageY2 <= y2) ||
      (x1 >= imageX1 && x2 <= imageX2 && y1 >= imageY1 && y2 <= imageY2)
    );
  };

  return {
    selectObject,
    addToSelection,
    removeFromSelection,
    clearSelection,
    selectAll,
    startSelectionRect,
    updateSelectionRect,
    completeSelectionRect,
    setTransforming,
    applyTransformation
  };
};
