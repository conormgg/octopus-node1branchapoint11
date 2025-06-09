
import React from 'react';
import WhiteboardContainer from './whiteboard/WhiteboardContainer';

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

const WhiteboardPlaceholder: React.FC<WhiteboardPlaceholderProps> = (props) => {
  return <WhiteboardContainer {...props} />;
};

export default WhiteboardPlaceholder;
