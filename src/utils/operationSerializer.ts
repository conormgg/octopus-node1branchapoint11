
import { LineObject, ImageObject } from '@/types/whiteboard';
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

export const serializeAddImageOperation = (image: ImageObject): Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'> => ({
  whiteboard_id: '', // Will be set by the calling function
  operation_type: 'add_image',
  data: {
    image
  }
});

export const serializeUpdateImageOperation = (imageId: string, updates: Partial<ImageObject>): Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'> => ({
  whiteboard_id: '', // Will be set by the calling function
  operation_type: 'update_image',
  data: {
    image_id: imageId,
    updates
  }
});

export const serializeDeleteImageOperation = (imageId: string): Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'> => ({
  whiteboard_id: '', // Will be set by the calling function
  operation_type: 'delete_image',
  data: {
    image_id: imageId
  }
});

export const serializeUpdateLineOperation = (lineId: string, updates: Partial<LineObject>): Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'> => ({
  whiteboard_id: '', // Will be set by the calling function
  operation_type: 'transform_objects', // Use 'transform_objects' for line updates
  data: {
    line_id: lineId,
    updates
  }
});

export const serializeDeleteObjectsOperation = (lineIds: string[], imageIds: string[]): Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'> => ({
  whiteboard_id: '', // Will be set by the calling function
  operation_type: 'delete_objects',
  data: {
    line_ids: lineIds,
    image_ids: imageIds
  }
});

export const applyOperation = (
  state: { lines: LineObject[]; images: ImageObject[] },
  operation: WhiteboardOperation
): { lines: LineObject[]; images: ImageObject[] } => {
  switch (operation.operation_type) {
    case 'draw': {
      const newLine = operation.data.line;
      
      // Don't add if line already exists (prevent duplicates)
      if (state.lines.some(line => line.id === newLine.id)) {
        return state;
      }
      return {
        ...state,
        lines: [...state.lines, newLine]
      };
    }
    case 'erase': {
      const lineIdsToRemove = operation.data.lineIds || operation.data.line_ids; // Handle both formats
      console.log('Removing lines:', lineIdsToRemove);
      
      if (!lineIdsToRemove || lineIdsToRemove.length === 0) {
        console.log('No lines to remove');
        return state;
      }
      
      const filteredLines = state.lines.filter(line => !lineIdsToRemove.includes(line.id));
      console.log(`Removed ${state.lines.length - filteredLines.length} lines`);
      return {
        ...state,
        lines: filteredLines
      };
    }
    case 'add_image': {
      const newImage = operation.data.image;
      console.log('Adding new image:', newImage);
      
      // Don't add if image already exists (prevent duplicates)
      if (state.images.some(image => image.id === newImage.id)) {
        console.log('Image already exists, skipping');
        return state;
      }
      return {
        ...state,
        images: [...state.images, newImage]
      };
    }
    case 'update_image': {
      const { image_id, updates } = operation.data;
      console.log('Updating image:', image_id, updates);
      
      const updatedImages = state.images.map(image =>
        image.id === image_id ? { ...image, ...updates } : image
      );
      return {
        ...state,
        images: updatedImages
      };
    }
    case 'delete_image': {
      const imageIdToRemove = operation.data.image_id;
      console.log('Removing image:', imageIdToRemove);
      
      const filteredImages = state.images.filter(image => image.id !== imageIdToRemove);
      return {
        ...state,
        images: filteredImages
      };
    }
    case 'update_line': {
      const { line_id, updates } = operation.data;
      
      const updatedLines = state.lines.map(line =>
        line.id === line_id ? { ...line, ...updates } : line
      );
      return {
        ...state,
        lines: updatedLines
      };
    }
    case 'transform_objects': {
      const { line_id, updates } = operation.data;
      
      const updatedLines = state.lines.map(line =>
        line.id === line_id ? { ...line, ...updates } : line
      );
      return {
        ...state,
        lines: updatedLines
      };
    }
    case 'delete_objects': {
      const { line_ids, image_ids } = operation.data;
      console.log('Deleting objects - lines:', line_ids, 'images:', image_ids);
      
      const filteredLines = line_ids && line_ids.length > 0 
        ? state.lines.filter(line => !line_ids.includes(line.id))
        : state.lines;
      
      const filteredImages = image_ids && image_ids.length > 0
        ? state.images.filter(image => !image_ids.includes(image.id))
        : state.images;
      
      return {
        ...state,
        lines: filteredLines,
        images: filteredImages
      };
    }
    default:
      console.log('Unknown operation type:', operation.operation_type);
      return state;
  }
};
