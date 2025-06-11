
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LineObject, ImageObject } from '@/types/whiteboard';
import { WhiteboardOperation, OperationType } from '@/types/sync';

interface WhiteboardPersistenceProps {
  whiteboardId: string;
  sessionId: string;
}

interface WhiteboardPersistenceResult {
  isLoading: boolean;
  error: Error | null;
  lines: LineObject[];
  images: ImageObject[];
}

export const useWhiteboardPersistence = ({
  whiteboardId,
  sessionId
}: WhiteboardPersistenceProps): WhiteboardPersistenceResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lines, setLines] = useState<LineObject[]>([]);
  const [images, setImages] = useState<ImageObject[]>([]);

  const fetchWhiteboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`[Persistence] Fetching data for whiteboard: ${whiteboardId}, session: ${sessionId}`);

      // Fetch all whiteboard operations for this whiteboard and session
      const { data, error } = await supabase
        .from('whiteboard_data')
        .select('*')
        .eq('board_id', whiteboardId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Error fetching whiteboard data: ${error.message}`);
      }

      console.log(`[Persistence] Retrieved ${data?.length || 0} operations from database`);

      // Process operations to rebuild the whiteboard state
      const linesMap = new Map<string, LineObject>();
      const imagesMap = new Map<string, ImageObject>();
      const deletedLineIds = new Set<string>();
      const deletedImageIds = new Set<string>();

      // First pass: collect all objects that were added
      data.forEach((operation) => {
        const operationType = operation.action_type as OperationType;
        const operationData = operation.object_data as any;

        if (operationType === 'draw') {
          const line = operationData.line as LineObject;
          if (line && line.id) {
            linesMap.set(line.id, line);
          }
        } else if (operationType === 'add_image') {
          const image = operationData.image as ImageObject;
          if (image && image.id) {
            imagesMap.set(image.id, image);
          }
        }
      });

      // Second pass: apply all deletion and update operations
      data.forEach((operation) => {
        const operationType = operation.action_type as OperationType;
        const operationData = operation.object_data as any;

        switch (operationType) {
          case 'erase':
            // Remove lines
            const lineIds = (operationData.line_ids || operationData.lineIds) as string[];
            if (lineIds && Array.isArray(lineIds)) {
              lineIds.forEach(id => {
                linesMap.delete(id);
                deletedLineIds.add(id); // Store deleted line IDs
              });
            }
            break;
          case 'update_line':
            // Update line attributes
            const lineId = operationData.line_id as string;
            const lineUpdates = operationData.updates as Partial<LineObject>;
            if (lineId && lineUpdates && linesMap.has(lineId)) {
              const existingLine = linesMap.get(lineId)!;
              linesMap.set(lineId, { ...existingLine, ...lineUpdates });
            }
            break;
          case 'update_image':
            // Update image attributes
            const imageIdToUpdate = operationData.image_id as string;
            const imageUpdates = operationData.updates as Partial<ImageObject>;
            if (imageIdToUpdate && imageUpdates) {
              // For backward compatibility, also check if image is directly in data
              const imageFromData = operationData.image as ImageObject;
              if (imageFromData && imageFromData.id) {
                imagesMap.set(imageFromData.id, imageFromData);
              } else if (imagesMap.has(imageIdToUpdate)) {
                const existingImage = imagesMap.get(imageIdToUpdate)!;
                imagesMap.set(imageIdToUpdate, { ...existingImage, ...imageUpdates });
              }
            }
            break;
          case 'delete_image':
            // Remove image
            const imageId = operationData.image_id as string;
            if (imageId) {
              imagesMap.delete(imageId);
              deletedImageIds.add(imageId); // Store deleted image IDs
            }
            break;
          case 'delete_objects':
            // Delete multiple objects
            const deleteLineIds = operationData.line_ids as string[];
            const deleteImageIds = operationData.image_ids as string[];
            
            console.log(`[Persistence] Processing delete_objects operation with ${deleteLineIds?.length || 0} lines and ${deleteImageIds?.length || 0} images`);
            
            if (deleteLineIds && Array.isArray(deleteLineIds)) {
              deleteLineIds.forEach(id => {
                linesMap.delete(id);
                deletedLineIds.add(id); // Store deleted line IDs
              });
            }
            if (deleteImageIds && Array.isArray(deleteImageIds)) {
              deleteImageIds.forEach(id => {
                imagesMap.delete(id);
                deletedImageIds.add(id); // Store deleted image IDs
              });
            }
            break;
        }
      });

      // Convert maps to arrays, excluding deleted objects
      const finalLines = Array.from(linesMap.values()).filter(line => !deletedLineIds.has(line.id));
      const finalImages = Array.from(imagesMap.values()).filter(image => !deletedImageIds.has(image.id));
      
      console.log(`[Persistence] Final state after processing: ${finalLines.length} lines and ${finalImages.length} images`);
      console.log(`[Persistence] Excluded ${deletedLineIds.size} deleted lines and ${deletedImageIds.size} deleted images`);

      setLines(finalLines);
      setImages(finalImages);
    } catch (err) {
      console.error('Error in fetchWhiteboardData:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [whiteboardId, sessionId]);

  // Fetch whiteboard data on mount
  useEffect(() => {
    if (whiteboardId && sessionId) {
      fetchWhiteboardData();
    }
  }, [whiteboardId, sessionId, fetchWhiteboardData]);

  return {
    isLoading,
    error,
    lines,
    images
  };
};
