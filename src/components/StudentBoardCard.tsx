
import React, { memo } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';
import SyncDirectionToggle from './SyncDirectionToggle';
import { StudentBoardInfo } from '@/utils/studentBoardGenerator';
import { SyncDirection } from '@/types/student';

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
  // Updated sync direction props - now using direct values instead of functions
  onToggleSyncDirection?: (participantId: number) => Promise<boolean>;
  currentSyncDirection?: SyncDirection;
  isParticipantUpdating?: boolean;
  isTeacher?: boolean;
  gridOrientation?: string;
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
  onToggleSyncDirection,
  currentSyncDirection = 'student_active',
  isParticipantUpdating = false,
  isTeacher = false,
  gridOrientation,
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
  const teacherSenderId = senderId || 'teacher-viewer';

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

      {/* Sync Direction Toggle - Moved to bottom left corner */}
      {isTeacher && boardInfo.participant && onToggleSyncDirection && (
        <div className="absolute bottom-2 left-2 z-10">
          <SyncDirectionToggle
            participantId={boardInfo.participant.id}
            currentDirection={currentSyncDirection}
            isUpdating={isParticipantUpdating}
            onToggle={onToggleSyncDirection}
            studentName={boardInfo.studentName}
          />
        </div>
      )}

      <WhiteboardPlaceholder
        id={boardInfo.boardId}
        isMaximized={isMaximized}
        onMaximize={() => onMaximize(boardInfo.boardId)}
        onMinimize={onMinimize}
        sessionId={sessionId}
        senderId={teacherSenderId}
        portalContainer={portalContainer}
        participant={boardInfo.participant}
        currentUserRole="teacher"
        currentSyncDirection={currentSyncDirection}
        // Pass sync direction toggle props for maximized view
        onToggleSyncDirection={onToggleSyncDirection}
        isParticipantUpdating={isParticipantUpdating}
        isTeacher={isTeacher}
        studentName={boardInfo.studentName}
        gridOrientation={gridOrientation}
      />
    </div>
  );
};

// Enhanced comparison function to properly detect sync direction changes
const areEqual = (prevProps: StudentBoardCardProps, nextProps: StudentBoardCardProps) => {
  // If one is null and the other isn't, they're different
  if ((!prevProps.boardInfo) !== (!nextProps.boardInfo)) return false;
  
  // If both are null, they're the same
  if (!prevProps.boardInfo && !nextProps.boardInfo) return true;
  
  // If both exist, compare the key properties
  if (prevProps.boardInfo && nextProps.boardInfo) {
    const boardChanged = prevProps.boardInfo.boardId !== nextProps.boardInfo.boardId ||
                        prevProps.boardInfo.status !== nextProps.boardInfo.status ||
                        prevProps.boardInfo.studentName !== nextProps.boardInfo.studentName;
    
    if (boardChanged) return false;
  }
  
  // Compare sync direction and loading state - CRITICAL for reactive updates
  const syncStateChanged = prevProps.currentSyncDirection !== nextProps.currentSyncDirection ||
                          prevProps.isParticipantUpdating !== nextProps.isParticipantUpdating;
  
  if (syncStateChanged) return false;
  
  // Compare other props that affect rendering
  return prevProps.isMaximized === nextProps.isMaximized &&
         prevProps.sessionId === nextProps.sessionId &&
         prevProps.senderId === nextProps.senderId &&
         prevProps.isTeacher === nextProps.isTeacher;
};

export default memo(StudentBoardCard, areEqual);
