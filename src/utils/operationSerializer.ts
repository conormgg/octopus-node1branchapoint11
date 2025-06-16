import { LineObject, ImageObject, ActivityMetadata } from '@/types/whiteboard';
import { WhiteboardOperation } from '@/types/sync';

export const serializeDrawOperation = (line: LineObject, activityMetadata?: ActivityMetadata): Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'> => ({
  whiteboard_id: '', // Will be set by the calling function
  operation_type: 'draw',
  data: {
    line,
    activityMetadata
  }
});

export const serializeEraseOperation = (erasedLineIds: string[], activityMetadata?: ActivityMetadata): Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'> => ({
  whiteboard_id: '', // Will be set by the calling function
  operation_type: 'erase',
  data: {
    line_ids: erasedLineIds,
    activityMetadata
  }
});

export const serializeAddImageOperation = (image: ImageObject, activityMetadata?: ActivityMetadata): Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'> => ({
  whiteboard_id: '', // Will be set by the calling function
  operation_type: 'add_image',
  data: {
    image,
    activityMetadata
  }
});

export const serializeUpdateImageOperation = (imageId: string, updates: Partial<ImageObject>, activityMetadata?: ActivityMetadata): Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'> => ({
  whiteboard_id: '', // Will be set by the calling function
  operation_type: 'update_image',
  data: {
    image_id: imageId,
    updates,
    activityMetadata
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
  operation_type: 'update_line',
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
  console.log(`[OperationSerializer] Applying operation: ${operation.operation_type}`, operation.data);
  
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
      // Ensure we check both formats (lineIds and line_ids)
      const lineIdsToRemove = operation.data.line_ids || operation.data.lineIds;
      console.log('[OperationSerializer] Removing lines:', lineIdsToRemove);
      
      if (!lineIdsToRemove || lineIdsToRemove.length === 0) {
        console.log('[OperationSerializer] No lines to remove');
        return state;
      }
      
      const filteredLines = state.lines.filter(line => !lineIdsToRemove.includes(line.id));
      console.log(`[OperationSerializer] Removed ${state.lines.length - filteredLines.length} lines`);
      return {
        ...state,
        lines: filteredLines
      };
    }
    case 'add_image': {
      const newImage = operation.data.image;
      console.log('[OperationSerializer] Adding new image:', newImage);
      
      // Don't add if image already exists (prevent duplicates)
      if (state.images.some(image => image.id === newImage.id)) {
        console.log('[OperationSerializer] Image already exists, skipping');
        return state;
      }
      return {
        ...state,
        images: [...state.images, newImage]
      };
    }
    case 'update_image': {
      const { image_id, updates } = operation.data;
      console.log('[OperationSerializer] Updating image:', image_id, updates);
      
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
      console.log('[OperationSerializer] Removing image:', imageIdToRemove);
      
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
      console.log('[OperationSerializer] Deleting objects - lines:', line_ids, 'images:', image_ids);
      
      // Properly handle case where arrays might be undefined or null
      const linesToRemove = line_ids || [];
      const imagesToRemove = image_ids || [];
      
      const filteredLines = linesToRemove.length > 0 
        ? state.lines.filter(line => !linesToRemove.includes(line.id))
        : state.lines;
      
      const filteredImages = imagesToRemove.length > 0
        ? state.images.filter(image => !imagesToRemove.includes(image.id))
        : state.images;
      
      console.log(`[OperationSerializer] Lines before: ${state.lines.length}, after: ${filteredLines.length}`);
      console.log(`[OperationSerializer] Images before: ${state.images.length}, after: ${filteredImages.length}`);
      
      return {
        ...state,
        lines: filteredLines,
        images: filteredImages
      };
    }
    default:
      console.log('[OperationSerializer] Unknown operation type:', operation.operation_type);
      return state;
  }
};

/**
 * Extract activity metadata from a database operation
 */
export const extractActivityFromOperation = (operation: any): ActivityMetadata | null => {
  const data = operation.object_data;
  
  if (data?.activityMetadata) {
    return data.activityMetadata;
  }
  
  return null;
};
