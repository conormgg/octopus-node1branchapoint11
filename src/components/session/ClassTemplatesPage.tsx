
import React, { useState } from 'react';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { useToast } from '@/hooks/use-toast';
import { BookOpen } from 'lucide-react';
import ClassTemplatesHeader from './ClassTemplatesHeader';
import ClassTemplatesEmpty from './ClassTemplatesEmpty';
import ClassTemplatesTable from './ClassTemplatesTable';
import DeleteTemplateDialog from './DeleteTemplateDialog';

interface ClassTemplatesPageProps {
  onBack: () => void;
}

const ClassTemplatesPage: React.FC<ClassTemplatesPageProps> = ({ onBack }) => {
  const { templates, isLoading } = useClassTemplates();
  const [showDeleteDialog, setShowDeleteDialog] = useState<any>(null);
  const { toast } = useToast();

  const handleDeleteTemplate = async (templateId: number) => {
    // This would need a delete function in the hook
    // For now, just show a placeholder
    toast({
      title: "Delete Functionality",
      description: "Delete functionality will be implemented in the next phase.",
    });
    setShowDeleteDialog(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Loading templates...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <ClassTemplatesHeader onBack={onBack} />

        {templates.length === 0 ? (
          <ClassTemplatesEmpty onBack={onBack} />
        ) : (
          <ClassTemplatesTable
            templates={templates}
            onDeleteTemplate={setShowDeleteDialog}
          />
        )}

        <DeleteTemplateDialog
          template={showDeleteDialog}
          onClose={() => setShowDeleteDialog(null)}
          onConfirm={handleDeleteTemplate}
        />
      </div>
    </div>
  );
};

export default ClassTemplatesPage;
