
import React, { useState, useEffect, useRef } from 'react';
import { WhiteboardProvider } from '@/contexts/WhiteboardContext';
import { SyncConfig } from '@/types/sync';
import WhiteboardCanvas from './WhiteboardCanvas';
import MovableToolbar from './MovableToolbar';
import ErrorBoundary from './ErrorBoundary';
import { useWhiteboard } from '@/contexts/WhiteboardContext';

interface UnifiedWhiteboardProps {
  syncConfig?: SyncConfig;
  isReadOnly?: boolean;
  showSyncStatus?: boolean;
}

const WhiteboardContent: React.FC<{
  showSyncStatus?: boolean;
}> = ({ showSyncStatus = false }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { whiteboardState, isReadOnly } = useWhiteboard();

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
        {/* Sync status indicator */}
        {showSyncStatus && whiteboardState.syncState && (
          <div className="absolute top-2 right-2 z-20 flex items-center space-x-2 text-sm">
            <div 
              className={`w-3 h-3 rounded-full ${whiteboardState.syncState.isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-gray-700">
              {whiteboardState.syncState.isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {whiteboardState.syncState.isReceiveOnly && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Read Only</span>
            )}
            {whiteboardState.syncState.pendingOperations && whiteboardState.syncState.pendingOperations.length > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                Syncing... ({whiteboardState.syncState.pendingOperations.length})
              </span>
            )}
          </div>
        )}

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

const UnifiedWhiteboard: React.FC<UnifiedWhiteboardProps> = ({
  syncConfig,
  isReadOnly = false,
  showSyncStatus = false
}) => {
  return (
    <WhiteboardProvider syncConfig={syncConfig} isReadOnly={isReadOnly}>
      <WhiteboardContent showSyncStatus={showSyncStatus} />
    </WhiteboardProvider>
  );
};

export default UnifiedWhiteboard;
