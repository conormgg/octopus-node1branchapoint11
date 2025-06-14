
import { useState } from 'react';
import { Student } from '@/types/student';

export const useFormState = () => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [students, setStudents] = useState<Student[]>([{ name: '', email: '' }]);
  const [isLoading, setIsLoading] = useState(false);

  const addStudent = () => {
    if (students.length < 8) {
      setStudents([...students, { name: '', email: '' }]);
    }
  };

  const removeStudent = (index: number) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index));
    }
  };

  const updateStudent = (index: number, field: keyof Student, value: string) => {
    const updatedStudents = students.map((student, i) =>
      i === index ? { ...student, [field]: value } : student
    );
    setStudents(updatedStudents);
  };

  const resetForm = () => {
    setTitle('');
    setDuration('');
    setStudents([{ name: '', email: '' }]);
  };

  return {
    title,
    duration,
    students,
    isLoading,
    setTitle,
    setDuration,
    setStudents,
    setIsLoading,
    addStudent,
    removeStudent,
    updateStudent,
    resetForm,
  };
};
