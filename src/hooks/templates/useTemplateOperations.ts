
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Student } from './types';

export const useTemplateOperations = () => {
  const { toast } = useToast();

  const saveTemplate = async (
    user: any,
    isDemoMode: boolean,
    templateName: string,
    students: Student[],
    duration?: number | ''
  ) => {
    if (isDemoMode || !user) {
      toast({
        title: "Demo Mode",
        description: "Template saving is not available in demo mode.",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Create the template
      const { data: templateData, error: templateError } = await supabase
        .from('saved_classes')
        .insert({
          teacher_id: user.id,
          class_name: templateName,
          duration_minutes: duration && typeof duration === 'number' ? duration : null,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Add students to the template
      if (students.length > 0) {
        const studentsToInsert = students
          .filter(student => student.name.trim())
          .map(student => ({
            saved_class_id: templateData.id,
            student_name: student.name.trim(),
            student_email: student.email.trim() || null,
          }));

        if (studentsToInsert.length > 0) {
          const { error: studentsError } = await supabase
            .from('saved_class_students')
            .insert(studentsToInsert);

          if (studentsError) throw studentsError;
        }
      }

      toast({
        title: "Template Saved!",
        description: `Class template "${templateName}" has been saved successfully.`,
      });

      return templateData.id;
    } catch (error: any) {
      toast({
        title: "Error Saving Template",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTemplate = async (
    user: any,
    isDemoMode: boolean,
    templateId: number,
    templateName: string,
    students: Student[],
    duration?: number | ''
  ) => {
    if (isDemoMode || !user) {
      toast({
        title: "Demo Mode",
        description: "Template updating is not available in demo mode.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Update the template
      const { error: templateError } = await supabase
        .from('saved_classes')
        .update({
          class_name: templateName,
          duration_minutes: duration && typeof duration === 'number' ? duration : null,
        })
        .eq('id', templateId)
        .eq('teacher_id', user.id);

      if (templateError) throw templateError;

      // Delete existing students for this template
      const { error: deleteError } = await supabase
        .from('saved_class_students')
        .delete()
        .eq('saved_class_id', templateId);

      if (deleteError) throw deleteError;

      // Add updated students to the template
      const validStudents = students.filter(student => student.name.trim());
      if (validStudents.length > 0) {
        const studentsToInsert = validStudents.map(student => ({
          saved_class_id: templateId,
          student_name: student.name.trim(),
          student_email: student.email.trim() || null,
        }));

        const { error: studentsError } = await supabase
          .from('saved_class_students')
          .insert(studentsToInsert);

        if (studentsError) throw studentsError;
      }

      toast({
        title: "Template Updated!",
        description: `Class template "${templateName}" has been updated successfully.`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error Updating Template",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteTemplate = async (
    user: any,
    isDemoMode: boolean,
    templateId: number,
    templateName: string
  ) => {
    if (isDemoMode || !user) {
      toast({
        title: "Demo Mode",
        description: "Template deletion is not available in demo mode.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('saved_classes')
        .delete()
        .eq('id', templateId)
        .eq('teacher_id', user.id);

      if (error) throw error;

      toast({
        title: "Template Deleted!",
        description: `Class template "${templateName}" has been deleted successfully.`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error Deleting Template",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    saveTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
