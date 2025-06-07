
import React from 'react';
import WhiteboardCanvas from './WhiteboardCanvas';
import MovableToolbar from './MovableToolbar';
import { useSharedWhiteboardState } from '@/hooks/useSharedWhiteboardState';
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
  // Use the whiteboard ID from sync config to maintain shared state
  const whiteboardId = syncConfig?.whiteboardId;
  const whiteboardState = useSharedWhiteboardState(syncConfig, whiteboardId);
  const isReadOnly = whiteboardState.isReadOnly;

  const handleStrokeWidthChange = (width: number) => {
    whiteboardState.setStrokeWidth(width);
  };

  // Log connection details for debugging
  React.useEffect(() => {
    if (syncConfig) {
      console.log('SyncWhiteboard initialized:', {
        whiteboardId: syncConfig.whiteboardId,
        senderId: syncConfig.senderId,
        sessionId: syncConfig.sessionId,
        isReceiveOnly: syncConfig.isReceiveOnly,
        isConnected: whiteboardState.syncState?.isConnected
      });
    }
  }, [syncConfig, whiteboardState.syncState?.isConnected]);

  return (
    <div className="relative w-full h-full select-none" style={{ 
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      touchAction: 'none'
    }}>
      {/* Enhanced sync status indicator with more details */}
      {syncConfig && (
        <div className="absolute top-2 right-2 z-20 flex flex-col items-end space-y-1">
          <div className="flex items-center space-x-2 text-sm bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
            <div 
              className={`w-3 h-3 rounded-full ${whiteboardState.syncState?.isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-gray-700">
              {whiteboardState.syncState?.isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {whiteboardState.syncState?.isReceiveOnly && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Read Only</span>
            )}
          </div>
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 bg-white/80 backdrop-blur-sm rounded px-2 py-1">
              ID: {syncConfig.whiteboardId}
            </div>
          )}
        </div>
      )}

      <WhiteboardCanvas
        width={width}
        height={height}
        whiteboardState={whiteboardState}
        isReadOnly={isReadOnly}
      />
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
    </div>
  );
};
