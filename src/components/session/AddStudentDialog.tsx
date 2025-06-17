
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface AddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (name: string, email?: string) => Promise<boolean>;
  isLoading?: boolean;
}

const AddStudentDialog: React.FC<AddStudentDialogProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  isLoading = false,
}) => {
  const [studentName, setStudentName] = React.useState('');
  const [studentEmail, setStudentEmail] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentName.trim()) {
      setError('Student name is required');
      return;
    }

    setError('');
    const success = await onAddStudent(studentName.trim(), studentEmail.trim() || undefined);
    
    if (success) {
      // Clear form and close dialog on success
      setStudentName('');
      setStudentEmail('');
      onClose();
    } else {
      setError('Failed to add student. Please try again.');
    }
  };

  const handleClose = () => {
    setStudentName('');
    setStudentEmail('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="studentName" className="text-sm font-medium">
              Student Name *
            </label>
            <Input
              id="studentName"
              type="text"
              placeholder="Enter student name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div>
            <label htmlFor="studentEmail" className="text-sm font-medium">
              Email (optional)
            </label>
            <Input
              id="studentEmail"
              type="email"
              placeholder="Enter student email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          
          <DialogFooter className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !studentName.trim()}
            >
              {isLoading ? 'Adding...' : 'Add Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentDialog;
