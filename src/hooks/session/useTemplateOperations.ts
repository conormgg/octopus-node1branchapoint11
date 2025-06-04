import { useToast } from '@/hooks/use-toast';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { Student, OriginalTemplateData, ClassTemplate } from './types';
import { validateStudents, mapTemplateStudents } from './utils';

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

    const validStudents = validateStudents(students);
    if (validStudents.length === 0) {
      if (originalTemplateData && 
          originalTemplateData.students.every(s => !s.name.trim()) && 
          title.trim() === originalTemplateData.title && 
          duration === originalTemplateData.duration) {
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

    const validStudents = validateStudents(students);
    const newTemplate = await saveTemplateToDb(title.trim(), validStudents, duration);
    return newTemplate || null;
  };

  const updateTemplate = async (): Promise<{ 
    success: boolean, 
    updatedTemplate?: ClassTemplate, 
    refreshedTemplates?: ClassTemplate[]
  }> => {
    if (!originalTemplateData) return { success: false };
    if (!validateTemplateData()) return { success: false };

    const validStudents = validateStudents(students);

    const { success, updatedTemplate, refreshedTemplates } = await updateTemplateInDb(
      originalTemplateData.id,
      title.trim(),
      validStudents,
      duration
    );

    if (success && updatedTemplate) {
      const templateStudentsFromDb = mapTemplateStudents(updatedTemplate.students);
      
      setOriginalTemplateData({
        id: updatedTemplate.id,
        title: updatedTemplate.class_name,
        duration: updatedTemplate.duration_minutes || '',
        students: templateStudentsFromDb,
      });
    } else if (success) {
      setOriginalTemplateData({
        id: originalTemplateData.id,
        title: title.trim(),
        duration,
        students: validStudents.length > 0 ? validStudents : [{ name: '', email: '' }],
      });
    }

    return { success, updatedTemplate: updatedTemplate as ClassTemplate | undefined, refreshedTemplates };
  };

  const saveAsNew = async (): Promise<ClassTemplate | null> => {
    if (!validateTemplateData()) return null;

    const validStudents = validateStudents(students);
    const newTemplate = await saveTemplateToDb(title.trim(), validStudents, duration);
    return newTemplate || null;
  };

  return {
    saveTemplate,
    updateTemplate,
    saveAsNew,
  };
};
