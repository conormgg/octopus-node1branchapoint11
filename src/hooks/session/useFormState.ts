
import { useState } from 'react';
import { Student } from './types';

export const useFormState = () => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [students, setStudents] = useState<Student[]>([{ name: '', email: '' }]);
  const [isLoading, setIsLoading] = useState(false);

  const addStudent = () => {
    setStudents([...students, { name: '', email: '' }]);
  };

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const updateStudent = (index: number, field: 'name' | 'email', value: string) => {
    setStudents(
      students.map((student, i) =>
        i === index ? { ...student, [field]: value } : student
      )
    );
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
