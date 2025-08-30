
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LineObject, ImageObject, ActivityMetadata } from '@/types/whiteboard';
import { WhiteboardOperation, OperationType } from '@/types/sync';
import { calculateLineBounds } from './shared/drawing/useDrawingBounds';

interface WhiteboardPersistenceProps {
  whiteboardId: string;
  sessionId: string;
}

interface WhiteboardPersistenceResult {
  isLoading: boolean;
  error: Error | null;
  lines: LineObject[];
  images: ImageObject[];
  lastActivity: ActivityMetadata | null;
  orderedOperations: WhiteboardOperation[]; // NEW: Return ordered operations for history reconstruction
}

// Performance configuration constants
const PERFORMANCE_WARNING_THRESHOLD = 1000; // Warn when operations exceed this count
const MAX_OPERATIONS_FOR_HISTORY = 10000; // Increased from 2000 to handle large boards
const MAX_HISTORY_SIZE = 10; // Maximum history entries to maintain

// Operation fetch limits - both use RPC function for reliability
const AUTHENTICATED_USER_LIMIT = 10000; // High limit for authenticated users
const ANONYMOUS_USER_LIMIT = 5000; // Standard limit for anonymous users

// Helper function to calculate image bounds
const calculateImageBounds = (image: ImageObject) => {
  const width = image.width || 100;
  const height = image.height || 100;
  
  return {
    x: image.x,
    y: image.y,
    width,
    height
  };
};

// Helper function to reconstruct activity metadata from the last operation
const reconstructActivityFromOperation = (
  operation: any,
  finalLines: LineObject[],
  finalImages: ImageObject[]
): ActivityMetadata | null => {
  const operationType = operation.action_type as OperationType;
  const operationData = operation.object_data as any;
  const timestamp = new Date(operation.created_at).getTime();

  console.log(`[ActivityReconstruction] Processing operation: ${operationType}`, operationData);

  switch (operationType) {
    case 'draw': {
      const line = operationData.line as LineObject;
      if (line && line.id) {
        // Find the line in the final state to get its current bounds
        const currentLine = finalLines.find(l => l.id === line.id);
        if (currentLine) {
          const bounds = calculateLineBounds(currentLine);
          console.log(`[ActivityReconstruction] Draw activity bounds:`, bounds);
          return {
            type: 'draw',
            bounds,
            timestamp
          };
        }
      }
      break;
    }
    
    case 'add_image': {
      const image = operationData.image as ImageObject;
      if (image && image.id) {
        // Find the image in the final state
        const currentImage = finalImages.find(img => img.id === image.id);
        if (currentImage) {
          const bounds = calculateImageBounds(currentImage);
          console.log(`[ActivityReconstruction] Paste activity bounds:`, bounds);
          return {
            type: 'paste',
            bounds,
            timestamp
          };
        }
      }
      break;
    }
    
    case 'update_line': {
      const lineId = operationData.line_id as string;
      if (lineId) {
        const currentLine = finalLines.find(l => l.id === lineId);
        if (currentLine) {
          const bounds = calculateLineBounds(currentLine);
          console.log(`[ActivityReconstruction] Move activity bounds (line):`, bounds);
          return {
            type: 'move',
            bounds,
            timestamp
          };
        }
      }
      break;
    }
    
    case 'update_image': {
      const imageId = operationData.image_id as string;
      if (imageId) {
        const currentImage = finalImages.find(img => img.id === imageId);
        if (currentImage) {
          const bounds = calculateImageBounds(currentImage);
          console.log(`[ActivityReconstruction] Move activity bounds (image):`, bounds);
          return {
            type: 'move',
            bounds,
            timestamp
          };
        }
      }
      break;
    }
    
    case 'erase': {
      // For erase operations, we can use stored bounds if available
      const lineIds = (operationData.line_ids || operationData.lineIds) as string[];
      if (lineIds && lineIds.length > 0) {
        // If bounds were stored in the operation data, use them
        if (operationData.bounds) {
          console.log(`[ActivityReconstruction] Erase activity bounds (stored):`, operationData.bounds);
          return {
            type: 'erase',
            bounds: operationData.bounds,
            timestamp
          };
        }
        
        // Otherwise, create a default bounds (this is a fallback)
        console.log(`[ActivityReconstruction] Erase activity - using default bounds`);
        return {
          type: 'erase',
          bounds: { x: 0, y: 0, width: 100, height: 100 },
          timestamp
        };
      }
      break;
    }
    
    case 'delete_objects': {
      // Similar to erase, use stored bounds if available
      if (operationData.bounds) {
        console.log(`[ActivityReconstruction] Delete activity bounds (stored):`, operationData.bounds);
        return {
          type: 'erase',
          bounds: operationData.bounds,
          timestamp
        };
      }
      
      // Fallback for delete operations
      console.log(`[ActivityReconstruction] Delete activity - using default bounds`);
      return {
        type: 'erase',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        timestamp
      };
    }
  }

  console.log(`[ActivityReconstruction] Could not reconstruct activity for operation: ${operationType}`);
  return null;
};

