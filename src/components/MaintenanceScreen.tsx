'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, MessageCircle } from 'lucide-react'

interface MaintenanceScreenProps {
  title?: string
  dateText?: string
  timeText?: string
  noticeText?: string
  contactLine?: string
}

export default function MaintenanceScreen({
  title = "ปิดปรับปรุงระบบชั่วคราว",
  dateText = "วันที่ 19 ก.ย. 2567",
  timeText = "เวลา 9.00 น. ถึง เวลา 18.00 น.",
  noticeText = "ท่านจะไม่สามารถใช้งานแอปพลิเคชันได้ในเวลาดังกล่าว ขออภัยในความไม่สะดวก",
  contactLine = "https://line.me/ti/p/~@primjaa"
}: MaintenanceScreenProps) {
  return (
    <main 
      role="main" 
      aria-label="หน้าแจ้งปิดปรับปรุงระบบชั่วคราว"
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#0A192F] text-white px-4 select-none"
    >
      {/* Background Deep Ocean Gradient & Glow Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e213d] via-[#0A192F] to-[#06101e] pointer-events-none" />
      
      {/* Ambient Radial Lighting matching reference */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/15 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Content Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center text-center px-4 py-8"
      >
        {/* App Mini Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs sm:text-sm font-medium backdrop-blur-md mb-8 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>ระบบกระดานงานห้อง ม.2/3 · พริมทวงยิก</span>
        </div>

        {/* Iconic White Circular Exclamation Badge */}
        <motion.div 
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
          className="relative mb-6 sm:mb-8"
        >
          {/* Subtle Outer Glow Ring */}
          <div className="absolute inset-0 rounded-full bg-white/20 blur-md transform scale-110" />
          
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-[5px] sm:border-[6px] border-white flex items-center justify-center bg-white/5 backdrop-blur-md shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            <span className="text-white font-black text-5xl sm:text-6xl select-none leading-none tracking-tighter drop-shadow-md">
              !
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm mb-6">
          {title}
        </h1>

        {/* Horizontal Divider Line */}
        <div className="w-full max-w-lg h-[1.5px] bg-white/25 mx-auto mb-6" />

        {/* Maintenance Date & Time Info */}
        <div className="space-y-2 text-white/95 text-lg sm:text-2xl font-bold tracking-normal drop-shadow-sm">
          <p>{dateText}</p>
          <p>{timeText}</p>
        </div>

        {/* Notice Footnote */}
        <p className="text-white/75 text-sm sm:text-base font-normal leading-relaxed max-w-xl mx-auto mt-8">
          {noticeText}
        </p>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/15 backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-md"
          >
            <RefreshCw size={15} />
            ลองโหลดใหม่อีกครั้ง
          </button>
          
          {contactLine && (
            <a
              href={contactLine}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm font-semibold border border-emerald-500/30 backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              <MessageCircle size={15} />
              ติดต่อแอดมินพริมจ๋า
            </a>
          )}
        </div>
      </motion.div>

      {/* Footer Branding */}
      <footer className="relative z-10 py-6 text-xs text-white/40 text-center font-light">
        © 2026 Primjaa & Kanbann ม.2/3 · Powered by Antigravity
      </footer>
    </main>
  )
}
