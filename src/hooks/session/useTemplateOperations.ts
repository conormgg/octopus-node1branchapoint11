
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

  const handleSaveTemplate = async (): Promise<ClassTemplate | null> => {
    if (!title.trim()) {
      toast({
        title: "Session Title Required",
        description: "Please enter a session title before saving as template.",
        variant: "destructive",
      });
      return null;
    }

    const validStudents = students.filter(student => student.name.trim());
    if (validStudents.length === 0) {
      toast({
        title: "No Students to Save",
        description: "Please add at least one student before saving a template.",
        variant: "destructive",
      });
      return null;
    }

    const newTemplate = await saveTemplateToDb(title.trim(), validStudents, duration);
    return newTemplate || null;
  };

  const confirmUpdateTemplate = async (): Promise<{ success: boolean, updatedTemplate?: ClassTemplate }> => {
    if (!originalTemplateData) return { success: false };

    if (!title.trim()) {
      toast({
        title: "Session Title Required",
        description: "Please enter a session title before updating template.",
        variant: "destructive",
      });
      return { success: false };
    }

    const validStudents = students.filter(student => student.name.trim());
    if (validStudents.length === 0) {
      toast({
        title: "No Students to Save",
        description: "Please add at least one student before updating template.",
        variant: "destructive",
      });
      return { success: false };
    }

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

  const confirmSaveAsNew = async (): Promise<ClassTemplate | null> => {
    if (!title.trim()) {
      toast({
        title: "Session Title Required",
        description: "Please enter a session title before saving as new template.",
        variant: "destructive",
      });
      return null;
    }

    const validStudents = students.filter(student => student.name.trim());
    if (validStudents.length === 0) {
      toast({
        title: "No Students to Save",
        description: "Please add at least one student before saving a template.",
        variant: "destructive",
      });
      return null;
    }

    const newTemplate = await saveTemplateToDb(title.trim(), validStudents, duration);
    return newTemplate || null;
  };

  return {
    handleSaveTemplate,
    confirmUpdateTemplate,
    confirmSaveAsNew,
  };
};
