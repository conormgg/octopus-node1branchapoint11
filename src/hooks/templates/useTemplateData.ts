
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClassTemplate } from '@/types/templates';
import { Student } from '@/types/student';

export const useTemplateData = (user: any) => {
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async (): Promise<ClassTemplate[]> => {
    if (!user) {
      setTemplates([]);
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);
    try {
      const { data: templateData, error } = await supabase
        .from('saved_classes')
        .select(`
          id,
          class_name,
          duration_minutes,
          created_at,
          saved_class_students (
            student_name,
            student_email
          )
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTemplates: ClassTemplate[] = templateData?.map(template => ({
        ...template,
        students: template.saved_class_students || []
      })) || [];

      setTemplates(formattedTemplates);
      return formattedTemplates;
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error Loading Templates",
        description: error.message,
        variant: "destructive",
      });
      setTemplates([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplate = (templateId: number): Student[] => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return [];

    return template.students.map(student => ({
      name: student.student_name,
      email: student.student_email || '',
    }));
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  return {
    templates,
    isLoading,
    loadTemplate,
    refreshTemplates: fetchTemplates,
  };
};
