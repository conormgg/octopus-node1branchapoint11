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
    if (containerRef.current && !isMaximized) {
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
  }, [isMaximized]);

  // Add escape key listener when maximized
  useEffect(() => {
    if (!isMaximized) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onMinimize) {
        onMinimize();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMaximized, onMinimize]);

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

  // Calculate dimensions based on maximized state
  const whiteboardWidth = isMaximized ? window.innerWidth - 32 : dimensions.width;
  const whiteboardHeight = isMaximized ? window.innerHeight - 96 : dimensions.height;

  return (
    <div 
      ref={containerRef}
      className={`
        flex flex-col bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 relative
        ${isMaximized 
          ? 'fixed inset-4 z-[9999] bg-background shadow-lg' 
          : 'h-full'
        }
      `}
      style={!isMaximized ? { 
        width: initialWidth ? `${initialWidth}px` : '100%',
        height: initialHeight ? `${initialHeight}px` : '100%'
      } : undefined}
    >
      {/* Backdrop overlay - only show when maximized */}
      {isMaximized && (
        <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onMinimize} />
      )}

      {/* Toggle Button */}
      <button
        onClick={handleMaximizeClick}
        className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-white/90 hover:bg-white border border-gray-200 shadow-sm transition-all duration-150"
        title={isMaximized ? "Minimize (Press Esc)" : "Maximize"}
      >
        {isMaximized ? (
          <Minimize2 size={16} className="text-gray-600" />
        ) : (
          <Maximize2 size={16} className="text-gray-600" />
        )}
      </button>
      
      {/* Session Status Indicator */}
      {sessionId && expiresAt && !isExpired && (
        <div className="absolute top-3 left-3 z-10 p-2 rounded-lg bg-white/90 hover:bg-white border border-gray-200 shadow-sm transition-all duration-150 flex items-center space-x-2">
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
      <div className={`
        flex-1 flex items-center justify-center bg-gray-25 relative overflow-hidden rounded-lg
        ${isMaximized ? 'mt-12' : ''}
      `}>
        {syncConfig ? (
          <SyncWhiteboard 
            syncConfig={syncConfig}
            width={whiteboardWidth}
            height={whiteboardHeight}
          />
        ) : (
          <Whiteboard isReadOnly={false} />
        )}
      </div>
    </div>
  );
};

export default WhiteboardPlaceholder;
