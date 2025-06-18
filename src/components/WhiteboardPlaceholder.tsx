
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize2, Minimize2, Eye, EyeOff, Wifi, WifiOff, PenTool } from 'lucide-react';
import WhiteboardContent from './whiteboard/WhiteboardContent';
import MaximizedWhiteboardView from './whiteboard/MaximizedWhiteboardView';
import { useSyncConfiguration } from '@/hooks/whiteboard/useSyncConfiguration';
import { useAuth } from '@/hooks/useAuth';
import { useSessionExpiration } from '@/hooks/sessionExpiration';
import { useEyeButtonLogic } from '@/hooks/whiteboard/useEyeButtonLogic';
import { useWhiteboardDimensions } from '@/hooks/whiteboard/useWhiteboardDimensions';
import { ActivityMetadata } from '@/types/whiteboard';

interface WhiteboardPlaceholderProps {
  id: string;
  isMaximized?: boolean;
  onMaximize?: (id: string) => void;
  onMinimize?: () => void;
  sessionId?: string;
}

const WhiteboardPlaceholder: React.FC<WhiteboardPlaceholderProps> = ({
  id,
  isMaximized = false,
  onMaximize,
  onMinimize,
  sessionId,
}) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionExpiration = useSessionExpiration({ sessionId, onSessionExpired: () => {} });
  
  // State management
  const [syncState, setSyncState] = useState<{ isConnected: boolean; isReceiveOnly: boolean } | null>(null);

  // Get whiteboard dimensions
  const { containerRef: dimensionsContainerRef, whiteboardWidth, whiteboardHeight } = useWhiteboardDimensions(
    800, // initial width
    600, // initial height
    isMaximized
  );

  // Use the dimensions container ref
  useEffect(() => {
    if (dimensionsContainerRef.current && containerRef.current) {
      // Sync the refs if needed
    }
  }, [dimensionsContainerRef]);

  // Sync configuration
  const syncConfig = useSyncConfiguration(
    id,
    sessionId,
    user?.id ? `${user.id}-${id}` : undefined
  );

  // Eye button logic - only pass the id
  const { 
    shouldShowEyeButton, 
    handleEyeClick, 
    handleLastActivityUpdate, 
    handleCenterCallbackUpdate 
  } = useEyeButtonLogic(id);

  // Handlers
  const handleMaximizeClick = useCallback(() => {
    if (isMaximized) {
      onMinimize?.();
    } else {
      onMaximize?.(id);
    }
  }, [isMaximized, onMaximize, onMinimize, id]);

  const handleSyncStateChange = useCallback((newSyncState: { isConnected: boolean; isReceiveOnly: boolean } | null) => {
    setSyncState(newSyncState);
  }, []);

  // Get board type display information
  const getBoardTypeInfo = (boardId: string) => {
    switch (boardId) {
      case 'teacher-main':
        return { title: 'Main Teaching Board', description: 'Shared with all students', color: 'blue' };
      case 'student-shared-teacher':
        return { title: 'Teacher\'s Board', description: 'Receive-only view', color: 'blue' };
      case 'student-personal':
        return { title: 'Personal Board', description: 'Your private workspace', color: 'green' };
      case 'student2':
        return { title: 'Shared Workspace', description: 'Teacher can observe', color: 'purple' };
      case 'teacherA':
        return { title: 'Student A Workspace', description: 'Observing student work', color: 'purple' };
      default:
        if (boardId.startsWith('student-board-')) {
          const studentNumber = boardId.replace('student-board-', '');
          return { title: `Student ${studentNumber}`, description: 'Individual workspace', color: 'gray' };
        }
        return { title: 'Whiteboard', description: 'Interactive workspace', color: 'gray' };
    }
  };

  const boardInfo = getBoardTypeInfo(id);
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
    gray: 'border-gray-200 bg-gray-50'
  };

  const iconColorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    gray: 'text-gray-500'
  };

  if (isMaximized) {
    return (
      <MaximizedWhiteboardView
        id={id}
        shouldShowEyeButton={shouldShowEyeButton}
        onMinimize={onMinimize}
        onEyeClick={handleEyeClick}
        sessionId={sessionId}
        expiresAt={sessionExpiration.expiresAt}
        isExpired={sessionExpiration.isExpired}
        sessionEndReason={sessionExpiration.sessionEndReason}
        isRedirecting={sessionExpiration.isRedirecting}
        whiteboardWidth={whiteboardWidth}
        whiteboardHeight={whiteboardHeight}
        syncConfig={syncConfig}
        hasLastActivity={false}
        syncState={syncState}
        onLastActivityUpdate={handleLastActivityUpdate}
        onCenterCallbackUpdate={handleCenterCallbackUpdate}
      />
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full border-2 rounded-lg ${colorClasses[boardInfo.color as keyof typeof colorClasses]} overflow-hidden group`}
    >
      {/* Header with board information */}
      <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
        <div className="flex items-center space-x-2">
          <PenTool className={`w-4 h-4 ${iconColorClasses[boardInfo.color as keyof typeof iconColorClasses]}`} />
          <div>
            <h3 className="text-sm font-medium text-gray-900">{boardInfo.title}</h3>
            <p className="text-xs text-gray-600">{boardInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Connection status indicator */}
      <div className="absolute top-2 right-16 z-10">
        <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded px-2 py-1">
          {syncState?.isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span className="text-xs text-gray-600">
            {syncState?.isReceiveOnly ? 'View' : 'Edit'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex space-x-1">
        {shouldShowEyeButton && (
          <button
            onClick={handleEyeClick}
            className="p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white/95 transition-colors shadow-sm"
            title="Center on latest activity"
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </button>
        )}
        <button
          onClick={handleMaximizeClick}
          className="p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white/95 transition-colors shadow-sm"
          title={isMaximized ? "Minimize" : "Maximize"}
        >
          {isMaximized ? (
            <Minimize2 className="w-4 h-4 text-gray-600" />
          ) : (
            <Maximize2 className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Whiteboard Content */}
      <WhiteboardContent
        whiteboardWidth={whiteboardWidth}
        whiteboardHeight={whiteboardHeight}
        syncConfig={syncConfig}
        id={id}
        onSyncStateChange={handleSyncStateChange}
        onLastActivityUpdate={handleLastActivityUpdate}
        onCenterCallbackUpdate={handleCenterCallbackUpdate}
      />
    </div>
  );
};

export default WhiteboardPlaceholder;
