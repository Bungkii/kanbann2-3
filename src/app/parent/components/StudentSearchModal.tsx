'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, User, Check, Sparkles } from 'lucide-react';
import { useParentStudent } from './ParentStudentContext';
import { Student } from '@/data/students';
import toast from 'react-hot-toast';

export default function StudentSearchModal() {
  const { isSearchOpen, setIsSearchOpen, selectedStudent, setSelectedStudent, clearStudent, students } = useParentStudent();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;

    return students.filter((s) => {
      const matchId = s.student_id.includes(q);
      const matchNo = s.student_no.toString() === q || `เลขที่ ${s.student_no}`.includes(q);
      const matchFirst = s.first_name.toLowerCase().includes(q);
      const matchLast = s.last_name.toLowerCase().includes(q);
      const matchNick = s.nickname.toLowerCase().includes(q);
      const matchFull = s.full_name.toLowerCase().includes(q);

      return matchId || matchNo || matchFirst || matchLast || matchNick || matchFull;
    });
  }, [query, students]);

  if (!isSearchOpen) return null;

  const handleSelect = (student: Student) => {
    setSelectedStudent(student);
    setIsSearchOpen(false);
    toast.success(`เลือกนักเรียน: ${student.full_name} (${student.nickname}) เลขที่ ${student.student_no}`);
  };

  const handleClear = () => {
    clearStudent();
    setIsSearchOpen(false);
    toast('ล้างข้อมูลนักเรียนที่เลือกแล้ว', { icon: 'ℹ️' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-100 text-indigo-700">
                <User size={18} />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">ค้นหาและเลือกนักเรียน</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ค้นหาด้วยเลขประจำตัว (5 หลัก), เลขที่ (1-52), ชื่อจริง หรือชื่อเล่น
            </p>
          </div>
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="ปิด"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="พิมพ์เลขประจำตัว, เลขที่, ชื่อ หรือชื่อเล่น..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder-slate-400 text-base outline-none transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick info / active selection */}
          {selectedStudent && (
            <div className="mt-3 flex items-center justify-between px-3.5 py-2 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs">
              <div className="flex items-center gap-2 text-indigo-900 font-medium">
                <Check size={14} className="text-indigo-600 shrink-0" />
                <span>
                  กำลังเลือก: <strong>{selectedStudent.full_name}</strong> ({selectedStudent.nickname}) เลขที่ {selectedStudent.student_no}
                </span>
              </div>
              <button
                onClick={handleClear}
                className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] underline underline-offset-2 ml-2 shrink-0"
              >
                ล้างข้อมูล
              </button>
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 divide-y divide-slate-50">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="mx-auto mb-2 opacity-30" size={36} />
              <p className="font-medium text-slate-600">ไม่พบนักเรียนที่ค้นหา</p>
              <p className="text-xs text-slate-400 mt-1">ลองพิมพ์เลขประจำตัว เช่น 30260 หรือเลขที่ เช่น 2</p>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isSelected = selectedStudent?.student_id === student.student_id;

              return (
                <button
                  key={student.student_id}
                  onClick={() => handleSelect(student)}
                  className={`w-full text-left p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all duration-150 group ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Student Number Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                        isSelected
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100 group-hover:bg-indigo-100'
                      }`}
                    >
                      #{student.student_no}
                    </div>

                    {/* Student Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base truncate">
                          {student.full_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                            isSelected
                              ? 'bg-white/25 text-white'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          }`}
                        >
                          {student.nickname}
                        </span>
                      </div>
                      <div
                        className={`text-xs mt-0.5 flex items-center gap-3 ${
                          isSelected ? 'text-indigo-100' : 'text-slate-500'
                        }`}
                      >
                        <span>เลขประจำตัว: <strong>{student.student_id}</strong></span>
                        <span>•</span>
                        <span>เลขที่: <strong>{student.student_no}</strong></span>
                      </div>
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="shrink-0 p-1.5 rounded-full bg-white/20 text-white">
                      <Check size={16} />
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all">
                      เลือก ↵
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>พบทั้งหมด {filteredStudents.length} คน (จาก 52 คน)</span>
          <button
            onClick={() => setIsSearchOpen(false)}
            className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition-colors shadow-2xs"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
