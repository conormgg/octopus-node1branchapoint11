
import React from 'react';
import WhiteboardCanvas from './WhiteboardCanvas';
import MovableToolbar from './MovableToolbar';
import ErrorBoundary from './ErrorBoundary';
import { useSyncWhiteboardState } from '@/hooks/useSyncWhiteboardState';
import { SyncConfig } from '@/types/sync';

interface SyncWhiteboardProps {
  syncConfig?: SyncConfig;
  width: number;
  height: number;
}

export const SyncWhiteboard: React.FC<SyncWhiteboardProps> = ({
  syncConfig,
  width,
  height
}) => {
  const whiteboardState = useSyncWhiteboardState(syncConfig);
  const isReadOnly = whiteboardState.isReadOnly;

  const handleStrokeWidthChange = (width: number) => {
    whiteboardState.setStrokeWidth(width);
  };

  return (
    <ErrorBoundary>
      <div className="relative w-full h-full">
        {/* Sync status indicator */}
        {syncConfig && (
          <div className="absolute top-2 right-2 z-20 flex items-center space-x-2 text-sm">
            <div 
              className={`w-3 h-3 rounded-full ${whiteboardState.syncState?.isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-gray-700">
              {whiteboardState.syncState?.isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {whiteboardState.syncState?.isReceiveOnly && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Read Only</span>
            )}
            {whiteboardState.syncState?.pendingOperations && whiteboardState.syncState.pendingOperations.length > 0 && (
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
            width={width}
            height={height}
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
