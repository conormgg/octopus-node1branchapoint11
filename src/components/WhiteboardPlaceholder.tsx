
import React, { useState, useEffect, useMemo } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import Whiteboard from './Whiteboard';
import { SyncWhiteboard } from './SyncWhiteboard';
import { SyncConfig } from '@/types/sync';

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

  // Memoize sync config to prevent unnecessary re-renders
  const syncConfig = useMemo((): SyncConfig | undefined => {
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
      const effectiveSenderId = senderId || `student-listener-${sessionId}`;
      return {
        whiteboardId: `session-${sessionId}-main`,
        senderId: effectiveSenderId,
        sessionId: sessionId,
        isReceiveOnly: true,
      };
    }

    // Student's personal board
    if (id === "student-personal") {
      if (!senderId) return undefined;
      return {
        whiteboardId: `session-${sessionId}-personal-${senderId}`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: false,
      };
    }

    // Individual student boards - check if it matches the pattern
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

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 relative"
      style={{ 
        width: initialWidth ? `${initialWidth}px` : '100%',
        height: initialHeight ? `${initialHeight}px` : '100%'
      }}
    >
      {/* Maximize/Minimize Button - positioned in top-right corner */}
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
      
      {/* Whiteboard Content Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-25 relative overflow-hidden rounded-lg">
        {syncConfig ? (
          <SyncWhiteboard 
            syncConfig={syncConfig}
            width={dimensions.width}
            height={dimensions.height}
          />
        ) : (
          <Whiteboard isReadOnly={false} />
        )}
      </div>
    </div>
  );
};

export default WhiteboardPlaceholder;
