
import { SessionParticipant } from '@/types/student';

export interface StudentBoardInfo {
  boardId: string;
  studentName: string;
  status: 'active' | 'pending';
  participant?: SessionParticipant;
}

/**
 * Generate student board information from session participants
 */
export const generateStudentBoardsFromParticipants = (
  participants: SessionParticipant[]
): StudentBoardInfo[] => {
  return participants.map(participant => {
    // Ensure we always have a valid board suffix
    const boardSuffix = participant.assigned_board_suffix || 'unknown';
    const boardId = `student-${boardSuffix.toLowerCase()}`; // A -> student-a, B -> student-b
    
    // Validate that we're creating a valid string ID
    if (typeof boardId !== 'string' || !boardId) {
      console.error('[generateStudentBoardsFromParticipants] Invalid boardId generated:', boardId, 'for participant:', participant);
    }
    
    return {
      boardId,
      studentName: participant.student_name || 'Unknown Student',
      status: participant.joined_at ? 'active' : 'pending',
      participant
    };
  });
};

/**
 * Get student boards for a specific page with status information
 */
export const getStudentBoardsForPageWithStatus = (
  studentBoards: StudentBoardInfo[], 
  page: number, 
  studentsPerPage: number
): StudentBoardInfo[] => {
  const startIndex = page * studentsPerPage;
  const endIndex = Math.min(startIndex + studentsPerPage, studentBoards.length);
  return studentBoards.slice(startIndex, endIndex);
};

/**
 * Generate grid slots with proper typing for empty placeholders
 */
export const generateGridSlotsWithStatus = (
  studentBoards: StudentBoardInfo[],
  page: number,
  studentsPerPage: number
): (StudentBoardInfo | null)[] => {
  const currentPageBoards = getStudentBoardsForPageWithStatus(studentBoards, page, studentsPerPage);
  const slots: (StudentBoardInfo | null)[] = [...currentPageBoards];
  
  // Fill remaining slots with null for empty placeholders
  while (slots.length < studentsPerPage) {
    slots.push(null);
  }
  
  return slots;
};
