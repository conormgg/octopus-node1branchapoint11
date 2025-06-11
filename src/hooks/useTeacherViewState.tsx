
import { useState, useEffect } from 'react';
import { GridOrientation } from '@/components/TeacherView';
import { calculateLayoutOptions } from '@/utils/layoutCalculator';

export const useTeacherViewState = (studentCount: number) => {
  const [maximizedBoard, setMaximizedBoard] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('2x2');
  const [isSplitViewActive, setIsSplitViewActive] = useState(false);
  const [isSplitView2Active, setIsSplitView2Active] = useState(false);
  const [gridOrientation, setGridOrientation] = useState<GridOrientation>('columns-first');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  useEffect(() => {
    // Reset layout to first available option when student count changes
    const availableLayouts = calculateLayoutOptions(studentCount);
    if (availableLayouts.length > 0 && studentCount > 0) {
      setSelectedLayoutId(availableLayouts[0].id);
    }
    setCurrentPage(0);
  }, [studentCount]);

  const handleMaximize = (boardId: string) => {
    setMaximizedBoard(boardId);
  };

  const handleMinimize = () => {
    setMaximizedBoard(null);
  };

  const handleLayoutChange = (layoutId: string) => {
    setSelectedLayoutId(layoutId);
    setCurrentPage(0); // Reset to first page when layout changes
  };

  const handleOrientationChange = (orientation: GridOrientation) => {
    setGridOrientation(orientation);
  };

  const handleToggleSplitView = () => {
    setIsSplitViewActive(!isSplitViewActive);
  };

  const handleCloseSplitView = () => {
    setIsSplitViewActive(false);
  };

  const handleToggleSplitView2 = () => {
    setIsSplitView2Active(!isSplitView2Active);
  };

  const handleCloseSplitView2 = () => {
    setIsSplitView2Active(false);
  };

  const handleToggleControlsCollapse = () => {
    setIsControlsCollapsed(!isControlsCollapsed);
  };

  // Calculate layout options and current layout
  const availableLayouts = calculateLayoutOptions(studentCount);
  const currentLayout = availableLayouts.find(layout => layout.id === selectedLayoutId) || availableLayouts[0];
  const totalPages = currentLayout?.totalPages || 1;

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  return {
    maximizedBoard,
    currentPage,
    selectedLayoutId,
    isSplitViewActive,
    isSplitView2Active,
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
    handleToggleSplitView2,
    handleCloseSplitView2,
    handleToggleControlsCollapse,
    handlePreviousPage,
    handleNextPage,
  };
};