// NEW: Convert database operation to WhiteboardOperation format for history reconstruction
const convertDbOperationToWhiteboardOperation = (dbOperation: any): WhiteboardOperation => {
  return {
    whiteboard_id: dbOperation.board_id,
    operation_type: dbOperation.action_type as OperationType,
    timestamp: new Date(dbOperation.created_at).getTime(),
    sender_id: dbOperation.session_id || 'unknown', // Use session_id as sender fallback
    data: dbOperation.object_data
  };
};

export const useWhiteboardPersistence = ({
  whiteboardId,
  sessionId
}: WhiteboardPersistenceProps): WhiteboardPersistenceResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lines, setLines] = useState<LineObject[]>([]);
  const [images, setImages] = useState<ImageObject[]>([]);
  const [lastActivity, setLastActivity] = useState<ActivityMetadata | null>(null);
  const [orderedOperations, setOrderedOperations] = useState<WhiteboardOperation[]>([]);

  const fetchWhiteboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`[Persistence] Fetching data for whiteboard: ${whiteboardId}, session: ${sessionId}`);

      // Check authentication and use appropriate method to fetch data
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      let data, error;
      
      // Use RPC function for both authenticated and anonymous users for reliability
      // The RPC function bypasses PostgREST limits and provides consistent behavior
      const limit = session?.user?.id ? AUTHENTICATED_USER_LIMIT : ANONYMOUS_USER_LIMIT;
      const response = await supabase
        .rpc('public_get_whiteboard_operations', {
          p_session_id: sessionId,
          p_board_id: whiteboardId,
          p_limit: limit
        });
      data = response.data;
      error = response.error;

      if (error) {
        throw new Error(`Error fetching whiteboard data: ${error.message}`);
      }

      console.log(`[Persistence] Retrieved ${data?.length || 0} operations from database`);

      // Performance monitoring and warnings
      const totalOperations = data?.length || 0;
      const isAuthenticated = !!session?.user?.id;
      const currentLimit = isAuthenticated ? AUTHENTICATED_USER_LIMIT : ANONYMOUS_USER_LIMIT;
      
      if (totalOperations > PERFORMANCE_WARNING_THRESHOLD) {
        console.warn(`[Persistence] High operation count detected: ${totalOperations} operations. Consider performance optimization.`);
      }
      
      // Check if we hit the fetch limit and warn user
      if (totalOperations >= currentLimit) {
        console.error(`[Persistence] CRITICAL: Hit operation fetch limit (${currentLimit}). Some operations may be missing! This will cause data inconsistencies.`);
        setError(new Error(`Operation limit reached (${currentLimit}). Please contact support for boards with more than ${currentLimit} operations.`));
      }

      // Apply configurable history limits with better logging
      const operationsForHistory = data ? (totalOperations > MAX_OPERATIONS_FOR_HISTORY ? data.slice(-MAX_OPERATIONS_FOR_HISTORY) : data) : [];
      const convertedOperations = operationsForHistory.map(convertDbOperationToWhiteboardOperation);
      
      // Enhanced logging to track history vs total operations
      if (totalOperations > MAX_OPERATIONS_FOR_HISTORY) {
        console.log(`[Persistence] History limited: Using last ${convertedOperations.length} of ${totalOperations} operations for undo/redo functionality`);
      } else {
        console.log(`[Persistence] Full history available: Using all ${convertedOperations.length} operations for undo/redo functionality`);
      }

      // Process ALL operations to rebuild the complete whiteboard state
      const linesMap = new Map<string, LineObject>();
      const imagesMap = new Map<string, ImageObject>();
      const deletedLineIds = new Set<string>();
      const deletedImageIds = new Set<string>();

      // First pass: collect all objects that were added
      data?.forEach((operation) => {
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
      data?.forEach((operation) => {
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

      // Reconstruct last activity from the most recent operation
      let reconstructedActivity: ActivityMetadata | null = null;
      if (data && data.length > 0) {
        // Get the last operation (most recent)
        const lastOperation = data[data.length - 1];
        console.log(`[Persistence] Attempting to reconstruct activity from last operation:`, lastOperation);
        
        reconstructedActivity = reconstructActivityFromOperation(lastOperation, finalLines, finalImages);
        
        if (reconstructedActivity) {
          console.log(`[Persistence] Successfully reconstructed last activity:`, reconstructedActivity);
        } else {
          console.log(`[Persistence] Could not reconstruct activity from last operation`);
        }
      }

      setLines(finalLines);
      setImages(finalImages);
      setLastActivity(reconstructedActivity);
      setOrderedOperations(convertedOperations); // NEW: Set ordered operations for history reconstruction
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
    images,
    lastActivity,
    orderedOperations // NEW: Return ordered operations for history reconstruction
  };
};
