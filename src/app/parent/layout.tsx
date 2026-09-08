import React from 'react';
import type { Metadata } from 'next';
import ParentNavbar from './components/ParentNavbar';

export const metadata: Metadata = {
  title: 'ระบบติดตามงานห้อง ม.2/3 | สำหรับผู้ปกครอง',
  description: 'ติดตามการบ้าน งานค้าง และเตรียมตัวสอบของนักเรียนชั้น ม.2/3 (โหมดอ่านอย่างเดียวสำหรับผู้ปกครอง)',
  icons: {
    icon: '/parent-logo.png',
    apple: '/parent-logo.png',
  },
};

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased relative">
      {/* Subtle Ambient Background Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] bg-purple-500/4 rounded-full blur-3xl" />
      </div>

      {/* Navigation Bar */}
      <ParentNavbar />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-28 md:pb-12">
        {children}
      </main>
    </div>
  );
}
