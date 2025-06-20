
import React from 'react';
import StudentBoardsGrid from '../StudentBoardsGrid';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from '../TeacherView';
import { StudentBoardInfo } from '@/utils/studentBoardGenerator';
import { SyncDirection } from '@/types/student';

interface WindowContentBodyProps {
  studentCount: number;
  activeStudentCount?: number;
  currentLayout: LayoutOption | undefined;
  currentStudentBoardsInfo: (StudentBoardInfo | null)[];
  currentPage: number;
  totalPages: number;
  gridOrientation: GridOrientation;
  maximizedBoard: string | null;
  isHeaderCollapsed: boolean;
  onMaximize: (boardId: string) => void;
  onMinimize: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  sessionId?: string;
  senderId?: string;
  // Add sync direction props
  onToggleSyncDirection?: (participantId: number) => Promise<boolean>;
  getSyncDirection?: (participantId: number) => SyncDirection;
  isParticipantUpdating?: (participantId: number) => boolean;
}

const WindowContentBody: React.FC<WindowContentBodyProps> = ({
  studentCount,
  activeStudentCount = 0,
  currentLayout,
  currentStudentBoardsInfo,
  currentPage,
  totalPages,
  gridOrientation,
  maximizedBoard,
  isHeaderCollapsed,
  onMaximize,
  onMinimize,
  onPreviousPage,
  onNextPage,
  sessionId,
  senderId,
  onToggleSyncDirection,
  getSyncDirection,
  isParticipantUpdating,
}) => {
  return (
    <div className={`flex-1 min-h-0 ${isHeaderCollapsed ? 'p-4 pt-2' : 'px-4 pb-4'}`}>
      <StudentBoardsGrid
        studentCount={studentCount}
        activeStudentCount={activeStudentCount}
        currentLayout={currentLayout}
        currentStudentBoardsInfo={currentStudentBoardsInfo}
        currentPage={currentPage}
        totalPages={totalPages}
        gridOrientation={gridOrientation}
        maximizedBoard={maximizedBoard}
        onMaximize={onMaximize}
        onMinimize={onMinimize}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        isHeaderCollapsed={isHeaderCollapsed}
        sessionId={sessionId}
        senderId={senderId}
        onToggleSyncDirection={onToggleSyncDirection}
        getSyncDirection={getSyncDirection}
        isParticipantUpdating={isParticipantUpdating}
        isTeacher={true}
      />
    </div>
  );
};

export default WindowContentBody;
