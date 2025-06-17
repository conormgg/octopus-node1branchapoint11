
import { useState } from 'react';

export const useAddStudentDialog = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  const handleAddStudent = async (
    addStudentFn: (name: string, email?: string) => Promise<boolean>,
    name: string,
    email?: string
  ) => {
    setIsLoading(true);
    try {
      const success = await addStudentFn(name, email);
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isDialogOpen,
    isLoading,
    openDialog,
    closeDialog,
    handleAddStudent,
  };
};
