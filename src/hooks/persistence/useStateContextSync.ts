
import { useEffect, useRef } from 'react';
import { WhiteboardState } from '@/types/whiteboard';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';

/**
 * @hook useStateContextSync
 * @description Manages shared state context updates and race condition prevention
 */
export const useStateContextSync = (
  state: WhiteboardState,
  whiteboardId?: string
) => {
  const { updateWhiteboardState } = useWhiteboardStateContext();
  
  // Track previous line count to detect deletions
  const previousLineCount = useRef(0);
  // Track if we're currently processing a delete operation
  const isProcessingDelete = useRef(false);

  // Update shared state context on initial load
  const updateContextOnLoad = (
    whiteboardId: string,
    lines: any[],
    images: any[] = [],
    hasData: boolean
  ) => {
    if (whiteboardId && updateWhiteboardState && !hasData && (lines.length > 0 || images.length > 0)) {
      console.log(`[StateContextSync] Updating shared context for ${whiteboardId} with ${lines.length} lines and ${images.length} images`);
      updateWhiteboardState(whiteboardId, lines, images);
    }
  };

  // Set initial line count
  const setInitialLineCount = (count: number) => {
    previousLineCount.current = count;
  };

  // Update shared state for significant changes (less aggressive deletion detection)
  useEffect(() => {
    if (whiteboardId && updateWhiteboardState) {
      const currentLineCount = state.lines.length;
      const currentImageCount = state.images.length;
      const totalObjects = currentLineCount + currentImageCount;
      const previousTotal = previousLineCount.current;
      
      // Only skip updates for major deletions (>50% reduction) to prevent data loss
      const significantDeletion = totalObjects < previousTotal * 0.5 && previousTotal > 5;
      
      if (significantDeletion) {
        console.log(`[StateContextSync] Detected significant deletion: ${previousTotal} -> ${totalObjects} objects. Skipping context update to prevent race condition.`);
        isProcessingDelete.current = true;
        
        // Clear the delete flag after a short delay
        setTimeout(() => {
          isProcessingDelete.current = false;
        }, 200);
      } else if (!isProcessingDelete.current) {
        console.log(`[StateContextSync] Updating shared context: ${currentLineCount} lines, ${currentImageCount} images`);
        updateWhiteboardState(whiteboardId, state.lines, state.images);
      }
      
      // Update the previous count (track total objects)
      previousLineCount.current = totalObjects;
    }
  }, [state.lines, state.images, whiteboardId, updateWhiteboardState]);

  return {
    updateContextOnLoad,
    setInitialLineCount
  };
};
