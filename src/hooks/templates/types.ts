
export interface ClassTemplate {
  id: number;
  class_name: string;
  duration_minutes: number | null;
  created_at: string;
  students: Array<{
    student_name: string;
    student_email: string | null;
  }>;
}

export interface Student {
  name: string;
  email: string;
}
