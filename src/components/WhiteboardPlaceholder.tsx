import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Use centralized session expiration context
  const { isExpired, expiresAt, sessionEndReason, isRedirecting } = useSessionExpirationContext();

  const updateDimensions = () => {
    if (containerRef.current && !isMaximized) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      // Account for border and padding - subtract 4px for 2px border on each side
      const adjustedWidth = Math.max(0, width - 4);
      const adjustedHeight = Math.max(0, height - 4);
      setDimensions({ width: adjustedWidth, height: adjustedHeight });
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

  // Memoize sync config to prevent recreating it on every render
  const syncConfig = React.useMemo(() => {
    if (!sessionId) return undefined;

    // Teacher's main board -> broadcasts to students
    if (id === "teacher-main") {
      if (!senderId) return undefined;
      return {
        whiteboardId: `session-${sessionId}-main`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: false,
      };
    }
    
    // Student's view of teacher's board -> receives only
    if (id === "student-shared-teacher") {
      return {
        whiteboardId: `session-${sessionId}-main`,
        senderId: `student-listener-${sessionId}`,
        sessionId: sessionId,
        isReceiveOnly: true,
      };
    }

    // Individual student boards
    if (id.startsWith('student-board-')) {
      const studentNumber = id.replace('student-board-', '');
      if (!senderId) return undefined;
      
      return {
        whiteboardId: `session-${sessionId}-student-${studentNumber}`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: false,
      };
    }

    return undefined;
  }, [id, sessionId, senderId]);

  // Calculate dimensions based on maximized state
  const whiteboardWidth = isMaximized ? (window.innerWidth - 32) : (dimensions.width || initialWidth || 800);
  const whiteboardHeight = isMaximized ? (window.innerHeight - 32) : (dimensions.height || initialHeight || 600);

  // Create the whiteboard content that will be reused
  const whiteboardContent = (
    <div 
      className="absolute inset-0 bg-gray-25 overflow-hidden rounded-lg"
      style={{
        // Account for the maximize button and any padding
        top: '2px',
        left: '2px',
        right: '2px',
        bottom: '2px'
      }}
    >
      {whiteboardWidth > 0 && whiteboardHeight > 0 ? (
        syncConfig ? (
          <SyncWhiteboard 
            key={`sync-${id}`} // Stable key to prevent remounting
            syncConfig={syncConfig}
            width={whiteboardWidth}
            height={whiteboardHeight}
            portalContainer={portalContainer}
          />
        ) : (
          <Whiteboard isReadOnly={false} />
        )
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">Loading whiteboard...</div>
      )}
    </div>
  );

  // Common UI elements
  const maximizeButton = (
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
  );

  const sessionStatus = sessionId && expiresAt && !isExpired && (
    <div className="absolute top-3 left-3 z-10 p-2 rounded-lg bg-white/90 hover:bg-white border border-gray-200 shadow-sm transition-all duration-150 flex items-center space-x-2">
      <div className="w-2 h-2 rounded-full bg-green-500"></div>
      <span className="text-xs text-gray-600">
        Session active until {expiresAt.toLocaleTimeString()}
      </span>
    </div>
  );

  const sessionWarning = sessionId && isExpired && !isRedirecting && (
    <div className="absolute top-3 left-3 z-10 p-2 rounded-lg bg-red-50 border border-red-200 shadow-sm transition-all duration-150 flex items-center space-x-2">
      <AlertCircle size={14} className="text-red-500" />
      <span className="text-xs text-red-600">
        {sessionEndReason === 'ended_by_teacher' ? 'Session ended' : 'Session expired'}
      </span>
    </div>
  );

  // Render the maximized view in a portal to escape parent constraints
  if (isMaximized) {
    return ReactDOM.createPortal(
      <>
        {/* Backdrop overlay */}
        <div 
          className="fixed inset-0 bg-black/50 z-[9998]" 
          onClick={onMinimize} 
        />
        
        {/* Maximized whiteboard */}
        <div className="fixed inset-0 z-[9999] p-4">
          <div className="w-full h-full flex flex-col bg-white border-2 border-gray-200 rounded-lg shadow-2xl">
            {maximizeButton}
            {sessionStatus}
            {sessionWarning}
            {whiteboardContent}
          </div>
        </div>
      </>,
      portalContainer || document.body
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
      {maximizeButton}
      {sessionStatus}
      {sessionWarning}
      {whiteboardContent}
    </div>
  );
};

export default WhiteboardPlaceholder;
