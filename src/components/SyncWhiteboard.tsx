
import React, { useEffect, useCallback } from 'react';
import WhiteboardCanvas from './WhiteboardCanvas';
import MovableToolbar from './MovableToolbar';
import { useSharedWhiteboardState } from '@/hooks/useSharedWhiteboardState';
import { SyncConfig } from '@/types/sync';
import { ActivityMetadata } from '@/types/whiteboard';

interface SyncWhiteboardProps {
  syncConfig?: SyncConfig;
  width: number;
  height: number;
  portalContainer?: Element | null;
  onSyncStateChange?: (syncState: { isConnected: boolean; isReceiveOnly: boolean } | null) => void;
  onLastActivityUpdate?: (activity: ActivityMetadata | null) => void;
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

  // Memoized stroke width handler
  const handleStrokeWidthChange = useCallback((strokeWidth: number) => {
    whiteboardState.setStrokeWidth(strokeWidth);
  }, [whiteboardState.setStrokeWidth]);

  // Consolidated effect for all parent callbacks
  useEffect(() => {
    // Handle sync state changes
    if (onSyncStateChange) {
      const syncState = syncConfig ? {
        isConnected: whiteboardState.syncState?.isConnected || false,
        isReceiveOnly: whiteboardState.syncState?.isReceiveOnly || false
      } : null;
      onSyncStateChange(syncState);
    }

    // Handle last activity updates
    if (onLastActivityUpdate && whiteboardState.getLastActivity) {
      const lastActivity = whiteboardState.getLastActivity();
      if (lastActivity) {
        console.log('[SyncWhiteboard] Reporting last activity:', lastActivity);
        onLastActivityUpdate(lastActivity);
      }
    }

    // Handle center callback updates
    if (onCenterCallbackUpdate && whiteboardState.centerOnLastActivity) {
      console.log('[SyncWhiteboard] Providing center callback to parent');
      onCenterCallbackUpdate(whiteboardState.centerOnLastActivity);
    }
  }, [
    whiteboardState.syncState?.isConnected,
    whiteboardState.syncState?.isReceiveOnly,
    whiteboardState.state.history,
    whiteboardState.state.historyIndex,
    whiteboardState.centerOnLastActivity,
    syncConfig,
    onSyncStateChange,
    onLastActivityUpdate,
    onCenterCallbackUpdate,
    whiteboardState.getLastActivity
  ]);

  // Development logging for normalized state
  useEffect(() => {
    if (whiteboardState.normalizedState && process.env.NODE_ENV === 'development') {
      console.log('[SyncWhiteboard] Using normalized state with performance benefits', {
        lineCount: whiteboardState.normalizedState.lineCount,
        imageCount: whiteboardState.normalizedState.imageCount,
        whiteboardId
      });
    }
  }, [whiteboardState.normalizedState, whiteboardId]);

  // Container styles for proper isolation
  const containerStyles = {
    WebkitUserSelect: 'none' as const,
    WebkitTouchCallout: 'none' as const,
    touchAction: 'none' as const,
    overflow: 'hidden' as const
  };

  return (
    <div 
      className="relative w-full h-full select-none" 
      data-whiteboard-container
      style={containerStyles}
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
