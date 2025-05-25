
import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';
import { GraduationCap, Users } from 'lucide-react';

const TeacherView: React.FC = () => {
  const [maximizedBoard, setMaximizedBoard] = useState<string | null>(null);

  const handleMaximize = (boardId: string) => {
    setMaximizedBoard(boardId);
  };

  const handleMinimize = () => {
    setMaximizedBoard(null);
  };

  // Student board IDs for the 2x2 grid
  const studentBoards = ['student-a', 'student-b', 'student-c', 'student-d'];

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
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Teacher View</span>
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
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-500" />
                  Student Boards
                </h2>
                <p className="text-sm text-gray-600">Monitor and interact with student work</p>
              </div>
              <div className="h-[calc(100%-4rem)]">
                <div className="grid grid-cols-2 gap-3 h-full">
                  {studentBoards.map((boardId) => (
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
