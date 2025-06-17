
import { SessionParticipant } from '@/types/student';

export interface StudentBoardInfo {
  boardId: string;
  studentName: string;
  status: 'active' | 'pending';
  participant: SessionParticipant | null;
}

// Generate stable StudentBoardInfo objects from participants
export const generateStudentBoardsFromParticipants = (participants: SessionParticipant[]): StudentBoardInfo[] => {
  return participants.map(participant => ({
    boardId: `student-${participant.assigned_board_suffix.toLowerCase()}`,
    studentName: participant.student_name,
    status: participant.joined_at ? 'active' : 'pending' as 'active' | 'pending',
    participant
  }));
};

// Generate grid slots with null placeholders for empty positions
export const generateGridSlotsWithStatus = (
  studentBoards: StudentBoardInfo[],
  currentPage: number,
  studentsPerPage: number
): (StudentBoardInfo | null)[] => {
  const startIndex = currentPage * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  
  // Create an array of the correct size, fill with nulls first
  const slots: (StudentBoardInfo | null)[] = new Array(studentsPerPage).fill(null);
  
  // Fill in the actual student boards for this page
  studentBoards.slice(startIndex, endIndex).forEach((board, index) => {
    slots[index] = board;
  });
  
  return slots;
};

// Stable key generator for StudentBoardInfo objects
export const getStableBoardKey = (boardInfo: StudentBoardInfo | null, index: number): string => {
  if (!boardInfo) {
    return `empty-slot-${index}`;
  }
  
  // Use participant ID if available for maximum stability
  if (boardInfo.participant?.id) {
    return `participant-${boardInfo.participant.id}`;
  }
  
  // Fall back to boardId which should be stable
  return boardInfo.boardId;
};
