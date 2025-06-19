
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
    // Generate correct board ID format for teacher's view of student boards
    const boardId = `student-board-${boardSuffix.toLowerCase()}`; // Now creates: student-board-a, student-board-b
    
    // Validate that we're creating a valid string ID
    if (typeof boardId !== 'string' || !boardId) {
      console.error('[generateStudentBoardsFromParticipants] Invalid boardId generated:', boardId, 'for participant:', participant);
    }

    console.log('[generateStudentBoardsFromParticipants] Generated board ID:', boardId, 'for participant:', participant.student_name);
    
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
 * This function fills out the grid to match the layout's expected number of slots
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
