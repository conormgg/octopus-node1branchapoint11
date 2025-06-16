
import React, { useState } from 'react';
import { useSessionExpirationContext } from '@/contexts/sessionExpiration';
import TopRightButtons from './whiteboard/TopRightButtons';
import SessionStatus from './whiteboard/SessionStatus';
import WhiteboardContent from './whiteboard/WhiteboardContent';
import MaximizedWhiteboardView from './whiteboard/MaximizedWhiteboardView';
import { useWhiteboardDimensions } from '@/hooks/whiteboard/useWhiteboardDimensions';
import { useEscapeKeyHandler } from '@/hooks/whiteboard/useEscapeKeyHandler';
import { useEyeButtonLogic } from '@/hooks/whiteboard/useEyeButtonLogic';
import { useSyncConfiguration } from '@/hooks/whiteboard/useSyncConfiguration';

interface WhiteboardPlaceholderProps {
  id: string;
  initialWidth?: number;
  initialHeight?: number;
  isMaximized?: boolean;
  onMaximize?: () => void;
  onMinimize?: () => void;
  isTeacher?: boolean;
  sessionId?: string;
  senderId?: string;
  portalContainer?: Element | null;
}

const WhiteboardPlaceholder: React.FC<WhiteboardPlaceholderProps> = ({
  id,
  initialWidth,
  initialHeight,
  isMaximized = false,
  onMaximize,
  onMinimize,
  isTeacher = false,
  sessionId,
  senderId,
  portalContainer
}) => {
  const [syncState, setSyncState] = useState<{ isConnected: boolean; isReceiveOnly: boolean } | null>(null);
  
  // Use centralized session expiration context
  const { isExpired, expiresAt, sessionEndReason, isRedirecting } = useSessionExpirationContext();

  // Custom hooks for focused functionality
  const { containerRef, whiteboardWidth, whiteboardHeight } = useWhiteboardDimensions(initialWidth, initialHeight, isMaximized);
  useEscapeKeyHandler(isMaximized, onMinimize);
  const { shouldShowEyeButton, handleEyeClick, handleLastActivityUpdate, handleCenterCallbackUpdate, hasLastActivity } = useEyeButtonLogic(id);
  const syncConfig = useSyncConfiguration(id, sessionId, senderId);

  const handleMaximizeClick = () => {
    if (isMaximized && onMinimize) {
      onMinimize();
    } else if (!isMaximized && onMaximize) {
      onMaximize();
    }
  };

  // Render the maximized view in a portal to escape parent constraints
  if (isMaximized) {
    return (
      <MaximizedWhiteboardView
        id={id}
        shouldShowEyeButton={shouldShowEyeButton}
        onMinimize={onMinimize}
        onEyeClick={handleEyeClick}
        sessionId={sessionId}
        expiresAt={expiresAt}
        isExpired={isExpired}
        sessionEndReason={sessionEndReason}
        isRedirecting={isRedirecting}
        whiteboardWidth={whiteboardWidth}
        whiteboardHeight={whiteboardHeight}
        syncConfig={syncConfig}
        portalContainer={portalContainer}
        hasLastActivity={hasLastActivity}
        syncState={syncState}
        onLastActivityUpdate={handleLastActivityUpdate}
        onCenterCallbackUpdate={handleCenterCallbackUpdate}
      />
    );
  }

  // Normal (non-maximized) view
  return (
    <div 
      ref={containerRef}
      className="flex flex-col bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 relative h-full"
      style={{ 
        width: initialWidth ? `${initialWidth}px` : '100%',
        height: initialHeight ? `${initialHeight}px` : '100%'
      }}
    >
      <TopRightButtons
        isMaximized={isMaximized}
        shouldShowEyeButton={shouldShowEyeButton}
        onMaximizeClick={handleMaximizeClick}
        onEyeClick={handleEyeClick}
        hasLastActivity={hasLastActivity}
        syncState={syncState}
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
        onSyncStateChange={setSyncState}
        onLastActivityUpdate={handleLastActivityUpdate}
        onCenterCallbackUpdate={handleCenterCallbackUpdate}
      />
    </div>
  );
};

export default WhiteboardPlaceholder;
