
import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import TopRightButtons from './TopRightButtons';
import SessionStatus from './SessionStatus';
import WhiteboardContent from './WhiteboardContent';
import { SyncConfig } from '@/types/sync';
import { ActivityMetadata } from '@/types/whiteboard';

interface MaximizedWhiteboardViewProps {
  id: string;
  shouldShowEyeButton: boolean;
  onMinimize?: () => void;
  onEyeClick: () => void;
  sessionId?: string;
  expiresAt?: Date;
  isExpired: boolean;
  sessionEndReason?: string;
  isRedirecting: boolean;
  whiteboardWidth: number;
  whiteboardHeight: number;
  syncConfig?: SyncConfig;
  portalContainer?: Element | null;
  hasLastActivity?: boolean;
  syncState?: { isConnected: boolean; isReceiveOnly: boolean } | null;
  onLastActivityUpdate?: (activity: ActivityMetadata | null) => void;
  onCenterCallbackUpdate?: (callback: (bounds: any) => void) => void;
}

const MaximizedWhiteboardView: React.FC<MaximizedWhiteboardViewProps> = ({
  id,
  shouldShowEyeButton,
  onMinimize,
  onEyeClick,
  sessionId,
  expiresAt,
  isExpired,
  sessionEndReason,
  isRedirecting,
  whiteboardWidth,
  whiteboardHeight,
  syncConfig,
  portalContainer,
  hasLastActivity = false,
  syncState,
  onLastActivityUpdate,
  onCenterCallbackUpdate
}) => {
  const [localSyncState, setLocalSyncState] = useState(syncState);

  // Memoized handlers for better performance
  const handleMaximizeClick = useCallback(() => {
    onMinimize?.();
  }, [onMinimize]);

  const handleBackdropClick = useCallback(() => {
    onMinimize?.();
  }, [onMinimize]);

  const handleSyncStateChange = useCallback((newSyncState: { isConnected: boolean; isReceiveOnly: boolean } | null) => {
    setLocalSyncState(newSyncState);
  }, []);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalSyncState(syncState);
  }, [syncState]);

  const content = (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]" 
        onClick={handleBackdropClick}
        aria-label="Close maximized view"
      />
      
      {/* Maximized whiteboard */}
      <div className="fixed inset-0 z-[9999] p-4">
        <div className="w-full h-full flex flex-col bg-white border-2 border-gray-200 rounded-lg shadow-2xl">
          <TopRightButtons
            isMaximized={true}
            shouldShowEyeButton={shouldShowEyeButton}
            onMaximizeClick={handleMaximizeClick}
            onEyeClick={onEyeClick}
            hasLastActivity={hasLastActivity}
            syncState={localSyncState}
          />
          
          <SessionStatus
            sessionId={sessionId}
            expiresAt={expiresAt}
            isExpired={isExpired}
            sessionEndReason={sessionEndReason}
            isRedirecting={isRedirecting}
          />
          
          <WhiteboardContent
            whiteboardWidth={whiteboardWidth}
            whiteboardHeight={whiteboardHeight}
            syncConfig={syncConfig}
            id={id}
            portalContainer={portalContainer}
            onSyncStateChange={handleSyncStateChange}
            onLastActivityUpdate={onLastActivityUpdate}
            onCenterCallbackUpdate={onCenterCallbackUpdate}
          />
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(content, portalContainer || document.body);
};

export default MaximizedWhiteboardView;
