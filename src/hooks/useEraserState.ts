import { useCallback, useRef } from 'react';
import { LineObject, Tool } from '@/types/whiteboard';

// Apply transformation matrix to a point
const transformPoint = (
  point: { x: number; y: number },
  line: LineObject
): { x: number; y: number } => {
  // Get transformation values with defaults
  const lineX = line.x || 0;
  const lineY = line.y || 0;
  const scaleX = line.scaleX || 1;
  const scaleY = line.scaleY || 1;
  const rotation = line.rotation || 0;
  
  // Apply scale
  let transformedX = point.x * scaleX;
  let transformedY = point.y * scaleY;
  
  // Apply rotation (convert degrees to radians)
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  const rotatedX = transformedX * cos - transformedY * sin;
  const rotatedY = transformedX * sin + transformedY * cos;
  
  // Apply translation
  return {
    x: rotatedX + lineX,
    y: rotatedY + lineY
  };
};

// Utility function to check if a point is near a line stroke
const isPointNearStroke = (
  point: { x: number; y: number },
  line: LineObject,
  threshold: number
): boolean => {
  if (line.tool === 'eraser') return false; // Don't erase eraser strokes
  
  const points = line.points;
  if (points.length < 4) return false; // Need at least 2 points (x,y pairs)
  
  // Check distance to line segments with transformation applied
  for (let i = 0; i < points.length - 2; i += 2) {
    const lineStart = transformPoint(
      { x: points[i], y: points[i + 1] },
      line
    );
    const lineEnd = transformPoint(
      { x: points[i + 2], y: points[i + 3] },
      line
    );
    
    const distance = distanceToLineSegment(point, lineStart, lineEnd);
    if (distance < threshold) {
      return true;
    }
  }
  
  return false;
};

// Calculate distance from point to line segment
const distanceToLineSegment = (
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  // Line segment is actually a point
  if (dx === 0 && dy === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
    );
  }
  
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
  
  if (t < 0) {
    // Point is nearest to the start point
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
    );
  }
  if (t > 1) {
    // Point is nearest to the end point
    return Math.sqrt(
      Math.pow(point.x - lineEnd.x, 2) + Math.pow(point.y - lineEnd.y, 2)
    );
  }
  
  // Point is nearest to the middle of the line segment
  const nearestX = lineStart.x + t * dx;
  const nearestY = lineStart.y + t * dy;
  return Math.sqrt(
    Math.pow(point.x - nearestX, 2) + Math.pow(point.y - nearestY, 2)
  );
};

export const useEraserState = (
  state: {
    currentTool: Tool;
    currentStrokeWidth: number;
    lines: LineObject[];
    isDrawing: boolean;
  },
  setState: (updater: (prev: any) => any) => void,
  addToHistory: (lines: LineObject[]) => void
) => {
  const erasedLinesRef = useRef(new Set<string>());
  
  const startErasing = useCallback((x: number, y: number) => {
    if (state.currentTool !== 'eraser') return;
    
    addToHistory(state.lines); // Save state before erasing starts
    
    // Reset the set of erased strokes for this erasing session
    erasedLinesRef.current = new Set<string>();
    
    // Check for strokes to erase at the starting point
    const point = { x, y };
    const threshold = state.currentStrokeWidth / 2;
    
    setState(prev => {
      const updatedLines = prev.lines.filter(line => {
        // Only check strokes that haven't been erased yet in this session
        if (erasedLinesRef.current.has(line.id)) return false;
        
        const shouldKeep = !isPointNearStroke(point, line, threshold);
        if (!shouldKeep) {
          erasedLinesRef.current.add(line.id);
        }
        return shouldKeep;
      });
      
      return {
        ...prev,
        lines: updatedLines,
        isDrawing: true
      };
    });
  }, [state.currentTool, state.currentStrokeWidth, state.lines, setState, addToHistory]);
  
  const continueErasing = useCallback((x: number, y: number) => {
    if (!state.isDrawing || state.currentTool !== 'eraser') return;
    
    const point = { x, y };
    const threshold = state.currentStrokeWidth / 2;
    
    setState(prev => {
      const updatedLines = prev.lines.filter(line => {
        // Only check strokes that haven't been erased yet in this session
        if (erasedLinesRef.current.has(line.id)) return false;
        
        const shouldKeep = !isPointNearStroke(point, line, threshold);
        if (!shouldKeep) {
          erasedLinesRef.current.add(line.id);
        }
        return shouldKeep;
      });
      
      return {
        ...prev,
        lines: updatedLines
      };
    });
  }, [state.isDrawing, state.currentTool, state.currentStrokeWidth, setState]);
  
  const stopErasing = useCallback(() => {
    if (!state.isDrawing) return;
    
    setState(prev => ({
      ...prev,
      isDrawing: false
    }));
    
    // Clear the set of erased strokes for the next erasing session
    erasedLinesRef.current.clear();
  }, [state.isDrawing, setState]);
  
  return {
    startErasing,
    continueErasing,
    stopErasing
  };
};
