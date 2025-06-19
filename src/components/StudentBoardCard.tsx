
import React from 'react';
import { X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';
import { StudentBoardInfo } from '@/utils/studentBoardGenerator';

interface StudentBoardCardProps {
  boardInfo: StudentBoardInfo | null;
  isMaximized: boolean;
  onMaximize: (boardId: string) => void;
  onMinimize: () => void;
  onRemoveStudent?: (boardId: string) => void;
  onAddStudent?: () => void;
  sessionId?: string;
  senderId?: string;
  portalContainer?: Element | null;
}

const StudentBoardCard: React.FC<StudentBoardCardProps> = ({
  boardInfo,
  isMaximized,
  onMaximize,
  onMinimize,
  onRemoveStudent,
  onAddStudent,
  sessionId,
  senderId,
  portalContainer,
}) => {
  // Empty slot - compressed/hidden for now, can be expanded later for "add student" functionality
  if (!boardInfo) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg opacity-50">
        <div className="text-center">
          <UserPlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Available Slot</p>
          {onAddStudent && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddStudent}
              className="mt-2"
            >
              Add Student
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Pending state - student registered but not joined
  if (boardInfo.status === 'pending') {
    return (
      <div className="h-full relative">
        {/* Close button for pending students */}
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemoveStudent?.(boardInfo.boardId)}
            className="p-1 h-auto bg-red-50 hover:bg-red-100 border-red-200"
            title="Remove pending student"
          >
            <X className="w-4 h-4 text-red-600" />
          </Button>
        </div>
        
        {/* Greyed out whiteboard */}
        <div className="h-full bg-gray-100 border-2 border-gray-200 rounded-lg opacity-60 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-semibold text-yellow-600">
                  {boardInfo.participant?.assigned_board_suffix || '?'}
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">
                {boardInfo.studentName}
              </h3>
              <p className="text-sm text-yellow-600 font-medium">Waiting to join...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active state - student has joined, show normal whiteboard
  // For teacher viewing student board, we need to ensure senderId is set properly
  const teacherSenderId = senderId || 'teacher-viewer';
  
  console.log('[StudentBoardCard] Rendering active student board:', {
    boardId: boardInfo.boardId,
    studentName: boardInfo.studentName,
    sessionId,
    teacherSenderId
  });

  return (
    <div className="h-full relative">
      {/* Student name badge */}
      <div className="absolute top-2 left-2 z-10 bg-green-100 border border-green-200 rounded-lg px-2 py-1">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-800">
            {boardInfo.studentName}
          </span>
        </div>
      </div>

      <WhiteboardPlaceholder
        id={boardInfo.boardId}
        isMaximized={isMaximized}
        onMaximize={() => onMaximize(boardInfo.boardId)}
        onMinimize={onMinimize}
        sessionId={sessionId}
        senderId={teacherSenderId}
        portalContainer={portalContainer}
      />
    </div>
  );
};

export default StudentBoardCard;
