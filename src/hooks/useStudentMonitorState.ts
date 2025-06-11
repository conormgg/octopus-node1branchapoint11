
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GridOrientation } from '@/components/TeacherView';
import { calculateLayoutOptions } from '@/utils/layoutCalculator';

export const useStudentMonitorState = (studentCount: number) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [maximizedBoard, setMaximizedBoard] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('2x2');
  const [gridOrientation, setGridOrientation] = useState<GridOrientation>('columns-first');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  // Calculate layout options and current layout
  const availableLayouts = calculateLayoutOptions(studentCount);
  const currentLayout = availableLayouts.find(layout => layout.id === selectedLayoutId) || availableLayouts[0];
  const totalPages = currentLayout?.totalPages || 1;

  // Reset layout when student count changes
  useEffect(() => {
    if (availableLayouts.length > 0 && studentCount > 0) {
      setSelectedLayoutId(availableLayouts[0].id);
    }
    setCurrentPage(0);
  }, [studentCount]);

  // Get initial values from URL params only once
  useEffect(() => {
    const layoutParam = searchParams.get('layout');
    const pageParam = searchParams.get('page');
    const orientationParam = searchParams.get('orientation');
    const controlsParam = searchParams.get('hideControls');
    
    if (layoutParam) {
      const layout = availableLayouts.find(l => l.id === layoutParam);
      if (layout) {
        setSelectedLayoutId(layoutParam);
      }
    }
    
    if (pageParam) {
      const page = parseInt(pageParam) - 1; // Convert to 0-based index
      if (page >= 0 && page < totalPages) {
        setCurrentPage(page);
      }
    }
    
    if (orientationParam === 'rows-first') {
      setGridOrientation('rows-first');
    }
    
    if (controlsParam === 'true') {
      setIsControlsCollapsed(true);
    }
  }, []); // Only run once on mount

  // Update URL params when state changes (but don't cause re-renders)
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('layout', selectedLayoutId);
    params.set('page', (currentPage + 1).toString());
    params.set('orientation', gridOrientation);
    if (isControlsCollapsed) params.set('hideControls', 'true');
    
    setSearchParams(params, { replace: true });
  }, [selectedLayoutId, currentPage, gridOrientation, isControlsCollapsed, setSearchParams]);

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

  const handleToggleControlsCollapse = () => {
    setIsControlsCollapsed(!isControlsCollapsed);
  };

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
    gridOrientation,
    isControlsCollapsed,
    availableLayouts,
    currentLayout,
    totalPages,
    handleMaximize,
    handleMinimize,
    handleLayoutChange,
    handleOrientationChange,
    handleToggleControlsCollapse,
    handlePreviousPage,
    handleNextPage,
  };
};
