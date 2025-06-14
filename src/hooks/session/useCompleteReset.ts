
import { useToast } from '@/hooks/use-toast';
import { OriginalTemplateData } from '@/types/templates';

interface UseCompleteResetProps {
  setSelectedTemplateId: (id: string) => void;
  setOriginalTemplateData: (data: OriginalTemplateData | null) => void;
  resetForm: () => void;
}

export const useCompleteReset = ({
  setSelectedTemplateId,
  setOriginalTemplateData,
  resetForm,
}: UseCompleteResetProps) => {
  const { toast } = useToast();

  const handleCompleteReset = () => {
    // Clear template selection
    setSelectedTemplateId('');
    
    // Clear template data
    setOriginalTemplateData(null);
    
    // Reset all form fields
    resetForm();
    
    // Show success message
    toast({
      title: "Form Cleared",
      description: "All form data has been cleared successfully.",
    });
  };

  return {
    handleCompleteReset,
  };
};
