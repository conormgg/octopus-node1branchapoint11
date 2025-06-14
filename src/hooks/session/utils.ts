
import { Student } from '@/types/student';

export const validateStudents = (students: Student[]): Student[] => {
  return students.filter(student => student.name.trim());
};

export const mapTemplateStudents = (templateStudents: Array<{ student_name: string; student_email: string | null }>): Student[] => {
  if (templateStudents.length === 0) {
    return [{ name: '', email: '' }];
  }
  
  return templateStudents.map(student => ({
    name: student.student_name,
    email: student.student_email || '',
  }));
};
