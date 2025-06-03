
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface TemplateActionState {
  type: 'delete' | 'update' | 'saveAsNew' | null;
  templateId?: number;
  templateName?: string;
}

export const useTemplateActions = () => {
  const [actionState, setActionState] = useState<TemplateActionState>({ type: null });
  const { toast } = useToast();

  const openDeleteDialog = (templateId: number, templateName: string) => {
    setActionState({ type: 'delete', templateId, templateName });
  };

  const openUpdateDialog = (templateId: number, templateName: string) => {
    setActionState({ type: 'update', templateId, templateName });
  };

  const openSaveAsNewDialog = (templateName: string) => {
    setActionState({ type: 'saveAsNew', templateName });
  };

  const closeDialog = () => {
    setActionState({ type: null });
  };

  const getDialogProps = () => {
    switch (actionState.type) {
      case 'delete':
        return {
          title: 'Delete Template',
          description: `Are you sure you want to delete "${actionState.templateName}"? This action cannot be undone.`,
          confirmLabel: 'Delete',
          variant: 'destructive' as const,
        };
      case 'update':
        return {
          title: 'Update Template',
          description: `Do you want to update the existing template "${actionState.templateName}" with your current changes?`,
          confirmLabel: 'Update Template',
          variant: 'default' as const,
        };
      case 'saveAsNew':
        return {
          title: 'Save as New Template',
          description: 'This will create a new template with your current configuration, keeping the existing template unchanged.',
          confirmLabel: 'Save as New',
          variant: 'default' as const,
        };
      default:
        return null;
    }
  };

  return {
    actionState,
    openDeleteDialog,
    openUpdateDialog,
    openSaveAsNewDialog,
    closeDialog,
    getDialogProps,
  };
};
