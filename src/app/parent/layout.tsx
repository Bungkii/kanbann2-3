import React from 'react';
import type { Metadata } from 'next';
import ParentNavbar from './components/ParentNavbar';

export const metadata: Metadata = {
  title: 'ระบบติดตามงานห้อง ม.2/3',
  description: 'ติดตามการบ้าน งานค้าง และเตรียมตัวสอบของนักเรียนชั้น ม.2/3 (โหมดอ่านอย่างเดียวสำหรับผู้ปกครอง)',
};

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white antialiased">
      {/* Navigation Bar */}
      <ParentNavbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-28 md:pb-12">
        {children}
      </main>
    </div>
  );
}
