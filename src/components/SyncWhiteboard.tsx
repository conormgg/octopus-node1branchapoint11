
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

  // Determine connection status with better handling of transient states
  const getConnectionStatus = () => {
    if (!syncConfig) return { color: 'bg-gray-500', text: 'Local', show: false };
    
    const isConnected = whiteboardState.syncState?.isConnected;
    const hasPendingOps = (whiteboardState.syncState?.pendingOperations?.length || 0) > 0;
    
    if (isConnected && !hasPendingOps) {
      return { color: 'bg-green-500', text: 'Connected', show: true };
    } else if (isConnected && hasPendingOps) {
      return { color: 'bg-yellow-500', text: 'Syncing...', show: true };
    } else if (!isConnected && hasPendingOps) {
      return { color: 'bg-orange-500', text: 'Reconnecting...', show: true };
    } else {
      return { color: 'bg-red-500', text: 'Disconnected', show: true };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="relative w-full h-full select-none" style={{ 
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      touchAction: 'none'
    }}>
      {/* Sync status indicator - only show for synced boards */}
      {connectionStatus.show && (
        <div className="absolute top-2 right-2 z-20 flex items-center space-x-2 text-sm">
          <div className={`w-3 h-3 rounded-full ${connectionStatus.color}`} />
          <span className="text-gray-700">
            {connectionStatus.text}
          </span>
          {whiteboardState.syncState?.isReceiveOnly && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Read Only</span>
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
