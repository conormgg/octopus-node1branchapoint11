import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import Whiteboard from './Whiteboard';
import { SyncWhiteboard } from './SyncWhiteboard';
import { SyncConfig } from '@/types/sync';
import { useSessionExpirationContext } from '@/contexts/sessionExpiration';

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
  senderId
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Use centralized session expiration context
  const { isExpired, expiresAt, sessionEndReason, isRedirecting } = useSessionExpirationContext();

  const updateDimensions = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const handleMaximizeClick = () => {
    if (isMaximized && onMinimize) {
      onMinimize();
    } else if (!isMaximized && onMaximize) {
      onMaximize();
    }
  };

  const getSyncConfig = (boardId: string): SyncConfig | undefined => {
    if (!sessionId) return undefined;

    // Teacher's main board -> broadcasts to students
    if (boardId === "teacher-main") {
      if (!senderId) return undefined;
      return {
        whiteboardId: `session-${sessionId}-main`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: false,
      };
    }
    
    // Student's view of teacher's board -> receives only
    if (boardId === "student-shared-teacher") {
      return {
        whiteboardId: `session-${sessionId}-main`,
        senderId: `student-listener-${sessionId}`,
        sessionId: sessionId,
        isReceiveOnly: true,
      };
    }

    // Individual student boards
    if (boardId.startsWith('student-board-')) {
      const studentNumber = boardId.replace('student-board-', '');
      if (!senderId) return undefined;
      
      return {
        whiteboardId: `session-${sessionId}-student-${studentNumber}`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: false,
      };
    }

    return undefined;
  };

  const syncConfig = getSyncConfig(id);

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 relative ${
        isMaximized 
          ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)] w-[calc(100vw-2rem)]' 
          : 'h-full'
      }`}
      style={{ 
        width: isMaximized ? 'calc(100vw - 2rem)' : (initialWidth ? `${initialWidth}px` : '100%'),
        height: isMaximized ? 'calc(100vh - 2rem)' : (initialHeight ? `${initialHeight}px` : '100%')
      }}
    >
      {/* Maximize/Minimize Button */}
      <button
        onClick={handleMaximizeClick}
        className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-white/80 hover:bg-white border border-gray-200 shadow-sm transition-all duration-150"
        title={isMaximized ? "Minimize" : "Maximize"}
      >
        {isMaximized ? (
          <Minimize2 size={16} className="text-gray-600" />
        ) : (
          <Maximize2 size={16} className="text-gray-600" />
        )}
      </button>
      
      {/* Session Status Indicator */}
      {sessionId && expiresAt && !isExpired && (
        <div className="absolute top-3 left-3 z-10 p-2 rounded-lg bg-white/80 hover:bg-white border border-gray-200 shadow-sm transition-all duration-150 flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-600">
            Session active until {expiresAt.toLocaleTimeString()}
          </span>
        </div>
      )}
      
      {/* Session Status Warning */}
      {sessionId && isExpired && !isRedirecting && (
        <div className="absolute top-3 left-3 z-10 p-2 rounded-lg bg-red-50 border border-red-200 shadow-sm transition-all duration-150 flex items-center space-x-2">
          <AlertCircle size={14} className="text-red-500" />
          <span className="text-xs text-red-600">
            {sessionEndReason === 'ended_by_teacher' ? 'Session ended' : 'Session expired'}
          </span>
        </div>
      )}
      
      {/* Whiteboard Content Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-25 relative overflow-hidden rounded-lg">
        {syncConfig ? (
          <SyncWhiteboard 
            syncConfig={syncConfig}
            width={isMaximized ? window.innerWidth - 32 : dimensions.width}
            height={isMaximized ? window.innerHeight - 32 : dimensions.height}
          />
        ) : (
          <Whiteboard isReadOnly={false} />
        )}
      </div>
    </div>
  );
};

export default WhiteboardPlaceholder;
