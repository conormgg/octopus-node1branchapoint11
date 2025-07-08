
import { useState, useEffect, useMemo, useCallback } from 'react';
import { GridOrientation } from '@/components/TeacherView';
import { calculateLayoutOptions, LayoutOption } from '@/utils/layoutCalculator';

export const useTeacherViewState = (studentCount: number) => {
  const [maximizedBoard, setMaximizedBoard] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('2x2');
  const [isSplitViewActive, setIsSplitViewActive] = useState(false);
  const [isSplitView2Active, setIsSplitView2Active] = useState(false);
  const [gridOrientation, setGridOrientation] = useState<GridOrientation>('columns-first');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  // Memoize layout calculation to prevent unnecessary recalculations
  const availableLayouts = useMemo(() => calculateLayoutOptions(studentCount), [studentCount]);
  
  // Memoize current layout to maintain stability
  const currentLayout = useMemo(() => 
    availableLayouts.find(layout => layout.id === selectedLayoutId) || availableLayouts[0],
    [availableLayouts, selectedLayoutId]
  );
  
  const totalPages = currentLayout?.totalPages || 1;

  // Intelligent layout management - only change when necessary
  useEffect(() => {
    if (studentCount === 0) return;

    // Check if current layout is still valid for the new student count
    const isCurrentLayoutValid = availableLayouts.some(layout => layout.id === selectedLayoutId);
    
    if (!isCurrentLayoutValid && availableLayouts.length > 0) {
      // Only change layout if current one is no longer available
      console.log('[TeacherViewState] Current layout invalid, switching to:', availableLayouts[0].id);
      setSelectedLayoutId(availableLayouts[0].id);
    }
    
    // Only reset current page if it's now out of bounds
    const newLayout = availableLayouts.find(layout => layout.id === selectedLayoutId) || availableLayouts[0];
    if (newLayout && currentPage >= newLayout.totalPages) {
      console.log('[TeacherViewState] Current page out of bounds, resetting to 0');
      setCurrentPage(0);
    }
  }, [studentCount, availableLayouts, selectedLayoutId, currentPage]);

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

  const handleSplitView2StateChange = useCallback((isActive: boolean) => {
    setIsSplitView2Active(isActive);
  }, []);

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
    handleToggleControlsCollapse,
    handlePreviousPage,
    handleNextPage,
    handleSplitView2StateChange,
  };
};
