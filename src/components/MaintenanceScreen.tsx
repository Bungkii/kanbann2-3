'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, MessageCircle, AlertCircle, Clock, Calendar } from 'lucide-react';

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function getTodayThaiDateText(): string {
  const d = new Date();
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  return `วันที่ ${day} ${month} ${yearBE}`;
}

export function formatThaiDate(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  return `วันที่ ${day} ${month} ${yearBE}`;
}

export function formatMaintenanceDateRange(startDateInput: Date | string, endDateInput?: Date | string | null): string {
  const startStr = formatThaiDate(startDateInput);
  if (!endDateInput) return startStr;
  
  const endStr = formatThaiDate(endDateInput);
  if (!endStr || startStr === endStr) return startStr;
  
  return `${startStr} ถึง ${endStr}`;
}

interface MaintenanceScreenProps {
  title?: string;
  dateText?: string;
  timeText?: string;
  noticeText?: string;
  contactLine?: string;
}

export default function MaintenanceScreen({
  title = "ปิดปรับปรุงระบบชั่วคราว",
  dateText,
  timeText = "เวลา 20.00 น. ถึง เวลา 00.00 น.",
  noticeText = "ท่านจะไม่สามารถใช้งานแอปพลิเคชันได้ในเวลาดังกล่าว ขออภัยในความไม่สะดวก",
  contactLine = "https://line.me/ti/p/~@primjaa"
}: MaintenanceScreenProps) {
  const displayDateText = dateText || getTodayThaiDateText();
  return (
    <main 
      role="main" 
      aria-label="หน้าแจ้งปิดปรับปรุงระบบชั่วคราว"
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 select-none"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center text-center relative"
      >
        {/* Glowing Red/Amber Icon Badge matching 404 style */}
        <div className="bg-red-50 text-red-500 p-6 rounded-full mb-6 relative">
          <AlertCircle className="w-16 h-16" strokeWidth={1.5} />
          <motion.div 
            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-red-400 rounded-full opacity-20 blur-xl"
          />
        </div>

        {/* Big Code / Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold mb-3 tracking-wide">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>MAINTENANCE MODE · พริมจ๋า ม.2/3</span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 mb-2 tracking-tight">
          {title}
        </h1>
        <p className="text-slate-500 text-center max-w-lg mb-6 text-base sm:text-lg">
          ระบบกำลังอยู่ระหว่างการปรับปรุงและอัปเกรดชั่วคราว
        </p>

        {/* Date & Time Schedule Box */}
        <div className="w-full max-w-md bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-center gap-2.5 text-slate-800 font-bold text-base sm:text-lg">
            <Calendar size={20} className="text-amber-500 shrink-0" />
            <span>{displayDateText}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-600 font-medium text-sm sm:text-base border-t border-slate-200/70 pt-2.5">
            <Clock size={16} className="text-slate-400 shrink-0" />
            <span>{timeText}</span>
          </div>
        </div>

        {/* Notice Footnote */}
        <p className="text-slate-500 text-center max-w-md mb-8 text-sm leading-relaxed">
          {noticeText}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3.5 px-8 rounded-full shadow-lg transition-all text-sm sm:text-base cursor-pointer"
          >
            <RefreshCw size={18} />
            ลองโหลดใหม่อีกครั้ง
          </motion.button>

          {contactLine && (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={contactLine}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-7 rounded-full border border-slate-200 shadow-sm transition-all text-sm sm:text-base cursor-pointer"
            >
              <MessageCircle size={18} className="text-emerald-500" />
              ติดต่อแอดมิน LINE
            </motion.a>
          )}
        </div>

        {/* Footer */}
        <footer className="text-xs text-slate-400 text-center font-normal pt-8">
          © 2026 Primjaa & Kanbann ม.2/3 · ระบบจัดการห้องเรียน
        </footer>
      </motion.div>
    </main>
  );
}
