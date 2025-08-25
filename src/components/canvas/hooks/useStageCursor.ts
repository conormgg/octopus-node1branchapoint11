
import { useMemo } from 'react';
import { Tool } from '@/types/whiteboard';

interface UseStageCursorProps {
  currentTool: Tool;
  selection?: {
    hoveredObjectId: string | null;
  };
}

export const useStageCursor = ({ currentTool, selection }: UseStageCursorProps) => {
  const cursor = useMemo(() => {
    if (currentTool === 'eraser') return 'crosshair';
    // Original select tool removed
    return 'default';
  }, [currentTool, selection?.hoveredObjectId]);

  return cursor;
};
