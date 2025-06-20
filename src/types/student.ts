
/**
 * Represents a student, typically for creating a class template.
 * This is used on the frontend form before saving to the database.
 */
export interface Student {
  name: string;
  email: string;
}

/**
 * Sync direction type for controlling who can actively modify the whiteboard
 */
export type SyncDirection = 'student_active' | 'teacher_active';

/**
 * Represents a student who has joined a session (a participant).
 * This corresponds to the 'session_participants' table.
 */
export interface SessionParticipant {
  id: number;
  session_id: string;
  student_name: string;
  student_email: string | null;
  assigned_board_suffix: string;
  joined_at: string | null;
  sync_direction: SyncDirection;
}
