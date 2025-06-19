
import React, { useEffect, useCallback, useRef } from 'react';
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
  const whiteboardId = syncConfig?.whiteboardId;
  const whiteboardState = useSharedWhiteboardState(syncConfig, whiteboardId, width, height);
  const isReadOnly = whiteboardState.isReadOnly;
  
  // Add debug logging for read-only state
  console.log('[SyncWhiteboard] Render state:', {
    whiteboardId,
    isReadOnly,
    isReceiveOnly: syncConfig?.isReceiveOnly,
    syncConfigExists: !!syncConfig
  });
  
  // Memoized stroke width handler
  const handleStrokeWidthChange = useCallback((strokeWidth: number) => {
    if (!isReadOnly) {
      whiteboardState.setStrokeWidth(strokeWidth);
    }
  }, [whiteboardState.setStrokeWidth, isReadOnly]);

  // Extract lastActivity and centerOnLastActivity for stable dependencies
  const { getLastActivity, centerOnLastActivity, syncState } = whiteboardState;
  const lastActivity = getLastActivity?.();
  const prevReportedTimestampRef = useRef<number | null>(null);
  const prevSyncStateRef = useRef<any>(null);

  // Consolidated effect for all parent callbacks with reduced logging
  useEffect(() => {
    let hasChanges = false;

    // Handle sync state changes - only if actually changed
    if (onSyncStateChange) {
      const newSyncState = syncConfig ? {
        isConnected: syncState?.isConnected || false,
        isReceiveOnly: syncState?.isReceiveOnly || false
      } : null;
      
      const syncStateChanged = JSON.stringify(newSyncState) !== JSON.stringify(prevSyncStateRef.current);
      if (syncStateChanged) {
        onSyncStateChange(newSyncState);
        prevSyncStateRef.current = newSyncState;
        hasChanges = true;
      }
    }

    // Handle last activity updates - only update if it's new
    if (onLastActivityUpdate && lastActivity) {
      if (lastActivity.timestamp !== prevReportedTimestampRef.current) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SyncWhiteboard] Reporting NEW last activity:', lastActivity);
        }
        onLastActivityUpdate(lastActivity);
        prevReportedTimestampRef.current = lastActivity.timestamp;
        hasChanges = true;
      }
    }

    // Handle center callback updates - only once per mount
    if (onCenterCallbackUpdate && centerOnLastActivity) {
      onCenterCallbackUpdate(centerOnLastActivity);
    }

    // Only log if there were actual changes
    if (hasChanges && process.env.NODE_ENV === 'development') {
      console.log('[SyncWhiteboard] State updated for whiteboard:', whiteboardId);
    }
  }, [
    syncState?.isConnected, 
    syncState?.isReceiveOnly, 
    lastActivity?.timestamp, // Only depend on timestamp to reduce re-renders
    centerOnLastActivity, 
    onSyncStateChange, 
    onLastActivityUpdate, 
    onCenterCallbackUpdate, 
    syncConfig,
    whiteboardId
  ]);

  // Development logging for normalized state - only once
  useEffect(() => {
    if (whiteboardState.normalizedState && process.env.NODE_ENV === 'development') {
      console.log('[SyncWhiteboard] Using normalized state with performance benefits', {
        lineCount: whiteboardState.normalizedState.lineCount,
        imageCount: whiteboardState.normalizedState.imageCount,
        whiteboardId
      });
    }
  }, [whiteboardState.normalizedState?.lineCount, whiteboardState.normalizedState?.imageCount, whiteboardId]);

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
      
      {/* Only show toolbar if not read-only */}
      {!isReadOnly && (
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
      )}
      
      {/* Read-only indicator */}
      {isReadOnly && (
        <div className="absolute top-2 right-2 bg-gray-800/80 text-white text-xs px-2 py-1 rounded">
          Read Only
        </div>
      )}
    </div>
  );
};
