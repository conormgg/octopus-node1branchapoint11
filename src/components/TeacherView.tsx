import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';
import TeacherHeader from './TeacherHeader';
import TeacherMainBoard from './TeacherMainBoard';
import StudentBoardsGrid from './StudentBoardsGrid';
import StudentBoardsWindow from './StudentBoardsWindow';
import PersistentPageNavigation from './PersistentPageNavigation';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { calculateLayoutOptions, generateStudentBoards, getStudentBoardsForPage } from '@/utils/layoutCalculator';

export type GridOrientation = 'columns-first' | 'rows-first';

const TeacherView: React.FC = () => {
  const [maximizedBoard, setMaximizedBoard] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [studentCount, setStudentCount] = useState(4);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('2x2');
  const [isSplitViewActive, setIsSplitViewActive] = useState(false);
  const [gridOrientation, setGridOrientation] = useState<GridOrientation>('columns-first');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  const handleMaximize = (boardId: string) => {
    setMaximizedBoard(boardId);
  };

  const handleMinimize = () => {
    setMaximizedBoard(null);
  };

  const handleStudentCountChange = (newCount: number) => {
    const clampedCount = Math.max(1, Math.min(8, newCount));
    setStudentCount(clampedCount);
    setCurrentPage(0);
    
    // Reset layout to first available option when student count changes
    const availableLayouts = calculateLayoutOptions(clampedCount);
    if (availableLayouts.length > 0) {
      setSelectedLayoutId(availableLayouts[0].id);
    }
  };

  const handleLayoutChange = (layoutId: string) => {
    setSelectedLayoutId(layoutId);
    setCurrentPage(0); // Reset to first page when layout changes
  };

  const handleOrientationChange = (orientation: GridOrientation) => {
    setGridOrientation(orientation);
  };

  const increaseStudentCount = () => {
    handleStudentCountChange(studentCount + 1);
  };

  const decreaseStudentCount = () => {
    handleStudentCountChange(studentCount - 1);
  };

  const handleToggleSplitView = () => {
    setIsSplitViewActive(!isSplitViewActive);
  };

  const handleCloseSplitView = () => {
    setIsSplitViewActive(false);
  };

  const handleToggleControlsCollapse = () => {
    setIsControlsCollapsed(!isControlsCollapsed);
  };

  // Calculate layout options and current layout
  const availableLayouts = calculateLayoutOptions(studentCount);
  const currentLayout = availableLayouts.find(layout => layout.id === selectedLayoutId) || availableLayouts[0];
  
  // Generate student boards and get current page boards
  const allStudentBoards = generateStudentBoards(studentCount);
  const currentStudentBoards = getStudentBoardsForPage(
    allStudentBoards, 
    currentPage, 
    currentLayout?.studentsPerPage || 4
  );

  const totalPages = currentLayout?.totalPages || 1;

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  // Add keyboard navigation
  useKeyboardNavigation({
    currentPage,
    totalPages,
    onPreviousPage: handlePreviousPage,
    onNextPage: handleNextPage,
    isEnabled: totalPages > 1,
  });

  if (maximizedBoard) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="h-[calc(100vh-2rem)]">
          <WhiteboardPlaceholder
            id={maximizedBoard}
            isMaximized={true}
            onMinimize={handleMinimize}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hover zone for collapsed header */}
      {isControlsCollapsed && (
        <div 
          className="absolute top-0 left-0 right-0 h-4 z-50 bg-transparent"
        />
      )}

      <TeacherHeader
        studentCount={studentCount}
        currentLayout={currentLayout}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        onIncreaseStudentCount={increaseStudentCount}
        onDecreaseStudentCount={decreaseStudentCount}
        onLayoutChange={handleLayoutChange}
        onToggleSplitView={handleToggleSplitView}
        isSplitViewActive={isSplitViewActive}
        isCollapsed={isControlsCollapsed}
        onToggleCollapse={handleToggleControlsCollapse}
      />

      {/* Persistent Page Navigation */}
      <PersistentPageNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        isVisible={!isSplitViewActive}
      />

      {/* Split View Window */}
      {isSplitViewActive && (
        <StudentBoardsWindow
          studentCount={studentCount}
          currentLayout={currentLayout}
          availableLayouts={availableLayouts}
          selectedLayoutId={selectedLayoutId}
          currentStudentBoards={currentStudentBoards}
          currentPage={currentPage}
          totalPages={totalPages}
          gridOrientation={gridOrientation}
          onMaximize={handleMaximize}
          onPreviousPage={handlePreviousPage}
          onNextPage={handleNextPage}
          onLayoutChange={handleLayoutChange}
          onOrientationChange={handleOrientationChange}
          onIncreaseStudentCount={increaseStudentCount}
          onDecreaseStudentCount={decreaseStudentCount}
          onClose={handleCloseSplitView}
        />
      )}

      {/* Main Content */}
      <div className={`${isControlsCollapsed ? 'h-screen' : 'h-[calc(100vh-5rem)]'} p-4`}>
        {isSplitViewActive ? (
          // Single panel view - only teacher's board when split view is active
          <div className="h-full">
            <TeacherMainBoard 
              onMaximize={handleMaximize} 
              isHeaderCollapsed={isControlsCollapsed}
            />
          </div>
        ) : (
          // Normal split panel view
          <ResizablePanelGroup direction="horizontal" className="rounded-lg overflow-hidden">
            {/* Left Pane - Teacher's Main Board */}
            <ResizablePanel defaultSize={60} minSize={40}>
              <TeacherMainBoard 
                onMaximize={handleMaximize} 
                isHeaderCollapsed={isControlsCollapsed}
              />
            </ResizablePanel>

            <ResizableHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors duration-150" />

            {/* Right Pane - Student Boards Grid */}
            <ResizablePanel defaultSize={40} minSize={30}>
              <StudentBoardsGrid
                studentCount={studentCount}
                currentLayout={currentLayout}
                currentStudentBoards={currentStudentBoards}
                currentPage={currentPage}
                totalPages={totalPages}
                gridOrientation={gridOrientation}
                onMaximize={handleMaximize}
                onPreviousPage={handlePreviousPage}
                onNextPage={handleNextPage}
                isHeaderCollapsed={isControlsCollapsed}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
};

export default TeacherView;
