
import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';
import { GraduationCap, Users, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TeacherView: React.FC = () => {
  const [maximizedBoard, setMaximizedBoard] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [studentCount, setStudentCount] = useState(4);

  const handleMaximize = (boardId: string) => {
    setMaximizedBoard(boardId);
  };

  const handleMinimize = () => {
    setMaximizedBoard(null);
  };

  const handleStudentCountChange = (newCount: number) => {
    const clampedCount = Math.max(1, Math.min(8, newCount));
    setStudentCount(clampedCount);
    setCurrentPage(0); // Reset to first page when student count changes
  };

  const increaseStudentCount = () => {
    handleStudentCountChange(studentCount + 1);
  };

  const decreaseStudentCount = () => {
    handleStudentCountChange(studentCount - 1);
  };

  // Generate student board IDs based on count
  const generateStudentBoards = (count: number) => {
    return Array.from({ length: count }, (_, i) => 
      `student-${String.fromCharCode(97 + i)}`
    );
  };

  // Define student board pages
  const studentBoardPages = [
    ['student-a', 'student-b', 'student-c', 'student-d'],
    ['student-e', 'student-f', 'student-g', 'student-h']
  ];

  const currentStudentBoards = studentBoardPages[currentPage];
  const totalPages = studentBoardPages.length;

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Teacher Dashboard</h1>
              <p className="text-sm text-gray-500">Collaborative Whiteboard Session</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Student Count Controls */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Students:</span>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={decreaseStudentCount}
                  disabled={studentCount <= 1}
                  className="h-6 w-6 p-0"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm font-bold text-gray-800 min-w-[1.5rem] text-center">
                  {studentCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={increaseStudentCount}
                  disabled={studentCount >= 8}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Current Layout Info */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Layout: 2x2 Grid</span>
            </div>

            {/* View Type Badge */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Teacher View</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-5rem)] p-4">
        <ResizablePanelGroup direction="horizontal" className="rounded-lg overflow-hidden">
          {/* Left Pane - Teacher's Main Board */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full p-2">
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2 text-blue-500" />
                  Main Teaching Board
                </h2>
                <p className="text-sm text-gray-600">Your primary whiteboard for instruction</p>
              </div>
              <div className="h-[calc(100%-4rem)]">
                <WhiteboardPlaceholder
                  id="teacher-main"
                  onMaximize={() => handleMaximize("teacher-main")}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors duration-150" />

          {/* Right Pane - Student Boards Grid */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full p-2">
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-green-500" />
                      Student Boards ({studentCount} active)
                    </h2>
                    <p className="text-sm text-gray-600">Monitor and interact with student work</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600 px-2">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="h-[calc(100%-4rem)]">
                <div className="grid grid-cols-2 gap-3 h-full">
                  {currentStudentBoards.map((boardId) => (
                    <div key={boardId} className="min-h-0">
                      <WhiteboardPlaceholder
                        id={boardId}
                        onMaximize={() => handleMaximize(boardId)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default TeacherView;
