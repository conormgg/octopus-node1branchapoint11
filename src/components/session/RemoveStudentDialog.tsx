
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserMinus, AlertTriangle } from 'lucide-react';
import { SessionParticipant } from '@/types/student';

interface RemoveStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRemoveStudent: (participantId: number) => Promise<void>;
  sessionStudents: SessionParticipant[];
  isLoading?: boolean;
}

const RemoveStudentDialog: React.FC<RemoveStudentDialogProps> = ({
  isOpen,
  onClose,
  onRemoveStudent,
  sessionStudents,
  isLoading = false,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentId) return;
    
    setIsSubmitting(true);
    try {
      await onRemoveStudent(parseInt(selectedStudentId));
      setSelectedStudentId('');
      onClose();
    } catch (error) {
      console.error('Error removing student:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedStudentId('');
      onClose();
    }
  };

  const selectedStudent = sessionStudents.find(s => s.id.toString() === selectedStudentId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            Remove Student
          </DialogTitle>
          <DialogDescription>
            Select a student to remove from this session. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student-select">Select Student</Label>
            <Select
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a student to remove" />
              </SelectTrigger>
              <SelectContent>
                {sessionStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{student.student_name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {student.joined_at ? 'Active' : 'Pending'} • Board {student.assigned_board_suffix}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedStudent && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">
                  You are about to remove {selectedStudent.student_name}
                </p>
                <p className="text-orange-700">
                  This will permanently delete their whiteboard data and cannot be undone.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!selectedStudentId || isSubmitting}
            >
              {isSubmitting ? 'Removing...' : 'Remove Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveStudentDialog;
