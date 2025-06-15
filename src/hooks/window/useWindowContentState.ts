
import { useState } from 'react';

export const useWindowContentState = () => {
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [maximizedBoard, setMaximizedBoard] = useState<string | null>(null);

  const toggleHeaderCollapse = () => {
    setIsHeaderCollapsed(prev => !prev);
  };

  const handleMaximize = (boardId: string, onMaximize: (boardId: string) => void) => {
    setMaximizedBoard(boardId);
    onMaximize(boardId);
  };

  const handleMinimize = () => {
    setMaximizedBoard(null);
  };

  return {
    isHeaderCollapsed,
    maximizedBoard,
    toggleHeaderCollapse,
    handleMaximize,
    handleMinimize,
  };
};
