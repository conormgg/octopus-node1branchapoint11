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

      // Fetch all whiteboard operations for this whiteboard and session
      const { data, error } = await supabase
        .from('whiteboard_data')
        .select('*')
        .eq('board_id', whiteboardId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Error fetching whiteboard data: ${error.message}`);
      }

      // Process operations to rebuild the whiteboard state
      const linesMap = new Map<string, LineObject>();
      const imagesMap = new Map<string, ImageObject>();

      data.forEach((operation) => {
        const operationType = operation.action_type as OperationType;
        const operationData = operation.object_data;

        switch (operationType) {
          case 'draw':
            // Add or update line
            const line = operationData.line as LineObject;
            linesMap.set(line.id, line);
            break;
          case 'erase':
            // Remove lines
            const lineIds = operationData.line_ids as string[];
            lineIds.forEach(id => linesMap.delete(id));
            break;
          case 'add_image':
          case 'update_image':
            // Add or update image
            const image = operationData.image as ImageObject;
            imagesMap.set(image.id, image);
            break;
          case 'delete_image':
            // Remove image
            const imageId = operationData.image_id as string;
            imagesMap.delete(imageId);
            break;
        }
      });

      // Convert maps to arrays
      setLines(Array.from(linesMap.values()));
      setImages(Array.from(imagesMap.values()));
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
