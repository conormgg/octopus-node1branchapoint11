
/**
 * Represents a whiteboard session.
 * This is the single source of truth for the Session type.
 * It is derived from the 'sessions' table in the database.
 */
export interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
  teacher_id: string;
  duration_minutes?: number | null;
  last_activity_at?: string | null;
}
