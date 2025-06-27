
import { useEffect, useRef } from 'react';
import Konva from 'konva';

interface UseToolSyncHandlerProps {
  stageRef: React.RefObject<Konva.Stage>;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const useToolSyncHandler = ({
  stageRef,
  containerRef
}: UseToolSyncHandlerProps) => {
  const currentToolRef = useRef<string>('pencil');

  // Update current tool ref by tracking the stage attribute
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const updateTool = () => {
      const newTool = stage.getAttr('currentTool') as string;
      if (newTool && newTool !== currentToolRef.current) {
        currentToolRef.current = newTool;
        // Update touch-action when tool changes
        const container = containerRef.current;
        if (container) {
          container.style.touchAction = newTool === 'select' ? 'manipulation' : 'none';
        }
      }
    };
    
    // Initial update
    updateTool();
    
    // Listen for attribute changes
    const interval = setInterval(updateTool, 100);
    
    return () => clearInterval(interval);
  }, [stageRef, containerRef]);

  return { currentToolRef };
};
