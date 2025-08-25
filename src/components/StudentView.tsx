import React from 'react';
import { SyncWhiteboard } from './SyncWhiteboard';
import { useSessionStudents } from '@/hooks/useSessionStudents';

interface StudentViewProps {
  whiteboardId: string;
  sessionId: string;
  studentId: string;
}

export const StudentView = ({ whiteboardId, sessionId, studentId }: StudentViewProps) => {
  const { data: sessionStudents } = useSessionStudents(sessionId);
  const currentStudent = sessionStudents?.find(s => s.id === parseInt(studentId));

  if (!currentStudent) {
    return <div>Loading student information...</div>;
  }

  const studentBoardId = `student-${currentStudent.assigned_board_suffix}`;
  const sharedBoardId = "student-shared-teacher"; // Reverted back to original

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/50">
        <h2 className="text-lg font-semibold">Student View</h2>
        <p className="text-sm text-muted-foreground">
          Viewing as: {currentStudent.student_name} ({currentStudent.student_email})
        </p>
      </div>
      
      <div className="flex-1 flex">
        {/* Left side - Shared board with teacher */}
        <div className="w-1/2 border-r border-border">
          <div className="p-4 border-b border-border bg-muted/50">
            <h3 className="text-sm font-medium text-muted-foreground">
              Shared with Teacher
            </h3>
          </div>
          <div className="h-[calc(100vh-140px)]">
            <SyncWhiteboard
              whiteboardId={sharedBoardId}
              sessionId={sessionId}
              senderId={studentId}
              isReceiveOnly={false}
              showToolbar={true}
            />
          </div>
        </div>

        {/* Right side - Personal student board */}
        <div className="w-1/2">
          <div className="p-4 border-b border-border bg-muted/50">
            <h3 className="text-sm font-medium text-muted-foreground">
              Personal Workspace
            </h3>
          </div>
          <div className="h-[calc(100vh-140px)]">
            <SyncWhiteboard
              whiteboardId={studentBoardId}
              sessionId={sessionId}
              senderId={studentId}
              isReceiveOnly={false}
              showToolbar={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
