
import React, { useState, useEffect } from 'react';
import WhiteboardCanvas from './WhiteboardCanvas';
import MovableToolbar from './MovableToolbar';
import ErrorBoundary from './ErrorBoundary';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';

interface WhiteboardProps {
  isReadOnly?: boolean;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ isReadOnly = false }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const whiteboardState = useWhiteboardState();

  const updateDimensions = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const handleStrokeWidthChange = (width: number) => {
    whiteboardState.setStrokeWidth(width);
  };

  return (
    <ErrorBoundary>
      <div ref={containerRef} className="relative w-full h-full">
        <ErrorBoundary fallback={
          <div className="flex items-center justify-center h-full bg-gray-50 border border-gray-200 rounded">
            <p className="text-gray-500">Failed to load whiteboard canvas</p>
          </div>
        }>
          <WhiteboardCanvas
            width={dimensions.width}
            height={dimensions.height}
            whiteboardState={whiteboardState}
            isReadOnly={isReadOnly}
          />
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className="absolute bottom-4 left-4 p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 text-sm">Toolbar unavailable</p>
          </div>
        }>
          <MovableToolbar
            currentTool={whiteboardState.state.currentTool}
            currentStrokeWidth={whiteboardState.state.currentStrokeWidth}
            canUndo={whiteboardState.canUndo}
            canRedo={whiteboardState.canRedo}
            onToolChange={whiteboardState.setTool}
            onStrokeWidthChange={handleStrokeWidthChange}
            onUndo={whiteboardState.undo}
            onRedo={whiteboardState.redo}
            isReadOnly={isReadOnly}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default Whiteboard;
