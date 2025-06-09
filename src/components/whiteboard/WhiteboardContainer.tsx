
import React, { useState, useEffect } from 'react';
import { SyncConfig } from '@/types/sync';
import { useSessionExpirationContext } from '@/contexts/sessionExpiration';
import WhiteboardControls from './WhiteboardControls';
import SessionStatusIndicator from './SessionStatusIndicator';
import WhiteboardContent from './WhiteboardContent';
import MaximizedOverlay from './MaximizedOverlay';

interface WhiteboardContainerProps {
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

const WhiteboardContainer: React.FC<WhiteboardContainerProps> = ({
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

  return (
    <>
      <MaximizedOverlay 
        isMaximized={isMaximized}
        onBackdropClick={handleBackdropClick}
      />
      
      {/* Main container - CSS handles sizing */}
      <div 
        ref={containerRef}
        className={`
          flex flex-col bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 relative
          ${isMaximized 
            ? 'fixed inset-0 z-[9999] shadow-2xl rounded-none border-0' 
            : 'h-full w-full'
          }
        `}
        style={!isMaximized && (initialWidth || initialHeight) ? { 
          width: initialWidth ? `${initialWidth}px` : '100%',
          height: initialHeight ? `${initialHeight}px` : '100%'
        } : undefined}
      >
        <WhiteboardControls
          isMaximized={isMaximized}
          onMaximizeClick={handleMaximizeClick}
        />
        
        <SessionStatusIndicator
          sessionId={sessionId}
          expiresAt={expiresAt}
          isExpired={isExpired}
          isRedirecting={isRedirecting}
          sessionEndReason={sessionEndReason}
        />
        
        <WhiteboardContent
          id={id}
          whiteboardWidth={whiteboardWidth}
          whiteboardHeight={whiteboardHeight}
          syncConfig={syncConfig}
        />
      </div>
    </>
  );
};

export default WhiteboardContainer;
