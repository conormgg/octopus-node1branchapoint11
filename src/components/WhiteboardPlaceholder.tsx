
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
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Use centralized session expiration context
  const { isExpired, expiresAt, sessionEndReason, isRedirecting } = useSessionExpirationContext();

  const updateContainerDimensions = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      console.log(`[${id}] Container dimensions:`, { width, height, isMaximized });
      setContainerDimensions({ width, height });
    }
  };

  useEffect(() => {
    updateContainerDimensions();
    window.addEventListener('resize', updateContainerDimensions);
    return () => {
      window.removeEventListener('resize', updateContainerDimensions);
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

  // Handle backdrop click when maximized
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onMinimize) {
      onMinimize();
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

  // Calculate whiteboard dimensions - much simpler approach
  const whiteboardWidth = containerDimensions.width > 0 
    ? containerDimensions.width - 16 // Small padding for borders/margins
    : initialWidth || 800;
  const whiteboardHeight = containerDimensions.height > 0 
    ? containerDimensions.height - 60 // Account for buttons and status indicators
    : initialHeight || 600;

  console.log(`[${id}] Final whiteboard dimensions:`, { 
    whiteboardWidth, 
    whiteboardHeight, 
    isMaximized,
    containerDimensions 
  });

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

  // Create the whiteboard content - stable key to prevent remounting
  const whiteboardContent = (
    <div className="flex-1 flex items-center justify-center bg-gray-25 relative overflow-hidden rounded-lg p-2">
      {whiteboardWidth > 0 && whiteboardHeight > 0 ? (
        syncConfig ? (
          <SyncWhiteboard 
            key={`sync-${id}-stable`}
            syncConfig={syncConfig}
            width={whiteboardWidth}
            height={whiteboardHeight}
          />
        ) : (
          <div className="w-full h-full">
            <Whiteboard isReadOnly={false} />
          </div>
        )
      ) : (
        <div className="text-gray-500">Loading whiteboard...</div>
      )}
    </div>
  );

  return (
    <>
      {/* Backdrop overlay - only shown when maximized */}
      {isMaximized && (
        <div 
          className="fixed inset-0 bg-black/50 z-[9998]" 
          onClick={handleBackdropClick}
        />
      )}
      
      {/* Main container - CSS handles sizing */}
      <div 
        ref={containerRef}
        className={`
          flex flex-col bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 relative
          ${isMaximized 
            ? 'fixed inset-4 z-[9999] shadow-2xl' 
            : 'h-full w-full'
          }
        `}
        style={!isMaximized && (initialWidth || initialHeight) ? { 
          width: initialWidth ? `${initialWidth}px` : '100%',
          height: initialHeight ? `${initialHeight}px` : '100%'
        } : undefined}
      >
        {maximizeButton}
        {sessionStatus}
        {sessionWarning}
        {whiteboardContent}
      </div>
    </>
  );
};

export default WhiteboardPlaceholder;
