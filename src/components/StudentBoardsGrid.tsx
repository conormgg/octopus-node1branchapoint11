import React from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StudentBoardCard from './StudentBoardCard';
import PersistentPageNavigation from './PersistentPageNavigation';
import { LayoutOption, getOrientationAwareGridClasses } from '@/utils/layoutCalculator';
import { GridOrientation } from './TeacherView';
import { StudentBoardInfo } from '@/utils/studentBoardGenerator';
import { SyncDirection } from '@/types/student';

interface StudentBoardsGridProps {
  studentCount: number;
  activeStudentCount: number;
  currentLayout: LayoutOption | undefined;
  currentStudentBoardsInfo: (StudentBoardInfo | null)[];
  currentPage: number;
  totalPages: number;
  gridOrientation: GridOrientation;
  maximizedBoard: string | null;
  onMaximize: (boardId: string) => void;
  onMinimize: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onRemoveStudent?: (boardId: string) => void;
  onAddStudent?: () => void;
  isHeaderCollapsed?: boolean;
  sessionId?: string;
  senderId?: string;
  portalContainer?: Element | null;
  // Sync direction props
  onToggleSyncDirection?: (participantId: number) => Promise<boolean>;
  getSyncDirection?: (participantId: number) => SyncDirection;
  isParticipantUpdating?: (participantId: number) => boolean;
  isTeacher?: boolean;
}

const StudentBoardsGrid: React.FC<StudentBoardsGridProps> = ({
  studentCount,
  activeStudentCount,
  currentLayout,
  currentStudentBoardsInfo,
  currentPage,
  totalPages,
  gridOrientation,
  maximizedBoard,
  onMaximize,
  onMinimize,
  onPreviousPage,
  onNextPage,
  onRemoveStudent,
  onAddStudent,
  isHeaderCollapsed = false,
  sessionId,
  senderId,
  portalContainer,
  onToggleSyncDirection,
  getSyncDirection,
  isParticipantUpdating,
  isTeacher = false,
}) => {
  const renderStudentGrid = () => {
    if (!currentLayout) return null;

    const gridClass = getOrientationAwareGridClasses(currentLayout, gridOrientation);

    return (
      <div className={`grid ${gridClass} gap-3 h-full`}>
        {currentStudentBoardsInfo.map((boardInfo, index) => {
          // Use stable key for React optimization
          const key = boardInfo?.key || `empty-slot-${index}`;
          
          // Calculate current sync direction for this specific board
          const currentSyncDirection = boardInfo?.participant && getSyncDirection 
            ? getSyncDirection(boardInfo.participant.id)
            : 'student_active';
          
          const isUpdating = boardInfo?.participant && isParticipantUpdating 
            ? isParticipantUpdating(boardInfo.participant.id)
            : false;
          
          return (
            <div key={key} className="min-h-0 h-full">
              <StudentBoardCard
                boardInfo={boardInfo}
                isMaximized={maximizedBoard === boardInfo?.boardId}
                onMaximize={onMaximize}
                onMinimize={onMinimize}
                onRemoveStudent={onRemoveStudent}
                onAddStudent={onAddStudent}
                sessionId={sessionId}
                senderId={senderId}
                portalContainer={portalContainer}
                onToggleSyncDirection={onToggleSyncDirection}
                currentSyncDirection={currentSyncDirection}
                isParticipantUpdating={isUpdating}
                isTeacher={isTeacher}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full p-2 relative">
      {!isHeaderCollapsed && (
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-500" />
                Student Boards ({activeStudentCount}/{studentCount})
              </h2>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPreviousPage}
                  disabled={currentPage === 0}
                  className="flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>
                
                <span className="text-sm text-gray-600 px-2">
                  Page {currentPage + 1} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600">
            {currentLayout && `Showing students in ${currentLayout.name} layout`}
            {activeStudentCount !== studentCount && (
              <span className="text-yellow-600 ml-2">
                • {studentCount - activeStudentCount} pending
              </span>
            )}
          </p>
        </div>
      )}
      
      <div className={`${isHeaderCollapsed ? 'h-full' : 'h-[calc(100%-4rem)]'} relative`}>
        {renderStudentGrid()}
        
        <PersistentPageNavigation
          currentPage={currentPage}
          totalPages={totalPages}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
        />
      </div>
    </div>
  );
};

export default StudentBoardsGrid;
