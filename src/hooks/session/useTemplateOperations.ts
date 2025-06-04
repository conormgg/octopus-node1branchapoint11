
import { useToast } from '@/hooks/use-toast';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { Student, OriginalTemplateData, ClassTemplate } from './types';

interface UseTemplateOperationsProps {
  originalTemplateData: OriginalTemplateData | null;
  title: string;
  duration: number | '';
  students: Student[];
  setOriginalTemplateData: (data: OriginalTemplateData | null) => void;
}

export const useTemplateOperations = ({
  originalTemplateData,
  title,
  duration,
  students,
  setOriginalTemplateData,
}: UseTemplateOperationsProps) => {
  const { saveTemplate: saveTemplateToDb, updateTemplate: updateTemplateInDb } = useClassTemplates();
  const { toast } = useToast();

  const validateTemplateData = () => {
    if (!title.trim()) {
      toast({
        title: "Session Title Required",
        description: "Please enter a session title before saving template.",
        variant: "destructive",
      });
      return false;
    }

    const validStudents = students.filter(student => student.name.trim());
    if (validStudents.length === 0) {
      toast({
        title: "No Students to Save",
        description: "Please add at least one student before saving a template.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const saveTemplate = async (): Promise<ClassTemplate | null> => {
    if (!validateTemplateData()) return null;

    const validStudents = students.filter(student => student.name.trim());
    const newTemplate = await saveTemplateToDb(title.trim(), validStudents, duration);
    return newTemplate || null;
  };

  const updateTemplate = async (): Promise<{ success: boolean, updatedTemplate?: ClassTemplate }> => {
    if (!originalTemplateData) return { success: false };
    if (!validateTemplateData()) return { success: false };

    const validStudents = students.filter(student => student.name.trim());
    const { success, updatedTemplate } = await updateTemplateInDb(
      originalTemplateData.id,
      title.trim(),
      validStudents,
      duration
    );

    if (success && updatedTemplate) {
      const templateStudentsFromDb = updatedTemplate.students.map(s => ({ 
        name: s.student_name, 
        email: s.student_email || '' 
      }));
      
      setOriginalTemplateData({
        id: updatedTemplate.id,
        title: updatedTemplate.class_name,
        duration: updatedTemplate.duration_minutes || '',
        students: templateStudentsFromDb.length > 0 ? templateStudentsFromDb : [{ name: '', email: '' }],
      });
    } else if (success) {
      setOriginalTemplateData({
        id: originalTemplateData.id,
        title: title.trim(),
        duration,
        students: validStudents.length > 0 ? validStudents : [{ name: '', email: '' }],
      });
    }

    return { success, updatedTemplate };
  };

  const saveAsNew = async (): Promise<ClassTemplate | null> => {
    if (!validateTemplateData()) return null;

    const validStudents = students.filter(student => student.name.trim());
    const newTemplate = await saveTemplateToDb(title.trim(), validStudents, duration);
    return newTemplate || null;
  };

  return {
    saveTemplate,
    updateTemplate,
    saveAsNew,
  };
};
