
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
    hasData: boolean
  ) => {
    if (whiteboardId && updateWhiteboardState && !hasData && lines.length > 0) {
      console.log(`[StateContextSync] Updating shared context for ${whiteboardId} with ${lines.length} lines`);
      updateWhiteboardState(whiteboardId, lines);
    }
  };

  // Set initial line count
  const setInitialLineCount = (count: number) => {
    previousLineCount.current = count;
  };

  // Update shared state only for additions, not deletions (to prevent race condition)
  useEffect(() => {
    if (whiteboardId && updateWhiteboardState) {
      const currentLineCount = state.lines.length;
      
      // Detect if this is a deletion operation
      if (currentLineCount < previousLineCount.current) {
        console.log(`[StateContextSync] Detected deletion: ${previousLineCount.current} -> ${currentLineCount} lines. NOT updating shared context to prevent race condition.`);
        isProcessingDelete.current = true;
        
        // Clear the delete flag after a short delay
        setTimeout(() => {
          isProcessingDelete.current = false;
        }, 100);
      } else if (currentLineCount > previousLineCount.current && !isProcessingDelete.current) {
        // Only update shared context for additions, not deletions
        console.log(`[StateContextSync] Detected addition: ${previousLineCount.current} -> ${currentLineCount} lines. Updating shared context.`);
        updateWhiteboardState(whiteboardId, state.lines);
      }
      
      // Update the previous count
      previousLineCount.current = currentLineCount;
    }
  }, [state.lines, whiteboardId, updateWhiteboardState]);

  return {
    updateContextOnLoad,
    setInitialLineCount
  };
};
