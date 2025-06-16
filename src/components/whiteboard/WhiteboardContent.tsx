
import React, { useEffect, useState } from 'react';
import KonvaStage from '@/components/canvas/KonvaStage';
import { useSharedWhiteboardState } from '@/hooks/useSharedWhiteboardState';
import { useSharedNormalizedState } from '@/hooks/shared/useSharedNormalizedState';
import { SyncConfig } from '@/types/sync';

interface WhiteboardContentProps {
  whiteboardWidth: number;
  whiteboardHeight: number;
  syncConfig?: SyncConfig;
  id: string;
  portalContainer?: Element | null;
  onSyncStateChange?: (syncState: any) => void;
  onLastActivityUpdate?: (activity: any) => void;
  onCenterCallbackUpdate?: (callback: (bounds: any) => void) => void;
}

const WhiteboardContent: React.FC<WhiteboardContentProps> = ({
  whiteboardWidth,
  whiteboardHeight,
  syncConfig,
  id,
  portalContainer,
  onSyncStateChange,
  onLastActivityUpdate,
  onCenterCallbackUpdate
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Use shared whiteboard state with sync configuration and activity tracking
  const whiteboardState = useSharedWhiteboardState(
    syncConfig,
    id,
    whiteboardWidth,
    whiteboardHeight,
    onLastActivityUpdate
  );

  // Get normalized state for performance
  const normalizedState = useSharedNormalizedState(
    whiteboardState.state.lines,
    whiteboardState.state.images,
    id
  );

  // Update sync state when it changes
  useEffect(() => {
    if (onSyncStateChange && whiteboardState.syncState) {
      onSyncStateChange({
        isConnected: whiteboardState.syncState.isConnected,
        isReceiveOnly: whiteboardState.isReadOnly
      });
    }
  }, [whiteboardState.syncState, whiteboardState.isReadOnly, onSyncStateChange]);

  // Provide the center callback to parent
  useEffect(() => {
    if (onCenterCallbackUpdate && whiteboardState.centerOnLastActivity) {
      onCenterCallbackUpdate(whiteboardState.centerOnLastActivity);
    }
  }, [whiteboardState.centerOnLastActivity, onCenterCallbackUpdate]);

  // Handle visibility changes for performance
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!isVisible) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Whiteboard paused while tab is inactive
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <KonvaStage
        width={whiteboardWidth}
        height={whiteboardHeight}
        whiteboardState={whiteboardState}
        isReadOnly={whiteboardState.isReadOnly}
        normalizedState={normalizedState}
      />
    </div>
  );
};

export default WhiteboardContent;
