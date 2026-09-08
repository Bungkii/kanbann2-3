'use client';

import React from 'react';
import { Search, UserCheck, RefreshCw, X, Sparkles, GraduationCap } from 'lucide-react';
import { useParentStudent } from './ParentStudentContext';

export default function ParentStudentBanner() {
  const { selectedStudent, setIsSearchOpen, clearStudent } = useParentStudent();

  if (!selectedStudent) {
    return (
      <div className="w-full max-w-4xl mb-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100/80 rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-5 transition-all">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
            <GraduationCap size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                <Sparkles size={12} />
                ระบุตัวตนนักเรียน
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">
              คุณเป็นผู้ปกครองของนักเรียนคนไหน?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              ค้นหาด้วยเลขประจำตัว, ชื่อ-นามสกุล, ชื่อเล่น หรือเลขที่ (ระบบจะจำไว้ในเครื่องนี้)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer"
        >
          <Search size={16} />
          <span>ค้นหาและเลือกนักเรียน</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mb-8 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
      <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex flex-col items-center justify-center shrink-0 shadow-2xs font-extrabold">
          <span className="text-[10px] text-emerald-600 font-medium">เลขที่</span>
          <span className="text-lg sm:text-xl leading-none">#{selectedStudent.student_no}</span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              นักเรียนของคุณ
            </span>
            <span className="text-xs font-medium text-slate-400">ชั้น ม.2/3</span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight truncate mt-0.5">
            {selectedStudent.full_name}{' '}
            <span className="text-amber-600 font-semibold">({selectedStudent.nickname})</span>
          </h2>

          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>เลขประจำตัว: <strong>{selectedStudent.student_id}</strong></span>
            <span>•</span>
            <span>บันทึกบนเครื่องนี้แล้ว</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          title="ค้นหาและเปลี่ยนนักเรียนคนใหม่"
        >
          <RefreshCw size={13} />
          <span>เปลี่ยน</span>
        </button>

        <button
          onClick={clearStudent}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
          title="ล้างข้อมูลนักเรียนที่เลือก"
        >
          <X size={14} />
          <span>ล้าง</span>
        </button>
      </div>
    </div>
  );
}
