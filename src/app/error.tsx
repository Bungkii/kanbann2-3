'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Home, AlertOctagon, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <main 
      role="main"
      className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden bg-[#0A0E17] text-white px-4 py-8 select-none"
    >
      {/* Ambient background lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#150a10] via-[#0A0E17] to-[#05080f] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top App Badge */}
      <div className="relative z-10 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs sm:text-sm font-medium backdrop-blur-md shadow-inner">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>พริมจ๋า ม.2/3 · ระบบเกิดข้อผิดพลาด</span>
        </div>
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center text-center my-auto py-6"
      >
        {/* Glowing Error Octagon Badge */}
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="relative mb-6 group"
        >
          <div className="absolute inset-0 rounded-3xl bg-rose-500/20 blur-xl group-hover:bg-rose-500/30 transition-all duration-500" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-rose-500/20 to-rose-500/5 border border-rose-500/30 flex items-center justify-center backdrop-blur-xl shadow-[0_0_50px_rgba(244,63,94,0.25)]">
            <AlertOctagon className="w-10 h-10 sm:w-12 sm:h-12 text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]" />
          </div>
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
          เกิดข้อผิดพลาดชั่วคราว
        </h1>

        <p className="text-slate-400 text-sm sm:text-base font-normal max-w-md mx-auto mb-6">
          ระบบพบข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง หรือกลับสู่หน้าหลัก
        </p>

        {error?.digest && (
          <div className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md mb-6 text-xs text-slate-400 font-mono">
            Error Digest: {error.digest}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold transition-all hover:shadow-[0_0_25px_rgba(244,63,94,0.4)] active:scale-95 cursor-pointer"
          >
            <RefreshCw size={16} />
            ลองใหม่อีกครั้ง
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold border border-white/10 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <Home size={16} />
            กลับหน้าหลัก
          </Link>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="relative z-10 text-xs text-slate-500 text-center font-normal pt-4">
        © 2026 Primjaa & Kanbann ม.2/3 · ระบบจัดการห้องเรียน
      </footer>
    </main>
  );
}
