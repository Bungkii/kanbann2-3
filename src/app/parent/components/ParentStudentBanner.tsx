'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, RefreshCw, Sparkles } from 'lucide-react';
import { useParentStudent } from './ParentStudentContext';
import { STUDENTS, Student } from '@/data/students';
import StudentCard, { getStudentAvatar, formatStudentFullName } from './StudentCard';

export default function ParentStudentBanner() {
  const { selectedStudent, setSelectedStudent, clearStudent, setIsSearchOpen } = useParentStudent();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter students based on input
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return STUDENTS.filter((s) => {
      const idMatch = s.student_id.toLowerCase().includes(q);
      const noMatch = s.student_no.toString() === q;
      const firstNameMatch = s.first_name.toLowerCase().includes(q);
      const lastNameMatch = s.last_name.toLowerCase().includes(q);
      const nicknameMatch = s.nickname.toLowerCase().includes(q);
      const fullNameMatch = s.full_name.toLowerCase().includes(q);
      const expandedName = formatStudentFullName(s).toLowerCase();
      const expandedMatch = expandedName.includes(q);

      return idMatch || noMatch || firstNameMatch || lastNameMatch || nicknameMatch || fullNameMatch || expandedMatch;
    }).slice(0, 5); // top 5 results for clean dropdown
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // 1. When student is selected: Render Image 2 Card Style
  if (selectedStudent) {
    return (
      <div className="w-full max-w-4xl mb-8">
        <StudentCard
          student={selectedStudent}
          isSelected={false}
          className="shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition-colors cursor-pointer border border-sky-200/60"
                title="ค้นหาและเปลี่ยนนักเรียน"
              >
                <RefreshCw size={13} />
                <span>เปลี่ยน</span>
              </button>
              <button
                onClick={clearStudent}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                title="ล้างข้อมูลนักเรียน"
              >
                <X size={14} />
              </button>
            </div>
          }
        />
      </div>
    );
  }

  // 2. When NO student is selected: Render Image 1 Search Bar Style with Dropdown
  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto mb-8 relative">
      {/* Pill Search Bar (Image 1) */}
      <div className="relative flex items-center w-full bg-white/95 backdrop-blur-md rounded-full border-2 border-sky-100 shadow-[0_6px_28px_rgba(56,189,248,0.14)] p-1.5 pl-6 pr-2 transition-all duration-200 focus-within:border-sky-400 focus-within:shadow-[0_6px_32px_rgba(56,189,248,0.22)]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder="เลขประจำตัว หรือชื่อ"
          className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 text-base sm:text-lg font-medium outline-none pr-3"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
          >
            <X size={16} />
          </button>
        )}

        {/* Circular Blue Search Button (Image 1) */}
        <button
          type="button"
          onClick={() => {
            if (searchQuery.trim()) {
              setIsDropdownOpen(true);
            } else {
              setIsSearchOpen(true);
            }
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-sky-100/90 hover:bg-sky-200 text-sky-600 flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
          aria-label="ค้นหา"
        >
          <Search size={20} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Live Search Dropdown (Image 2 style items) */}
      {isDropdownOpen && searchQuery.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-sky-100/80 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.1)] p-3 z-50 space-y-2 max-h-[380px] overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-sm">
              ไม่พบนักเรียนจากคำค้นหา "{searchQuery}"
            </div>
          ) : (
            filteredStudents.map((student) => (
              <StudentCard
                key={student.student_id}
                student={student}
                onClick={() => handleSelect(student)}
                className="hover:bg-sky-50/60"
              />
            ))
          )}

          <div className="pt-1 text-center">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                setIsSearchOpen(true);
              }}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium cursor-pointer py-1 px-3 rounded-full hover:bg-sky-50"
            >
              ดูรายชื่อนักเรียนทั้งหมด 52 คน →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
