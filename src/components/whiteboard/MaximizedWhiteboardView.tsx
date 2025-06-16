
import React from 'react';
import ReactDOM from 'react-dom';
import TopRightButtons from './TopRightButtons';
import SessionStatus from './SessionStatus';
import WhiteboardContent from './WhiteboardContent';
import { SyncConfig } from '@/types/sync';

interface MaximizedWhiteboardViewProps {
  id: string;
  shouldShowEyeButton: boolean;
  onMinimize?: () => void;
  onEyeClick: () => void;
  sessionId?: string;
  expiresAt?: Date;
  isExpired: boolean;
  sessionEndReason?: string;
  isRedirecting: boolean;
  whiteboardWidth: number;
  whiteboardHeight: number;
  syncConfig?: SyncConfig;
  portalContainer?: Element | null;
}

const MaximizedWhiteboardView: React.FC<MaximizedWhiteboardViewProps> = ({
  id,
  shouldShowEyeButton,
  onMinimize,
  onEyeClick,
  sessionId,
  expiresAt,
  isExpired,
  sessionEndReason,
  isRedirecting,
  whiteboardWidth,
  whiteboardHeight,
  syncConfig,
  portalContainer
}) => {
  const handleMaximizeClick = () => {
    if (onMinimize) {
      onMinimize();
    }
  };

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
          <TopRightButtons
            isMaximized={true}
            shouldShowEyeButton={shouldShowEyeButton}
            onMaximizeClick={handleMaximizeClick}
            onEyeClick={onEyeClick}
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
      </div>
    </>,
    portalContainer || document.body
  );
};

export default MaximizedWhiteboardView;
