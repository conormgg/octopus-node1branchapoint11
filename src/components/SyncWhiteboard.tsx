
import React, { useEffect, useCallback, useRef } from 'react';
import WhiteboardCanvas from './WhiteboardCanvas';
import MovableToolbar from './MovableToolbar';
import { useSharedWhiteboardState } from '@/hooks/useSharedWhiteboardState';
import { SyncConfig } from '@/types/sync';
import { ActivityMetadata } from '@/types/whiteboard';
import { createDebugLogger, logError } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('sync');

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
  const whiteboardState = useSharedWhiteboardState(whiteboardId, syncConfig);
  const isReadOnly = whiteboardState.isReadOnly;
  
  // Enhanced logging for sync config changes and toolbar visibility
  const prevSyncConfigRef = useRef<SyncConfig | undefined>(undefined);
  const prevReadOnlyRef = useRef<boolean | null>(null);
  
  if (JSON.stringify(prevSyncConfigRef.current) !== JSON.stringify(syncConfig)) {
    debugLog('Component', 'Sync config changed', {
      whiteboardId,
      oldConfig: prevSyncConfigRef.current,
      newConfig: syncConfig,
      isReceiveOnly: syncConfig?.isReceiveOnly
    });
    prevSyncConfigRef.current = syncConfig;
  }
  
  if (prevReadOnlyRef.current !== isReadOnly) {
    debugLog('Component', 'Read-only state changed - toolbar visibility affected', {
      whiteboardId,
      wasReadOnly: prevReadOnlyRef.current,
      isReadOnly,
      toolbarVisible: !isReadOnly,
      syncConfigExists: !!syncConfig
    });
    prevReadOnlyRef.current = isReadOnly;
  }
  
  // Memoized stroke width handler
  const handleStrokeWidthChange = useCallback((strokeWidth: number) => {
    if (!isReadOnly) {
      whiteboardState.setStrokeWidth(strokeWidth);
    }
  }, [whiteboardState.setStrokeWidth, isReadOnly]);

  // Extract stable references to prevent unnecessary re-renders
  const { getLastActivity, centerOnLastActivity, syncState } = whiteboardState;
  const lastActivity = getLastActivity?.();
  const prevReportedTimestampRef = useRef<number | null>(null);
  const prevSyncStateRef = useRef<any>(null);

  // Optimized effect with stable dependencies
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
        debugLog('StateUpdate', 'Sync state propagated to parent', { whiteboardId, newSyncState });
      }
    }

    // Handle last activity updates - only update if it's genuinely new
    if (onLastActivityUpdate && lastActivity) {
      if (lastActivity.timestamp !== prevReportedTimestampRef.current) {
        onLastActivityUpdate(lastActivity);
        prevReportedTimestampRef.current = lastActivity.timestamp;
        hasChanges = true;
      }
    }

    // Handle center callback updates - only once per mount
    if (onCenterCallbackUpdate && centerOnLastActivity) {
      onCenterCallbackUpdate(centerOnLastActivity);
    }

    // Only log when there are actual changes
    if (hasChanges) {
      debugLog('StateUpdate', 'State updated for whiteboard', { whiteboardId });
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
        setStageRef={whiteboardState.setStageRef}
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
