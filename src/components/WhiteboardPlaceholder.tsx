
import React, { useState, useEffect } from 'react';
import { SyncConfig } from '@/types/sync';
import { useSessionExpirationContext } from '@/contexts/sessionExpiration';
import TopRightButtons from './whiteboard/TopRightButtons';
import SessionStatus from './whiteboard/SessionStatus';
import WhiteboardContent from './whiteboard/WhiteboardContent';
import MaximizedWhiteboardView from './whiteboard/MaximizedWhiteboardView';

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

  // Check if this whiteboard should show the eye button (teacher-main or student-shared-teacher)
  const shouldShowEyeButton = id === "teacher-main" || id === "student-shared-teacher";

  // Eye button click handler
  const handleEyeClick = () => {
    console.log('Eye button clicked - Phase 2: Activity tracking implemented');
    // TODO: Implement centering logic in later phases
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

  // For now, we'll use a simple check for last activity (Phase 2 implementation)
  // This will be enhanced in later phases with actual activity data
  const hasLastActivity = false; // TODO: Get from actual whiteboard state in next phases

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
      />
    </div>
  );
};

export default WhiteboardPlaceholder;
