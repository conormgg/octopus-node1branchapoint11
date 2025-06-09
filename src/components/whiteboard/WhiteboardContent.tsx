
import React from 'react';
import Whiteboard from '../Whiteboard';
import { SyncWhiteboard } from '../SyncWhiteboard';
import { SyncConfig } from '@/types/sync';

interface WhiteboardContentProps {
  id: string;
  whiteboardWidth: number;
  whiteboardHeight: number;
  syncConfig?: SyncConfig;
}

const WhiteboardContent: React.FC<WhiteboardContentProps> = ({
  id,
  whiteboardWidth,
  whiteboardHeight,
  syncConfig
}) => {
  if (whiteboardWidth <= 0 || whiteboardHeight <= 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-25 relative overflow-hidden">
        <div className="text-gray-500">Loading whiteboard...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-white relative overflow-hidden">
      {syncConfig ? (
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
      )}
    </div>
  );
};

export default WhiteboardContent;
