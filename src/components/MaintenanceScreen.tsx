'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, MessageCircle, AlertTriangle, Clock, Calendar } from 'lucide-react'

interface MaintenanceScreenProps {
  title?: string
  dateText?: string
  timeText?: string
  noticeText?: string
  contactLine?: string
}

export default function MaintenanceScreen({
  title = "ปิดปรับปรุงระบบชั่วคราว",
  dateText = "วันที่ 12 ก.ย. 2568",
  timeText = "เวลา 20.00 น. ถึง เวลา 00.00 น.",
  noticeText = "ท่านจะไม่สามารถใช้งานแอปพลิเคชันได้ในเวลาดังกล่าว ขออภัยในความไม่สะดวก",
  contactLine = "https://line.me/ti/p/~@primjaa"
}: MaintenanceScreenProps) {
  return (
    <main 
      role="main" 
      aria-label="หน้าแจ้งปิดปรับปรุงระบบชั่วคราว"
      className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden bg-[#0A0E17] text-white px-4 py-8 select-none"
    >
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e1726] via-[#0A0E17] to-[#05080f] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top App Badge */}
      <div className="relative z-10 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs sm:text-sm font-medium backdrop-blur-md shadow-inner">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>พริมจ๋า ม.2/3 · ระบบปิดปรับปรุงชั่วคราว</span>
        </div>
      </div>

      {/* Main Center Content Box */}
      <motion.div 
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center my-auto py-6"
      >
        {/* Glowing Warning Hexagon/Circle Icon */}
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="relative mb-6 group"
        >
          <div className="absolute inset-0 rounded-3xl bg-amber-500/20 blur-xl group-hover:bg-amber-500/30 transition-all duration-500" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.25)]">
            <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
          </div>
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
          {title}
        </h1>

        <p className="text-slate-400 text-sm sm:text-base font-normal max-w-md mx-auto mb-6">
          ขณะนี้ระบบกำลังอยู่ระหว่างการปรับปรุงและอัปเกรดเพื่อประสิทธิภาพการใช้งานที่ดียิ่งขึ้น
        </p>

        {/* Schedule Info Card */}
        <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md mb-6 space-y-3.5 shadow-2xl">
          <div className="flex items-center justify-center gap-2.5 text-amber-300 font-bold text-base sm:text-lg">
            <Calendar size={18} className="shrink-0 text-amber-400" />
            <span>{dateText}</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 text-slate-200 font-medium text-sm sm:text-base border-t border-white/5 pt-3">
            <Clock size={16} className="shrink-0 text-slate-400" />
            <span>{timeText}</span>
          </div>
        </div>

        {/* Notice Footnote */}
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto mb-8">
          {noticeText}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-all hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-95 cursor-pointer"
          >
            <RefreshCw size={16} />
            ลองโหลดใหม่อีกครั้ง
          </button>
          
          {contactLine && (
            <a
              href={contactLine}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold border border-white/10 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle size={16} className="text-emerald-400" />
              ติดต่อแอดมิน LINE
            </a>
          )}
        </div>
      </motion.div>

      {/* Footer Branding */}
      <footer className="relative z-10 text-xs text-slate-500 text-center font-normal pt-4">
        © 2026 Primjaa & Kanbann ม.2/3 · ระบบจัดการห้องเรียน
      </footer>
    </main>
  )
}
