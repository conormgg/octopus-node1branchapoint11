import { useCallback } from 'react';
import { SelectionBounds, LineObject, ImageObject, SelectedObject } from '@/types/whiteboard';

export interface TransformMatrix {
  scaleX: number;
  scaleY: number;
  rotation: number;
  translateX: number;
  translateY: number;
}

export const useSelect2Transform = () => {
  // Calculate transform matrix from bounds change
  const calculateTransformMatrix = useCallback((
    initialBounds: SelectionBounds,
    currentBounds: SelectionBounds,
    rotation: number = 0
  ): TransformMatrix => {
    const scaleX = currentBounds.width / initialBounds.width;
    const scaleY = currentBounds.height / initialBounds.height;
    const translateX = currentBounds.x - initialBounds.x;
    const translateY = currentBounds.y - initialBounds.y;

    return {
      scaleX,
      scaleY,
      rotation,
      translateX,
      translateY
    };
  }, []);

  // Apply transform matrix to a point
  const transformPoint = useCallback((
    point: { x: number; y: number },
    centerX: number,
    centerY: number,
    matrix: TransformMatrix
  ) => {
    // Translate to origin
    let x = point.x - centerX;
    let y = point.y - centerY;

    // Apply rotation first
    if (matrix.rotation !== 0) {
      const rad = (matrix.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rotatedX = x * cos - y * sin;
      const rotatedY = x * sin + y * cos;
      x = rotatedX;
      y = rotatedY;
    }

    // Apply scale only if it's not a pure rotation
    if (matrix.scaleX !== 1 || matrix.scaleY !== 1) {
      x *= matrix.scaleX;
      y *= matrix.scaleY;
    }

    // Translate back to center, then apply additional translation only if needed
    x += centerX;
    y += centerY;
    
    // For pure rotation, don't apply translation offset
    if (matrix.scaleX === 1 && matrix.scaleY === 1 && matrix.rotation !== 0) {
      // Pure rotation: no additional translation
      return { x, y };
    } else {
      // Scale/resize operations: apply translation
      x += matrix.translateX;
      y += matrix.translateY;
      return { x, y };
    }
  }, []);

  // Calculate new object bounds after transform
  const transformObjectBounds = useCallback((
    object: SelectedObject,
    lines: LineObject[],
    images: ImageObject[],
    groupCenter: { x: number; y: number },
    matrix: TransformMatrix
  ) => {
    if (object.type === 'line') {
      const line = lines.find(l => l.id === object.id);
      if (!line) return null;

      // Transform line position
      const newPosition = transformPoint(
        { x: line.x, y: line.y },
        groupCenter.x,
        groupCenter.y,
        matrix
      );

      // Transform each point in the line
      const newPoints: number[] = [];
      for (let i = 0; i < line.points.length; i += 2) {
        const originalX = line.points[i];
        const originalY = line.points[i + 1];
        
        // Convert relative point to absolute coordinates
        const absolutePoint = { x: line.x + originalX, y: line.y + originalY };
        
        // Apply full transform (scale + rotation) to the absolute point
        const transformedPoint = transformPoint(
          absolutePoint,
          groupCenter.x,
          groupCenter.y,
          matrix
        );
        
        // Convert back to relative coordinates based on new line position
        const relativeX = transformedPoint.x - newPosition.x;
        const relativeY = transformedPoint.y - newPosition.y;
        
        newPoints.push(relativeX, relativeY);
      }

      return {
        x: newPosition.x,
        y: newPosition.y,
        points: newPoints,
        strokeWidth: line.strokeWidth * Math.min(matrix.scaleX, matrix.scaleY)
      };
    } else if (object.type === 'image') {
      const image = images.find(i => i.id === object.id);
      if (!image) return null;

      const width = image.width || 100;
      const height = image.height || 100;

      // For pure rotation (no scale or translation), handle differently
      if (matrix.rotation !== 0 && matrix.scaleX === 1 && matrix.scaleY === 1 && matrix.translateX === 0 && matrix.translateY === 0) {
        // Pure rotation: rotate around group center without translation
        const imageCenter = { x: image.x + width / 2, y: image.y + height / 2 };
        const rotatedCenter = transformPoint(imageCenter, groupCenter.x, groupCenter.y, matrix);
        
        return {
          x: rotatedCenter.x - width / 2,
          y: rotatedCenter.y - height / 2,
          width: width,
          height: height
        };
      } else {
        // Transform image position for scale/translate operations
        const newPosition = transformPoint(
          { x: image.x, y: image.y },
          groupCenter.x,
          groupCenter.y,
          matrix
        );

        return {
          x: newPosition.x,
          y: newPosition.y,
          width: width * matrix.scaleX,
          height: height * matrix.scaleY
        };
      }
    }

    return null;
  }, [transformPoint]);

  // Calculate resize constraints
  const calculateResizeConstraints = useCallback((
    initialBounds: SelectionBounds,
    maintainAspectRatio: boolean = false
  ) => {
    const minSize = 10; // Minimum size in pixels
    const minScaleX = minSize / initialBounds.width;
    const minScaleY = minSize / initialBounds.height;

    return {
      minScaleX,
      minScaleY,
      maintainAspectRatio
    };
  }, []);

  // Apply constraints to transform
  const applyTransformConstraints = useCallback((
    matrix: TransformMatrix,
    constraints: ReturnType<typeof calculateResizeConstraints>
  ): TransformMatrix => {
    let { scaleX, scaleY } = matrix;

    // Apply minimum scale constraints
    scaleX = Math.max(scaleX, constraints.minScaleX);
    scaleY = Math.max(scaleY, constraints.minScaleY);

    // Apply aspect ratio constraint if needed
    if (constraints.maintainAspectRatio) {
      const aspectRatio = Math.min(scaleX, scaleY);
      scaleX = aspectRatio;
      scaleY = aspectRatio;
    }

    return {
      ...matrix,
      scaleX,
      scaleY
    };
  }, []);

  // Calculate rotation in 15-degree increments
  const snapRotation = useCallback((rotation: number): number => {
    const snapAngle = 15;
    return Math.round(rotation / snapAngle) * snapAngle;
  }, []);

  // Convert screen coordinates to world coordinates for transform calculations
  const screenToWorldTransform = useCallback((
    screenPoint: { x: number; y: number },
    panZoomState: { x: number; y: number; scale: number },
    containerRect: DOMRect
  ) => {
    const x = (screenPoint.x - containerRect.left - panZoomState.x) / panZoomState.scale;
    const y = (screenPoint.y - containerRect.top - panZoomState.y) / panZoomState.scale;
    return { x, y };
  }, []);

  return {
    calculateTransformMatrix,
    transformPoint,
    transformObjectBounds,
    calculateResizeConstraints,
    applyTransformConstraints,
    snapRotation,
    screenToWorldTransform
  };
};