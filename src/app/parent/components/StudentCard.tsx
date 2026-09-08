'use client';

import React from 'react';
import { Student } from '@/data/students';

interface StudentCardProps {
  student: Student;
  onClick?: () => void;
  isSelected?: boolean;
  action?: React.ReactNode;
  className?: string;
}

export function formatStudentFullName(student: Student): string {
  const prefix = student.prefix === 'ด.ญ.' ? 'เด็กหญิง' : student.prefix === 'ด.ช.' ? 'เด็กชาย' : student.prefix;
  return `${prefix}${student.first_name} ${student.last_name}`;
}

export function getStudentAvatar(student: Student): string {
  return student.prefix === 'ด.ญ.' ? '/asset/student-girl.webp' : '/asset/student-boy.webp';
}

export default function StudentCard({
  student,
  onClick,
  isSelected = false,
  action,
  className = '',
}: StudentCardProps) {
  const avatar = getStudentAvatar(student);
  const fullName = formatStudentFullName(student);

  return (
    <div
      onClick={onClick}
      className={`relative w-full bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all duration-200 ${
        onClick
          ? 'cursor-pointer hover:border-sky-300 hover:shadow-md hover:scale-[1.005] active:scale-[0.995]'
          : ''
      } ${
        isSelected
          ? 'border-2 border-sky-400 ring-2 ring-sky-300/40 shadow-md bg-sky-50/30'
          : 'border border-sky-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
      } ${className}`}
    >
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
        {/* Squircle Avatar Box - ปรับขนาดให้พอดีๆ สวยงาม */}
        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center shrink-0 p-2 overflow-hidden">
          <img
            src={avatar}
            alt={fullName}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Student Details (Image 2 style: Name on top, Nickname + Student No + Student ID below) */}
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-800 tracking-tight truncate">
            {fullName}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5 sm:mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-600 font-semibold">ชื่อเล่น {student.nickname}</span>
            <span className="text-slate-300">·</span>
            <span>เลขที่ {student.student_no}</span>
            <span className="text-slate-300">·</span>
            <span>เลขประจำตัว {student.student_id}</span>
          </p>
        </div>
      </div>

      {action && <div className="shrink-0 flex items-center">{action}</div>}
    </div>
  );
}
