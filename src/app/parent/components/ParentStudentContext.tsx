'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, STUDENTS } from '@/data/students';

const STORAGE_KEY = 'parent_selected_student';

interface ParentStudentContextType {
  selectedStudent: Student | null;
  setSelectedStudent: (student: Student | null) => void;
  clearStudent: () => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  students: Student[];
}

const ParentStudentContext = createContext<ParentStudentContextType | undefined>(undefined);

export function ParentStudentProvider({ children }: { children: React.ReactNode }) {
  const [selectedStudent, setSelectedStudentState] = useState<Student | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount (Client-only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.student_id) {
          // Cross reference with full dataset to ensure up-to-date data
          const matched = STUDENTS.find(s => s.student_id === parsed.student_id || s.student_no === parsed.student_no);
          if (matched) {
            setSelectedStudentState(matched);
          } else {
            setSelectedStudentState(parsed);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load selected student from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setSelectedStudent = (student: Student | null) => {
    setSelectedStudentState(student);
    try {
      if (student) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(student));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save selected student to localStorage:', e);
    }
  };

  const clearStudent = () => {
    setSelectedStudent(null);
  };

  return (
    <ParentStudentContext.Provider
      value={{
        selectedStudent,
        setSelectedStudent,
        clearStudent,
        isSearchOpen,
        setIsSearchOpen,
        students: STUDENTS,
      }}
    >
      {children}
    </ParentStudentContext.Provider>
  );
}

export function useParentStudent() {
  const context = useContext(ParentStudentContext);
  if (!context) {
    throw new Error('useParentStudent must be used within a ParentStudentProvider');
  }
  return context;
}
