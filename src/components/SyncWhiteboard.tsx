
import React from 'react';
import Whiteboard from './Whiteboard';
import { useSyncWhiteboardState } from '@/hooks/useSyncWhiteboardState';
import { cn } from '@/lib/utils';

interface SyncWhiteboardProps {
  whiteboardId: string;
  sessionId: string;
  senderId: string;
  isReceiveOnly?: boolean;
  showToolbar?: boolean;
  className?: string;
}

export const SyncWhiteboard: React.FC<SyncWhiteboardProps> = ({
  whiteboardId,
  sessionId,
  senderId,
  isReceiveOnly = false,
  showToolbar = true,
  className
}) => {
  const whiteboardState = useSyncWhiteboardState({
    whiteboardId,
    sessionId,
    senderId,
    isReceiveOnly
  });

  return (
    <div className={cn("relative w-full h-full", className)}>
      <Whiteboard 
        whiteboardId={whiteboardId}
        showToolbar={showToolbar}
        whiteboardState={whiteboardState}
      />
    </div>
  );
};
