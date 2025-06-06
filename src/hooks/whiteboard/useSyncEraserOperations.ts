
import { useCallback, useRef } from 'react';
import { LineObject } from '@/types/whiteboard';
import { serializeEraseOperation } from '@/utils/operationSerializer';
import { useDebounce } from '../sync/useDebounce';

export const useSyncEraserOperations = (
  state: { currentTool: string; isDrawing: boolean; lines: LineObject[] },
  baseStartErasing: (x: number, y: number) => void,
  baseStopErasing: () => void,
  sendOperation: ((operation: any) => Promise<any>) | null,
  isApplyingRemoteOperation: React.MutableRefObject<boolean>
) => {
  // Store lines before erasing for proper sync
  const linesBeforeErasingRef = useRef<LineObject[]>([]);

  // Debounced sync for erasing to batch rapid erase operations
  const debouncedSyncErase = useDebounce((erasedLineIds: string[]) => {
    if (sendOperation && !isApplyingRemoteOperation.current && erasedLineIds.length > 0) {
      sendOperation(serializeEraseOperation(erasedLineIds));
    }
  }, 200);

  const startErasing = useCallback((x: number, y: number) => {
    if (state.currentTool !== 'eraser') return;
    
    // Capture current lines before erasing starts
    linesBeforeErasingRef.current = [...state.lines];
    baseStartErasing(x, y);
  }, [state.currentTool, state.lines, baseStartErasing]);

  const stopErasing = useCallback(() => {
    if (!state.isDrawing) return;

    baseStopErasing();
    
    // Find the IDs of lines that were erased by comparing before and after
    const currentLineIds = new Set(state.lines.map(line => line.id));
    const erasedLineIds = linesBeforeErasingRef.current
      .filter(line => !currentLineIds.has(line.id))
      .map(line => line.id);
    
    // Sync the erased lines if we're not in receive-only mode
    if (erasedLineIds.length > 0) {
      debouncedSyncErase(erasedLineIds);
    }
    
    // Clear the reference
    linesBeforeErasingRef.current = [];
  }, [state.isDrawing, state.lines, baseStopErasing, debouncedSyncErase]);

  return { startErasing, stopErasing };
};
