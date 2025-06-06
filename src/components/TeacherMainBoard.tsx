
import React from 'react';
import { GraduationCap } from 'lucide-react';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';

interface TeacherMainBoardProps {
  onMaximize: (boardId: string) => void;
  isHeaderCollapsed?: boolean;
  sessionId: string;
}

const TeacherMainBoard: React.FC<TeacherMainBoardProps> = ({ 
  onMaximize, 
  isHeaderCollapsed = false,
  sessionId
}) => {
  return (
    <div className="h-full p-2">
      {!isHeaderCollapsed && (
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2 text-blue-500" />
            Main Teaching Board
          </h2>
          <p className="text-sm text-gray-600">Your primary whiteboard for instruction</p>
        </div>
      )}
      <div className={`${isHeaderCollapsed ? 'h-full' : 'h-[calc(100%-4rem)]'}`}>
        <WhiteboardPlaceholder
          id="teacher-main"
          onMaximize={() => onMaximize("teacher-main")}
          sessionId={sessionId}
        />
      </div>
    </div>
  );
};

export default TeacherMainBoard;
