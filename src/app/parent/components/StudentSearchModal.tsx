'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Check, User } from 'lucide-react';
import { useParentStudent } from './ParentStudentContext';
import { STUDENTS, Student } from '@/data/students';
import StudentCard, { formatStudentFullName, getStudentAvatar } from './StudentCard';

export default function StudentSearchModal() {
  const { isSearchOpen, setIsSearchOpen, selectedStudent, setSelectedStudent, clearStudent } = useParentStudent();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  // Filter logic: Student ID, Student No, First Name, Last Name, Nickname, Full Thai Name
  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STUDENTS;

    return STUDENTS.filter((student) => {
      const matchId = student.student_id.toLowerCase().includes(q);
      const matchNo = student.student_no.toString() === q;
      const matchFirst = student.first_name.toLowerCase().includes(q);
      const matchLast = student.last_name.toLowerCase().includes(q);
      const matchNick = student.nickname.toLowerCase().includes(q);
      const matchFull = student.full_name.toLowerCase().includes(q);
      const expandedName = formatStudentFullName(student).toLowerCase();
      const matchExpanded = expandedName.includes(q);

      return matchId || matchNo || matchFirst || matchLast || matchNick || matchFull || matchExpanded;
    });
  }, [query]);

  if (!isSearchOpen) return null;

  const handleSelect = (student: Student) => {
    setSelectedStudent(student);
    setIsSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Card */}
      <div
        className="w-full max-w-xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <User size={18} />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">ค้นหาและเลือกนักเรียน</h2>
              <p className="text-xs text-slate-400">ค้นหาด้วยเลขประจำตัว, ชื่อจริง หรือชื่อเล่น</p>
            </div>
          </div>
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="ปิด"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input Bar (Image 1 style) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative flex items-center w-full bg-white rounded-full border-2 border-sky-100 shadow-[0_4px_20px_rgba(56,189,248,0.1)] p-1 pl-5 pr-1.5 transition-all focus-within:border-sky-400 focus-within:shadow-[0_4px_24px_rgba(56,189,248,0.18)]">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="เลขประจำตัว หรือชื่อ"
              className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 text-base sm:text-lg font-medium outline-none pr-3"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 shadow-xs">
              <Search size={19} className="stroke-[2.5]" />
            </div>
          </div>

          {/* Active selected preview */}
          {selectedStudent && (
            <div className="mt-3 flex items-center justify-between px-3.5 py-2 rounded-2xl bg-sky-50/80 border border-sky-100 text-xs">
              <div className="flex items-center gap-2 text-sky-900 font-medium truncate">
                <Check size={14} className="text-sky-600 shrink-0" />
                <span className="truncate">
                  กำลังเลือก: <strong>{formatStudentFullName(selectedStudent)}</strong> (ชื่อเล่น {selectedStudent.nickname}) เลขที่ {selectedStudent.student_no}
                </span>
              </div>
              <button
                onClick={clearStudent}
                className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] underline underline-offset-2 ml-2 shrink-0 cursor-pointer"
              >
                ล้างข้อมูล
              </button>
            </div>
          )}
        </div>

        {/* Results List (Image 2 style cards) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="mx-auto mb-2 opacity-30 text-sky-600" size={36} />
              <p className="font-semibold text-slate-600">ไม่พบนักเรียนที่ค้นหา</p>
              <p className="text-xs text-slate-400 mt-1">ลองพิมพ์เลขประจำตัว เช่น 30260 หรือชื่อเล่น</p>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isSelected = selectedStudent?.student_id === student.student_id;

              return (
                <StudentCard
                  key={student.student_id}
                  student={student}
                  isSelected={isSelected}
                  onClick={() => handleSelect(student)}
                  action={
                    isSelected ? (
                      <span className="px-3 py-1.5 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs">
                        <Check size={14} />
                        <span>เลือกอยู่</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-sky-600 hover:text-sky-700 px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 transition-colors">
                        เลือก
                      </span>
                    )
                  }
                />
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>พบทั้งหมด {filteredStudents.length} คน (จาก 52 คน)</span>
          <button
            onClick={() => setIsSearchOpen(false)}
            className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition-colors shadow-2xs cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
