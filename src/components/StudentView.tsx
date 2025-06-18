
import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';
import { GraduationCap, User } from 'lucide-react';

interface StudentViewProps {
  sessionId: string;
}

const StudentView: React.FC<StudentViewProps> = ({ sessionId }) => {
  const [maximizedBoard, setMaximizedBoard] = useState<string | null>(null);

  const handleMaximize = (boardId: string) => {
    setMaximizedBoard(boardId);
  };

  const handleMinimize = () => {
    setMaximizedBoard(null);
  };

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
              <h1 className="text-xl font-semibold text-gray-900">Student Workspace</h1>
              <p className="text-sm text-gray-500">Collaborative Whiteboard Session</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Student View</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-5rem)] p-4 relative">
        {/* Normal Layout */}
        <ResizablePanelGroup direction="horizontal" className="rounded-lg overflow-hidden">
          {/* Left Pane - Teacher's Shared Board */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full p-2 relative">
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2 text-blue-500" />
                  Teacher's Board
                </h2>
                <p className="text-sm text-gray-600">Shared content from your instructor</p>
              </div>
              <div 
                className={`h-[calc(100%-4rem)] ${
                  maximizedBoard === "student-shared-teacher" 
                    ? "fixed inset-4 z-50 bg-gray-100" 
                    : ""
                }`}
              >
                <WhiteboardPlaceholder
                  id="student-shared-teacher"
                  isMaximized={maximizedBoard === "student-shared-teacher"}
                  onMaximize={() => handleMaximize("student-shared-teacher")}
                  onMinimize={handleMinimize}
                  sessionId={sessionId}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors duration-150" />

          {/* Right Pane - Personal Board (synced with teacherA) */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full p-2 relative">
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <User className="w-5 h-5 mr-2 text-green-500" />
                  Your Personal Board
                </h2>
                <p className="text-sm text-gray-600">Your workspace - shared with teacher for feedback</p>
              </div>
              <div 
                className={`h-[calc(100%-4rem)] ${
                  maximizedBoard === "student2" 
                    ? "fixed inset-4 z-50 bg-gray-100" 
                    : ""
                }`}
              >
                <WhiteboardPlaceholder
                  id="student2"
                  isMaximized={maximizedBoard === "student2"}
                  onMaximize={() => handleMaximize("student2")}
                  onMinimize={handleMinimize}
                  sessionId={sessionId}
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
