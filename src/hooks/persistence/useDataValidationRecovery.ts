import { useCallback, useRef } from 'react';
import { WhiteboardState, LineObject, ImageObject } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('state');

interface DataLossIncident {
  timestamp: number;
  whiteboardId: string;
  lossType: 'lines' | 'images' | 'both';
  beforeCount: { lines: number; images: number };
  afterCount: { lines: number; images: number };
  stackTrace: string;
}

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  recoverable: boolean;
}

/**
 * @hook useDataValidationRecovery
 * @description Provides data validation and automatic recovery mechanisms
 */
export const useDataValidationRecovery = (whiteboardId?: string) => {
  const dataLossHistory = useRef<DataLossIncident[]>([]);
  const lastValidState = useRef<{ lines: LineObject[]; images: ImageObject[]; } | null>(null);

  /**
   * Validates whiteboard state for data consistency
   */
  const validateState = useCallback((state: WhiteboardState): ValidationResult => {
    const issues: string[] = [];
    let recoverable = true;

    // Check for null/undefined data
    if (!state.lines) {
      issues.push('Lines array is null or undefined');
      recoverable = false;
    }
    if (!state.images) {
      issues.push('Images array is null or undefined');
      recoverable = false;
    }

    // Check for data integrity
    if (state.lines && Array.isArray(state.lines)) {
      const invalidLines = state.lines.filter(line => 
        !line.id || !line.points || !Array.isArray(line.points) || line.points.length === 0
      );
      if (invalidLines.length > 0) {
        issues.push(`Found ${invalidLines.length} invalid lines without proper ID or points`);
      }

      // Check for duplicate IDs
      const lineIds = state.lines.map(l => l.id);
      const uniqueLineIds = new Set(lineIds);
      if (lineIds.length !== uniqueLineIds.size) {
        issues.push(`Found duplicate line IDs: ${lineIds.length - uniqueLineIds.size} duplicates`);
      }
    }

    if (state.images && Array.isArray(state.images)) {
      const invalidImages = state.images.filter(img => 
        !img.id || !img.src || typeof img.x !== 'number' || typeof img.y !== 'number'
      );
      if (invalidImages.length > 0) {
        issues.push(`Found ${invalidImages.length} invalid images without proper ID, src, or coordinates`);
      }

      // Check for duplicate IDs
      const imageIds = state.images.map(i => i.id);
      const uniqueImageIds = new Set(imageIds);
      if (imageIds.length !== uniqueImageIds.size) {
        issues.push(`Found duplicate image IDs: ${imageIds.length - uniqueImageIds.size} duplicates`);
      }
    }

    // Check history integrity
    if (!state.history || !Array.isArray(state.history) || state.history.length === 0) {
      issues.push('History is missing or empty');
    }

    if (typeof state.historyIndex !== 'number' || state.historyIndex < 0 || 
        (state.history && state.historyIndex >= state.history.length)) {
      issues.push('History index is invalid');
    }

    const isValid = issues.length === 0;
    
    if (!isValid) {
      debugLog('Validation', `State validation failed for ${whiteboardId}`, { issues, recoverable });
    }

    return { isValid, issues, recoverable };
  }, [whiteboardId]);

  /**
   * Records a data loss incident for analysis
   */
  const recordDataLoss = useCallback((
    lossType: 'lines' | 'images' | 'both',
    beforeCount: { lines: number; images: number },
    afterCount: { lines: number; images: number }
  ) => {
    const incident: DataLossIncident = {
      timestamp: Date.now(),
      whiteboardId: whiteboardId || 'unknown',
      lossType,
      beforeCount,
      afterCount,
      stackTrace: new Error().stack || 'No stack trace available'
    };

    dataLossHistory.current.push(incident);
    
    // Keep only last 50 incidents to prevent memory leak
    if (dataLossHistory.current.length > 50) {
      dataLossHistory.current = dataLossHistory.current.slice(-50);
    }

    debugLog('DataLoss', `Data loss incident recorded for ${whiteboardId}`, incident);
    
    // Log to console for immediate visibility
    console.error(`[DataLoss] ${lossType} data loss detected in ${whiteboardId}:`, {
      before: beforeCount,
      after: afterCount,
      lossPercentage: {
        lines: beforeCount.lines > 0 ? ((beforeCount.lines - afterCount.lines) / beforeCount.lines * 100).toFixed(1) + '%' : '0%',
        images: beforeCount.images > 0 ? ((beforeCount.images - afterCount.images) / beforeCount.images * 100).toFixed(1) + '%' : '0%'
      }
    });
  }, [whiteboardId]);

  /**
   * Attempts to recover lost data using the last valid state
   */
  const attemptRecovery = useCallback((currentState: WhiteboardState): WhiteboardState | null => {
    if (!lastValidState.current) {
      debugLog('Recovery', 'No valid state available for recovery');
      return null;
    }

    const recovered = {
      ...currentState,
      lines: [...lastValidState.current.lines, ...currentState.lines].filter((line, index, arr) => 
        arr.findIndex(l => l.id === line.id) === index
      ),
      images: [...lastValidState.current.images, ...currentState.images].filter((img, index, arr) => 
        arr.findIndex(i => i.id === img.id) === index
      )
    };

    debugLog('Recovery', `Attempted recovery for ${whiteboardId}`, {
      originalLines: currentState.lines.length,
      originalImages: currentState.images.length,
      recoveredLines: recovered.lines.length,
      recoveredImages: recovered.images.length
    });

    return recovered;
  }, [whiteboardId]);

  /**
   * Updates the last valid state backup
   */
  const updateValidStateBackup = useCallback((state: WhiteboardState) => {
    if (validateState(state).isValid) {
      lastValidState.current = {
        lines: [...state.lines],
        images: [...state.images]
      };
    }
  }, [validateState]);

  /**
   * Performs comprehensive state transition validation
   */
  const validateStateTransition = useCallback((
    beforeState: WhiteboardState,
    afterState: WhiteboardState
  ): boolean => {
    const beforeValidation = validateState(beforeState);
    const afterValidation = validateState(afterState);

    if (!afterValidation.isValid) {
      debugLog('Transition', `Invalid after-state detected for ${whiteboardId}`, afterValidation.issues);
      return false;
    }

    // Check for unexpected data loss
    const beforeCount = { lines: beforeState.lines.length, images: beforeState.images.length };
    const afterCount = { lines: afterState.lines.length, images: afterState.images.length };

    const linesLoss = beforeCount.lines - afterCount.lines;
    const imagesLoss = beforeCount.images - afterCount.images;

    // Consider significant loss (>30% reduction) as suspicious
    const significantLinesLoss = linesLoss > beforeCount.lines * 0.3 && beforeCount.lines > 3;
    const significantImagesLoss = imagesLoss > beforeCount.images * 0.3 && beforeCount.images > 1;

    if (significantLinesLoss || significantImagesLoss) {
      let lossType: 'lines' | 'images' | 'both' = 'lines';
      if (significantLinesLoss && significantImagesLoss) lossType = 'both';
      else if (significantImagesLoss) lossType = 'images';

      recordDataLoss(lossType, beforeCount, afterCount);
      return false;
    }

    return true;
  }, [validateState, recordDataLoss, whiteboardId]);

  /**
   * Gets data loss history for debugging
   */
  const getDataLossHistory = useCallback(() => {
    return [...dataLossHistory.current];
  }, []);

  return {
    validateState,
    validateStateTransition,
    attemptRecovery,
    updateValidStateBackup,
    recordDataLoss,
    getDataLossHistory
  };
};
