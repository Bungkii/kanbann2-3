"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ClipboardList, LayoutDashboard, BookOpen, Vote, UserCheck, Settings as SettingsIcon } from 'lucide-react';

export default function NotFound() {
  const menuItems = [
    { href: "/", icon: <Home className="w-4 h-4" />, label: "หน้าแรก", color: "text-blue-500" },
    { href: "/add", icon: <ClipboardList className="w-4 h-4" />, label: "จดงาน", color: "text-indigo-500" },
    { href: "/kanban", icon: <LayoutDashboard className="w-4 h-4" />, label: "กระดานงาน", color: "text-blue-500" },
    { href: "/summaries", icon: <BookOpen className="w-4 h-4" />, label: "สรุปสอบ", color: "text-pink-500" },
    { href: "/election", icon: <Vote className="w-4 h-4" />, label: "เลือกตั้ง", color: "text-amber-500" },
    { href: "/evaluate-boss", icon: <UserCheck className="w-4 h-4" />, label: "ประเมินหัวหน้า", color: "text-emerald-500" },
    { href: "/settings", icon: <SettingsIcon className="w-4 h-4" />, label: "ตั้งค่าระบบ", color: "text-slate-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-pink-400 blur-[120px] mix-blend-multiply opacity-30"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, -50, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-400 blur-[120px] mix-blend-multiply opacity-30"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            y: [0, 50, 0]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-400 blur-[120px] mix-blend-multiply opacity-30"
        />
      </div>

      {/* Glassmorphism Header with Navigation */}
      <header className="w-full sticky top-0 z-50 px-4 py-6">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="max-w-7xl mx-auto bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl px-4 py-3 sm:px-6 flex flex-wrap items-center justify-center gap-2 md:gap-4"
        >
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all text-sm font-semibold text-slate-700"
              >
                <span className={item.color}>{item.icon}</span>
                {item.label}
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </header>

      {/* 404 Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 py-16 z-10 relative">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-center max-w-2xl bg-white/80 backdrop-blur-2xl p-10 md:p-16 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60"
        >
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <h1 className="text-[8rem] md:text-[12rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 drop-shadow-sm select-none">
              404
            </h1>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-t from-white/40 to-transparent pointer-events-none rounded-3xl"></div>
          </motion.div>
          
          <div className="w-24 h-2 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full mx-auto mb-8 mt-4"></div>
          
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-6 tracking-tight">
            โอ๊ะโอ... ไม่พบหน้าที่คุณต้องการ 😅
          </h2>
          <p className="text-slate-500 text-lg md:text-xl mb-10 leading-relaxed font-medium px-4">
            ดูเหมือนว่าพริมจ๋าจะหาหน้านี้ไม่เจอ อาจจะโดนลบไปแล้ว หรือคุณพิมพ์ URL ผิด ลองเลือกเมนูด้านบน หรือกลับไปเริ่มต้นที่หน้าแรกดูนะคะ
          </p>
          
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(99, 102, 241, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg shadow-indigo-500/30 transition-all cursor-pointer"
            >
              <Home className="w-5 h-5" />
              กลับสู่หน้าหลัก
            </motion.div>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
