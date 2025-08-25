
import React from 'react';

import TeacherSessionResizablePanels from './TeacherSessionResizablePanels';
import { GridOrientation } from '../TeacherView';
import { StudentBoardInfo } from '@/utils/studentBoardGenerator';
import { SyncDirection } from '@/types/student';

interface TeacherSessionMainContentProps {
  activeSession: {
    id: string;
    title: string;
    unique_url_slug: string;
    status: string;
    created_at: string;
    teacher_id: string;
  };
  studentCount: number;
  activeStudentCount?: number;
  currentLayout: any;
  availableLayouts: any[];
  selectedLayoutId: string;
  currentStudentBoards: any[];
  currentStudentBoardsInfo: (StudentBoardInfo | null)[];
  currentPage: number;
  totalPages: number;
  gridOrientation: GridOrientation;
  maximizedBoard: string | null;
  isControlsCollapsed: boolean;
  
  isSplitView2Active?: boolean;
  teacherSenderId?: string;
  onMaximize: (boardId: string) => void;
  onMinimize: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  
  // Add sync direction props
  onToggleSyncDirection?: (participantId: number) => Promise<boolean>;
  getSyncDirection?: (participantId: number) => SyncDirection;
  isParticipantUpdating?: (participantId: number) => boolean;
}

const TeacherSessionMainContent: React.FC<TeacherSessionMainContentProps> = ({
  activeSession,
  studentCount,
  activeStudentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  currentStudentBoards,
  currentStudentBoardsInfo,
  currentPage,
  totalPages,
  gridOrientation,
  maximizedBoard,
  isControlsCollapsed,
  
  isSplitView2Active = false,
  teacherSenderId,
  onMaximize,
  onMinimize,
  onPreviousPage,
  onNextPage,
  onLayoutChange,
  onOrientationChange,
  
  onToggleSyncDirection,
  getSyncDirection,
  isParticipantUpdating,
}) => {
  return (
    <div className={`flex-1 ${isControlsCollapsed ? 'h-screen' : 'h-[calc(100vh-5rem)]'} p-4`}>
      <TeacherSessionResizablePanels
        activeSession={activeSession}
        studentCount={studentCount}
        activeStudentCount={activeStudentCount}
        currentLayout={currentLayout}
        currentStudentBoards={currentStudentBoards}
        currentStudentBoardsInfo={currentStudentBoardsInfo}
        currentPage={currentPage}
        totalPages={totalPages}
        gridOrientation={gridOrientation}
        maximizedBoard={maximizedBoard}
        isControlsCollapsed={isControlsCollapsed}
        isSplitView2Active={isSplitView2Active}
        teacherSenderId={teacherSenderId}
        onMaximize={onMaximize}
        onMinimize={onMinimize}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        onToggleSyncDirection={onToggleSyncDirection}
        getSyncDirection={getSyncDirection}
        isParticipantUpdating={isParticipantUpdating}
      />
    </div>
  );
};

export default TeacherSessionMainContent;
