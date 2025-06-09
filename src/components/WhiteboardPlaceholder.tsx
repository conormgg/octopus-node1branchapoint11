

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
  const [maximizedDimensions, setMaximizedDimensions] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Use centralized session expiration context
  const { isExpired, expiresAt, sessionEndReason, isRedirecting } = useSessionExpirationContext();

  const updateDimensions = () => {
    if (containerRef.current && !isMaximized) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      console.log(`[${id}] Container dimensions:`, { width, height });
      setDimensions({ width, height });
    }
  };

  const updateMaximizedDimensions = () => {
    if (isMaximized) {
      // Account for inset-4 (16px on each side) = 32px total
      // Account for UI elements: maximize button (approx 50px from top), some padding
      const width = window.innerWidth - 32;
      const height = window.innerHeight - 32;
      console.log(`[${id}] Maximized dimensions calculated:`, { width, height });
      setMaximizedDimensions({ width, height });
    }
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [isMaximized]);

  // Update maximized dimensions when maximizing or window resizes
  useEffect(() => {
    if (isMaximized) {
      // Small delay to ensure the container has been repositioned
      const timer = setTimeout(updateMaximizedDimensions, 10);
      window.addEventListener('resize', updateMaximizedDimensions);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateMaximizedDimensions);
      };
    }
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

  // Calculate dimensions based on maximized state
  const whiteboardWidth = isMaximized 
    ? (maximizedDimensions.width > 0 ? maximizedDimensions.width - 100 : window.innerWidth - 132) // Account for UI elements
    : (dimensions.width || initialWidth || 800);
  const whiteboardHeight = isMaximized 
    ? (maximizedDimensions.height > 0 ? maximizedDimensions.height - 100 : window.innerHeight - 132) // Account for UI elements  
    : (dimensions.height || initialHeight || 600);

  console.log(`[${id}] Whiteboard dimensions:`, { 
    whiteboardWidth, 
    whiteboardHeight, 
    isMaximized,
    containerDimensions: dimensions,
    maximizedDimensions 
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

  // Create the whiteboard content - this will NEVER be remounted
  const whiteboardContent = (
    <div className="flex-1 flex items-center justify-center bg-gray-25 relative overflow-hidden rounded-lg">
      {whiteboardWidth > 0 && whiteboardHeight > 0 ? (
        syncConfig ? (
          <SyncWhiteboard 
            key={`sync-${id}-stable`} // Stable key to prevent remounting
            syncConfig={syncConfig}
            width={whiteboardWidth}
            height={whiteboardHeight}
          />
        ) : (
          <Whiteboard isReadOnly={false} />
        )
      ) : (
        <div className="text-gray-500">Loading whiteboard...</div>
      )}
    </div>
  );

  // Single container approach - no conditional returns, no portals
  return (
    <>
      {/* Backdrop overlay - only shown when maximized */}
      {isMaximized && (
        <div 
          className="fixed inset-0 bg-black/50 z-[9998]" 
          onClick={handleBackdropClick}
        />
      )}
      
      {/* Main container - always in the same position */}
      <div 
        ref={containerRef}
        className={`
          flex flex-col bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 relative
          ${isMaximized 
            ? 'fixed inset-4 z-[9999] shadow-2xl' 
            : 'h-full'
          }
        `}
        style={!isMaximized ? { 
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

