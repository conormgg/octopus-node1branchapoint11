
import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';
import StudentHeader from './StudentHeader';

const StudentView: React.FC = () => {
  const [maximizedBoard, setMaximizedBoard] = useState<string | null>(null);

  const handleMaximize = (boardId: string) => {
    setMaximizedBoard(boardId);
  };

  const handleMinimize = () => {
    setMaximizedBoard(null);
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
      <StudentHeader />

      {/* Main Content */}
      <div className="h-[calc(100vh-5rem)] p-4">
        <ResizablePanelGroup direction="horizontal" className="rounded-lg overflow-hidden">
          {/* Left Pane - Shared Teacher Board */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full p-2">
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <div className="w-5 h-5 mr-2 bg-blue-500 rounded"></div>
                  Teacher's Board
                </h2>
                <p className="text-sm text-gray-600">Shared whiteboard from your instructor</p>
              </div>
              <div className="h-[calc(100%-4rem)]">
                <WhiteboardPlaceholder
                  id="student-shared-teacher"
                  onMaximize={() => handleMaximize("student-shared-teacher")}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors duration-150" />

          {/* Right Pane - Personal Student Board */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full p-2">
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <div className="w-5 h-5 mr-2 bg-green-500 rounded"></div>
                  Your Personal Board
                </h2>
                <p className="text-sm text-gray-600">Your private workspace for notes and practice</p>
              </div>
              <div className="h-[calc(100%-4rem)]">
                <WhiteboardPlaceholder
                  id="student-personal"
                  onMaximize={() => handleMaximize("student-personal")}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default StudentView;
