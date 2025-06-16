
import React, { useState } from 'react';
import Whiteboard from '../Whiteboard';
import { SyncWhiteboard } from '../SyncWhiteboard';
import { SyncConfig } from '@/types/sync';

interface WhiteboardContentProps {
  whiteboardWidth: number;
  whiteboardHeight: number;
  syncConfig?: SyncConfig;
  id: string;
  portalContainer?: Element | null;
  onSyncStateChange?: (syncState: { isConnected: boolean; isReceiveOnly: boolean } | null) => void;
}

const WhiteboardContent: React.FC<WhiteboardContentProps> = ({
  whiteboardWidth,
  whiteboardHeight,
  syncConfig,
  id,
  portalContainer,
  onSyncStateChange
}) => {
  return (
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
            onSyncStateChange={onSyncStateChange}
          />
        ) : (
          <Whiteboard isReadOnly={false} />
        )
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">Loading whiteboard...</div>
      )}
    </div>
  );
};

export default WhiteboardContent;
