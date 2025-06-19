
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
  
  // Guard against invalid id prop
  if (!id || typeof id !== 'string') {
    console.error('[WhiteboardPlaceholder] Invalid id prop received:', id);
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 border-2 border-red-200 rounded-lg">
        <p className="text-red-600">Invalid whiteboard ID</p>
      </div>
    );
  }
  
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

  // Helper function to get board styling based on type
  const getBoardStyling = () => {
    if (id === 'teacherA') {
      return {
        borderColor: 'border-purple-300',
        bgColor: 'bg-purple-50',
        hoverColor: 'hover:shadow-purple-100'
      };
    }
    if (id === 'student2') {
      return {
        borderColor: 'border-green-300',
        bgColor: 'bg-green-50',
        hoverColor: 'hover:shadow-green-100'
      };
    }
    return {
      borderColor: 'border-gray-200',
      bgColor: 'bg-white',
      hoverColor: 'hover:shadow-md'
    };
  };

  const { borderColor, bgColor, hoverColor } = getBoardStyling();

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
      className={`flex flex-col ${bgColor} border-2 ${borderColor} rounded-lg shadow-sm ${hoverColor} transition-all duration-200 relative h-full`}
      style={{ 
        width: initialWidth ? `${initialWidth}px` : '100%',
        height: initialHeight ? `${initialHeight}px` : '100%'
      }}
    >
      {/* Visual indicator for sync test boards */}
      {(id === 'teacherA' || id === 'student2') && (
        <div className="absolute top-2 left-2 z-20">
          <div className={`px-2 py-1 rounded-md text-xs font-medium ${
            id === 'teacherA' 
              ? 'bg-purple-100 text-purple-700 border border-purple-200'
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            {id === 'teacherA' ? 'SYNC: READ ONLY' : 'SYNC: STUDENT A'}
          </div>
        </div>
      )}
      
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
