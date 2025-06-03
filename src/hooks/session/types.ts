
export interface Student {
  name: string;
  email: string;
}

export interface OriginalTemplateData {
  id: number;
  title: string;
  duration: number | '';
  students: Student[];
}

export type TemplateButtonState = 'save' | 'update' | 'none';

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
