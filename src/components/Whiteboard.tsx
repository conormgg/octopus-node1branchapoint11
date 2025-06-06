
import React from 'react';
import UnifiedWhiteboard from './UnifiedWhiteboard';

interface WhiteboardProps {
  isReadOnly?: boolean;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ isReadOnly = false }) => {
  return (
    <UnifiedWhiteboard 
      isReadOnly={isReadOnly}
      showSyncStatus={false}
    />
  );
};

export default Whiteboard;
