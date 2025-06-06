import { LineObject } from '@/types/whiteboard';
import { WhiteboardOperation } from '@/types/sync';

export const serializeDrawOperation = (line: LineObject): Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'> => ({
  whiteboard_id: '', // Will be set by the calling function
  operation_type: 'draw',
  data: {
    line
  }
});

export const serializeEraseOperation = (erasedLineIds: string[]): Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'> => ({
  whiteboard_id: '', // Will be set by the calling function
  operation_type: 'erase',
  data: {
    lineIds: erasedLineIds
  }
});

export const applyOperation = (
  lines: LineObject[],
  operation: WhiteboardOperation
): LineObject[] => {
  switch (operation.operation_type) {
    case 'draw': {
      const newLine = operation.data.line;
      // Don't add if line already exists (prevent duplicates)
      if (lines.some(line => line.id === newLine.id)) {
        return lines;
      }
      return [...lines, newLine];
    }
    case 'erase': {
      const lineIdsToRemove = operation.data.lineIds;
      return lines.filter(line => !lineIdsToRemove.includes(line.id));
    }
    default:
      return lines;
  }
};
