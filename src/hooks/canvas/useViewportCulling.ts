
import React from 'react';
import { LineObject } from '@/types/whiteboard';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';
const USE_VIEWPORT_CULLING = true;

const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[ViewportCulling:${context}] ${action}`, data || '');
  }
};

interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export const useViewportCulling = (stageRef?: React.RefObject<any>) => {
  // Calculate current viewport bounds
  const getViewportBounds = React.useCallback((): ViewportBounds | null => {
    if (!stageRef?.current) return null;
    
    const stage = stageRef.current;
    const scale = stage.scaleX(); // Assume uniform scaling
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    
    // Convert stage coordinates to world coordinates
    const worldX = -stage.x() / scale;
    const worldY = -stage.y() / scale;
    const worldWidth = stageWidth / scale;
    const worldHeight = stageHeight / scale;
    
    return {
      x: worldX,
      y: worldY,
      width: worldWidth,
      height: worldHeight,
      scale
    };
  }, [stageRef]);

  // Check if a line is within viewport bounds
  const isLineInViewport = React.useCallback((line: LineObject, viewport: ViewportBounds) => {
    if (!viewport || !USE_VIEWPORT_CULLING) return true;
    
    // Calculate line bounds from points
    const points = line.points;
    if (points.length < 2) return true; // Always show incomplete lines
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i] + line.x;
      const y = points[i + 1] + line.y;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    
    // Add buffer zone around viewport for smooth scrolling
    const buffer = 100;
    const viewportLeft = viewport.x - buffer;
    const viewportTop = viewport.y - buffer;
    const viewportRight = viewport.x + viewport.width + buffer;
    const viewportBottom = viewport.y + viewport.height + buffer;
    
    // Check if line bounds intersect with viewport
    const isVisible = !(
      maxX < viewportLeft ||
      minX > viewportRight ||
      maxY < viewportTop ||
      minY > viewportBottom
    );
    
    return isVisible;
  }, []);

  // Apply viewport culling to lines
  const cullLines = React.useCallback((lines: LineObject[]) => {
    const viewport = getViewportBounds();
    
    if (!USE_VIEWPORT_CULLING || !viewport) {
      return lines;
    }
    
    const visibleLines = lines.filter(line => 
      line && isLineInViewport(line, viewport)
    );
    
    if (DEBUG_ENABLED && lines.length > 0) {
      debugLog('Culling', 'Viewport culling results', {
        totalLines: lines.length,
        visibleLines: visibleLines.length,
        culledLines: lines.length - visibleLines.length,
        viewport: {
          x: Math.round(viewport.x),
          y: Math.round(viewport.y),
          width: Math.round(viewport.width),
          height: Math.round(viewport.height),
          scale: viewport.scale.toFixed(2)
        }
      });
    }
    
    return visibleLines;
  }, [getViewportBounds, isLineInViewport]);

  return {
    getViewportBounds,
    isLineInViewport,
    cullLines
  };
};
