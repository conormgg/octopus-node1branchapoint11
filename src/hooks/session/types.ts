
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
