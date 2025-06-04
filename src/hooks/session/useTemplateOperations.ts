
import { useToast } from '@/hooks/use-toast';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { Student, OriginalTemplateData } from './types';

interface UseTemplateOperationsProps {
  originalTemplateData: OriginalTemplateData | null;
  title: string;
  duration: number | '';
  students: Student[];
  setOriginalTemplateData: (data: OriginalTemplateData | null) => void;
  onTemplateUpdated?: (templateId: string) => void;
}

export const useTemplateOperations = ({
  originalTemplateData,
  title,
  duration,
  students,
  setOriginalTemplateData,
  onTemplateUpdated,
}: UseTemplateOperationsProps) => {
  const { saveTemplate: saveTemplateToDb, updateTemplate: updateTemplateInDb } = useClassTemplates();
  const { toast } = useToast();

  const handleSaveTemplate = async () => {
    if (!title.trim()) {
      toast({
        title: "Session Title Required",
        description: "Please enter a session title before saving as template.",
        variant: "destructive",
      });
      return;
    }

    const validStudents = students.filter(student => student.name.trim());
    if (validStudents.length === 0) {
      toast({
        title: "No Students to Save",
        description: "Please add at least one student before saving a template.",
        variant: "destructive",
      });
      return;
    }

    await saveTemplateToDb(title.trim(), validStudents, duration);
  };

  const confirmUpdateTemplate = async () => {
    if (!originalTemplateData) return;

    if (!title.trim()) {
      toast({
        title: "Session Title Required",
        description: "Please enter a session title before updating template.",
        variant: "destructive",
      });
      return;
    }

    const validStudents = students.filter(student => student.name.trim());
    if (validStudents.length === 0) {
      toast({
        title: "No Students to Save",
        description: "Please add at least one student before updating template.",
        variant: "destructive",
      });
      return;
    }

    const success = await updateTemplateInDb(
      originalTemplateData.id,
      title.trim(),
      validStudents,
      duration
    );

    if (success) {
      // Update the original template data to reflect the new state
      setOriginalTemplateData({
        id: originalTemplateData.id,
        title: title.trim(),
        duration,
        students: validStudents,
      });

      // Force template re-selection to refresh the dropdown immediately
      if (onTemplateUpdated) {
        onTemplateUpdated(originalTemplateData.id.toString());
      }
    }
  };

  const confirmSaveAsNew = async () => {
    if (!title.trim()) {
      toast({
        title: "Session Title Required",
        description: "Please enter a session title before saving as new template.",
        variant: "destructive",
      });
      return;
    }

    const validStudents = students.filter(student => student.name.trim());
    if (validStudents.length === 0) {
      toast({
        title: "No Students to Save",
        description: "Please add at least one student before saving a template.",
        variant: "destructive",
      });
      return;
    }

    // Save as new template (don't update original template data)
    await saveTemplateToDb(title.trim(), validStudents, duration);
  };

  return {
    handleSaveTemplate,
    confirmUpdateTemplate,
    confirmSaveAsNew,
  };
};
