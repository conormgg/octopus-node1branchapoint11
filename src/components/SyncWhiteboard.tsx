
import React from 'react';
import UnifiedWhiteboard from './UnifiedWhiteboard';
import { SyncConfig } from '@/types/sync';

interface SyncWhiteboardProps {
  syncConfig?: SyncConfig;
  width: number;
  height: number;
}

export const SyncWhiteboard: React.FC<SyncWhiteboardProps> = ({
  syncConfig,
  width,
  height
}) => {
  return (
    <div style={{ width, height }}>
      <UnifiedWhiteboard 
        syncConfig={syncConfig}
        isReadOnly={syncConfig?.isReceiveOnly}
        showSyncStatus={true}
      />
    </div>
  );
};
