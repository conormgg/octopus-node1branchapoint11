
import { Student } from './student';

/**
 * Represents a saved class template.
 * This corresponds to the 'saved_classes' table with a join on 'saved_class_students'.
 */
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

/**
 * Represents the original data of a loaded template for change detection.
 */
export interface OriginalTemplateData {
  id: number;
  title: string;
  duration: number | '';
  students: Student[];
}

/**
 * Represents the state of the template action buttons.
 */
export type TemplateButtonState = 'save' | 'update' | 'none';
