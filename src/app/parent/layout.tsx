import React from 'react';
import type { Metadata, Viewport } from 'next';
import ParentNavbar from './components/ParentNavbar';
import { ParentStudentProvider } from './components/ParentStudentContext';
import StudentSearchModal from './components/StudentSearchModal';

import ParentPwaInstallBanner from './components/ParentPwaInstallBanner';

export const viewport: Viewport = {
  themeColor: '#0284c7',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://kanbann.bungkii.app'),
  title: {
    default: 'ระบบติดตามงานและการบ้านห้อง ม.2/3 · ห้อง 3 สัมธุน | สำหรับผู้ปกครอง',
    template: '%s | ผู้ปกครอง ม.2/3 · ห้อง 3 สัมธุน'
  },
  description: 'ติดตามการบ้าน งานค้าง กองทุนห้อง และเตรียมตัวสอบของนักเรียนชั้น ม.2/3 ห้อง 3 สัมธุน (พริมจ๋า) สำหรับผู้ปกครอง',
  keywords: [
    "พริมจ๋า",
    "พริมจ๋า ม.2/3",
    "ห้อง3สัมธุน",
    "ห้อง 3 สัมธุน",
    "สัมธุน ม.2/3",
    "ผู้ปกครอง ม.2/3",
    "การบ้าน ม.2/3",
    "kanbann.bungkii.app",
    "primjaa.bungkii.app"
  ],
  manifest: '/manifest-parent.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ผู้ปกครอง ม.2/3',
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://kanbann.bungkii.app",
    title: "ระบบติดตามงานและการบ้านห้อง ม.2/3 · ห้อง 3 สัมธุน | สำหรับผู้ปกครอง",
    description: "ติดตามการบ้าน งานค้าง กองทุนห้อง และเตรียมตัวสอบของนักเรียนชั้น ม.2/3 ห้อง 3 สัมธุน",
    siteName: "กระดานผู้ปกครอง ม.2/3",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "ผู้ปกครอง ม.2/3 ห้อง 3 สัมธุน" }],
  },
};

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ParentStudentProvider>
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

        {/* Global Student Search Modal */}
        <StudentSearchModal />

        {/* PWA Install Banner */}
        <ParentPwaInstallBanner />
      </div>
    </ParentStudentProvider>
  );
}
