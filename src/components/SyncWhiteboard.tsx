
import React from 'react';
import WhiteboardCanvas from './WhiteboardCanvas';
import MovableToolbar from './MovableToolbar';
import { useSharedWhiteboardState } from '@/hooks/useSharedWhiteboardState';
import { SyncConfig } from '@/types/sync';

interface SyncWhiteboardProps {
  syncConfig?: SyncConfig;
  width: number;
  height: number;
  portalContainer?: Element | null;
  onSyncStateChange?: (syncState: { isConnected: boolean; isReceiveOnly: boolean } | null) => void;
  onLastActivityUpdate?: (activity: any) => void;
  onCenterCallbackUpdate?: (callback: (bounds: any) => void) => void;
}

export const SyncWhiteboard: React.FC<SyncWhiteboardProps> = ({
  syncConfig,
  width,
  height,
  portalContainer,
  onSyncStateChange,
  onLastActivityUpdate,
  onCenterCallbackUpdate
}) => {
  // Use the whiteboard ID from sync config to maintain shared state
  const whiteboardId = syncConfig?.whiteboardId;
  const whiteboardState = useSharedWhiteboardState(syncConfig, whiteboardId, width, height);
  const isReadOnly = whiteboardState.isReadOnly;

  const handleStrokeWidthChange = (width: number) => {
    whiteboardState.setStrokeWidth(width);
  };

  // Pass sync state to parent component for UI display
  React.useEffect(() => {
    if (onSyncStateChange && syncConfig) {
      onSyncStateChange({
        isConnected: whiteboardState.syncState?.isConnected || false,
        isReceiveOnly: whiteboardState.syncState?.isReceiveOnly || false
      });
    } else if (onSyncStateChange) {
      onSyncStateChange(null);
    }
  }, [whiteboardState.syncState?.isConnected, whiteboardState.syncState?.isReceiveOnly, onSyncStateChange, syncConfig]);

  // Pass last activity updates to parent component
  React.useEffect(() => {
    if (onLastActivityUpdate && whiteboardState.getLastActivity) {
      const lastActivity = whiteboardState.getLastActivity();
      if (lastActivity) {
        console.log('[SyncWhiteboard] Reporting last activity:', lastActivity);
        onLastActivityUpdate(lastActivity);
      }
    }
  }, [whiteboardState.state.history, whiteboardState.state.historyIndex, onLastActivityUpdate, whiteboardState.getLastActivity]);

  // Pass center callback to parent component
  React.useEffect(() => {
    if (onCenterCallbackUpdate && whiteboardState.centerOnLastActivity) {
      console.log('[SyncWhiteboard] Providing center callback to parent');
      onCenterCallbackUpdate(whiteboardState.centerOnLastActivity);
    }
  }, [whiteboardState.centerOnLastActivity, onCenterCallbackUpdate]);

  // Log portal container for debugging
  React.useEffect(() => {
    console.log('[SyncWhiteboard] Portal container:', {
      hasContainer: !!portalContainer,
      containerType: portalContainer?.constructor?.name,
      isPopupWindow: portalContainer?.ownerDocument !== document
    });
  }, [portalContainer]);

  // Log normalized state usage
  React.useEffect(() => {
    if (whiteboardState.normalizedState && process.env.NODE_ENV === 'development') {
      console.log('[SyncWhiteboard] Using normalized state with performance benefits', {
        lineCount: whiteboardState.normalizedState.lineCount,
        imageCount: whiteboardState.normalizedState.imageCount,
        whiteboardId
      });
    }
  }, [whiteboardState.normalizedState, whiteboardId]);

  return (
    <div 
      className="relative w-full h-full select-none" 
      data-whiteboard-container
      style={{ 
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: 'none',
        overflow: 'hidden' // Ensure dropdowns don't escape container
      }}
    >
      <WhiteboardCanvas
        width={width}
        height={height}
        whiteboardState={whiteboardState}
        isReadOnly={isReadOnly}
        palmRejectionConfig={{
          maxContactSize: 40,
          minPressure: 0.1,
          palmTimeoutMs: 500,
          clusterDistance: 100,
          preferStylus: true,
          enabled: false
        }}
      />
      <MovableToolbar
        currentTool={whiteboardState.state.currentTool}
        currentStrokeWidth={whiteboardState.state.currentStrokeWidth}
        currentStrokeColor={whiteboardState.state.currentColor}
        pencilSettings={whiteboardState.state.pencilSettings}
        highlighterSettings={whiteboardState.state.highlighterSettings}
        canUndo={whiteboardState.canUndo}
        canRedo={whiteboardState.canRedo}
        onToolChange={whiteboardState.setTool}
        onStrokeWidthChange={handleStrokeWidthChange}
        onStrokeColorChange={whiteboardState.setColor}
        onPencilColorChange={whiteboardState.setPencilColor}
        onHighlighterColorChange={whiteboardState.setHighlighterColor}
        onUndo={whiteboardState.undo}
        onRedo={whiteboardState.redo}
        isReadOnly={isReadOnly}
        containerWidth={width}
        containerHeight={height}
        portalContainer={portalContainer}
      />
    </div>
  );
};
