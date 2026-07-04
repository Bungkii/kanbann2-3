"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ClipboardList, LayoutDashboard, BookOpen, Vote, UserCheck, Settings as SettingsIcon, AlertCircle } from 'lucide-react';

export default function NotFound() {
  const menuItems = [
    { href: "/add", icon: <ClipboardList className="w-5 h-5" />, label: "จดงาน", bgColor: "bg-indigo-50", textColor: "text-indigo-600", hoverBorder: "hover:border-indigo-200" },
    { href: "/kanban", icon: <LayoutDashboard className="w-5 h-5" />, label: "กระดานงาน", bgColor: "bg-blue-50", textColor: "text-blue-600", hoverBorder: "hover:border-blue-200" },
    { href: "/summaries", icon: <BookOpen className="w-5 h-5" />, label: "สรุปสอบ", bgColor: "bg-pink-50", textColor: "text-pink-600", hoverBorder: "hover:border-pink-200" },
    { href: "/election", icon: <Vote className="w-5 h-5" />, label: "เลือกตั้ง", bgColor: "bg-amber-50", textColor: "text-amber-500", hoverBorder: "hover:border-amber-200" },
    { href: "/evaluate-boss", icon: <UserCheck className="w-5 h-5" />, label: "ประเมินหัวหน้า", bgColor: "bg-emerald-50", textColor: "text-emerald-500", hoverBorder: "hover:border-emerald-200" },
    { href: "/settings", icon: <SettingsIcon className="w-5 h-5" />, label: "ตั้งค่าระบบ", bgColor: "bg-rose-50", textColor: "text-rose-600", hoverBorder: "hover:border-rose-200" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center"
      >
        <div className="bg-red-50 text-red-500 p-6 rounded-full mb-6 relative">
          <AlertCircle className="w-16 h-16" strokeWidth={1.5} />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-red-400 rounded-full opacity-20 blur-xl"
          />
        </div>
        
        <h1 className="text-6xl font-black text-slate-800 mb-2 tracking-tight">404</h1>
        <h2 className="text-2xl font-bold text-slate-700 mb-4 text-center">ไม่พบหน้าที่คุณต้องการ</h2>
        <p className="text-slate-500 text-center max-w-lg mb-10 text-lg">
          คุณอาจจะต้องการ
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mb-10">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <motion.div 
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-colors ${item.hoverBorder} h-full gap-3 group`}
              >
                <div className={`${item.bgColor} ${item.textColor} p-3 rounded-full group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <span className="font-semibold text-slate-700 text-sm">{item.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>

        <Link href="/" className="w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-4 px-10 rounded-full shadow-lg transition-all"
          >
            <Home className="w-5 h-5" />
            กลับสู่หน้าหลัก
          </motion.button>
        </Link>
      </motion.div>
    </main>
  );
}
