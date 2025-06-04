
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ClassTemplate {
  id: number;
  class_name: string;
  duration_minutes: number | null;
  created_at: string;
  students: Array<{
    student_name: string;
    student_email: string | null;
  }>;
}

interface DeleteTemplateDialogProps {
  template: ClassTemplate | null;
  onClose: () => void;
  onConfirm: (templateId: number) => void;
}

const DeleteTemplateDialog: React.FC<DeleteTemplateDialogProps> = ({
  template,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={!!template} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Template</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{template?.class_name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => template && onConfirm(template.id)}
          >
            Delete Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTemplateDialog;
