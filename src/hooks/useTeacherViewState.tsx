
import { useState, useEffect, useCallback } from 'react';
import { GridOrientation } from '@/components/TeacherView';
import { calculateLayoutOptions } from '@/utils/layoutCalculator';

export const useTeacherViewState = (studentCount: number) => {
  const [maximizedBoard, setMaximizedBoard] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('2x2');
  const [isSplitViewActive, setIsSplitViewActive] = useState(false);
  const [gridOrientation, setGridOrientation] = useState<GridOrientation>('columns-first');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  // Calculate layout options
  const availableLayouts = calculateLayoutOptions(studentCount);
  const currentLayout = availableLayouts.find(layout => layout.id === selectedLayoutId) || availableLayouts[0];
  const totalPages = currentLayout?.totalPages || 1;

  useEffect(() => {
    // Only reset layout if current selection becomes invalid
    if (availableLayouts.length > 0 && studentCount > 0) {
      const currentLayoutStillValid = availableLayouts.some(layout => layout.id === selectedLayoutId);
      
      if (!currentLayoutStillValid) {
        console.log('Current layout invalid, switching to first available');
        setSelectedLayoutId(availableLayouts[0].id);
        setCurrentPage(0);
      } else {
        // Check if current page is still valid
        const maxPage = (currentLayout?.totalPages || 1) - 1;
        if (currentPage > maxPage) {
          console.log('Current page invalid, resetting to last valid page');
          setCurrentPage(maxPage);
        }
      }
    }
  }, [studentCount, availableLayouts, selectedLayoutId, currentLayout, currentPage]);

  const handleMaximize = useCallback((boardId: string) => {
    setMaximizedBoard(boardId);
  }, []);

  const handleMinimize = useCallback(() => {
    setMaximizedBoard(null);
  }, []);

  const handleLayoutChange = useCallback((layoutId: string) => {
    setSelectedLayoutId(layoutId);
    setCurrentPage(0); // Reset to first page when layout changes
  }, []);

  const handleOrientationChange = useCallback((orientation: GridOrientation) => {
    setGridOrientation(orientation);
  }, []);

  const handleToggleSplitView = useCallback(() => {
    setIsSplitViewActive(prev => !prev);
  }, []);

  const handleCloseSplitView = useCallback(() => {
    setIsSplitViewActive(false);
  }, []);

  const handleToggleControlsCollapse = useCallback(() => {
    setIsControlsCollapsed(prev => !prev);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  return {
    maximizedBoard,
    currentPage,
    selectedLayoutId,
    isSplitViewActive,
    gridOrientation,
    isControlsCollapsed,
    availableLayouts,
    currentLayout,
    totalPages,
    handleMaximize,
    handleMinimize,
    handleLayoutChange,
    handleOrientationChange,
    handleToggleSplitView,
    handleCloseSplitView,
    handleToggleControlsCollapse,
    handlePreviousPage,
    handleNextPage,
  };
};
