
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
        description: "Please enter a session title.",
        variant: "destructive",
      });
      return false;
    }

    const validStudents = students.filter(student => student.name.trim());
    if (validStudents.length === 0) {
      // Allow empty if original was also empty and no other changes
      if (originalTemplateData && 
          originalTemplateData.students.every(s => !s.name.trim()) && 
          title.trim() === originalTemplateData.title && 
          duration === originalTemplateData.duration) {
        // Template is identical to an empty original template, allow update
        return true;
      } else {
        toast({
          title: "No Students to Save",
          description: "Please add at least one student or ensure the template is meant to be empty.",
          variant: "destructive",
        });
        return false;
      }
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
      // Use the definitive updatedTemplate from DB to set originalTemplateData
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
      // Fallback: update was successful but we didn't get the template object back
      setOriginalTemplateData({
        id: originalTemplateData.id,
        title: title.trim(),
        duration,
        students: validStudents.length > 0 ? validStudents : [{ name: '', email: '' }],
      });
    }

    return { success, updatedTemplate: updatedTemplate as ClassTemplate | undefined };
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
