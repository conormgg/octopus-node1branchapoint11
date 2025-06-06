
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
  console.log('Applying operation:', operation);
  
  switch (operation.operation_type) {
    case 'draw': {
      const newLine = operation.data.line;
      console.log('Adding new line:', newLine);
      
      // Don't add if line already exists (prevent duplicates)
      if (lines.some(line => line.id === newLine.id)) {
        console.log('Line already exists, skipping');
        return lines;
      }
      return [...lines, newLine];
    }
    case 'erase': {
      const lineIdsToRemove = operation.data.lineIds || operation.data.line_ids; // Handle both formats
      console.log('Removing lines:', lineIdsToRemove);
      
      if (!lineIdsToRemove || lineIdsToRemove.length === 0) {
        console.log('No lines to remove');
        return lines;
      }
      
      const filteredLines = lines.filter(line => !lineIdsToRemove.includes(line.id));
      console.log(`Removed ${lines.length - filteredLines.length} lines`);
      return filteredLines;
    }
    default:
      console.log('Unknown operation type:', operation.operation_type);
      return lines;
  }
};
