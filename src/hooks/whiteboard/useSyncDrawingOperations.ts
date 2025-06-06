
import { useCallback, useRef } from 'react';
import { LineObject } from '@/types/whiteboard';
import { serializeDrawOperation } from '@/utils/operationSerializer';
import { useDebounce } from '../sync/useDebounce';

export const useSyncDrawingOperations = (
  state: { isDrawing: boolean; lines: LineObject[] },
  baseStopDrawing: () => void,
  sendOperation: ((operation: any) => Promise<any>) | null,
  isApplyingRemoteOperation: React.MutableRefObject<boolean>
) => {
  // Debounced sync for drawing to avoid excessive network calls
  const debouncedSyncDraw = useDebounce((drawnLine: LineObject) => {
    if (sendOperation && !isApplyingRemoteOperation.current) {
      sendOperation(serializeDrawOperation(drawnLine));
    }
  }, 100);

  const stopDrawing = useCallback(() => {
    if (!state.isDrawing) return;

    baseStopDrawing();

    // Sync the drawn line if we're not in receive-only mode
    if (sendOperation && !isApplyingRemoteOperation.current && state.lines.length > 0) {
      const drawnLine = state.lines[state.lines.length - 1];
      if (drawnLine && drawnLine.tool === 'pencil') {
        debouncedSyncDraw(drawnLine);
      }
    }
  }, [state.isDrawing, state.lines, baseStopDrawing, sendOperation, isApplyingRemoteOperation, debouncedSyncDraw]);

  return { stopDrawing };
};
