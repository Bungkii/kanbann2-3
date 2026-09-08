'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Plus } from 'lucide-react';
import LineBroadcastButtons from './LineBroadcastButtons';

export default function StudentNavbar({
  isAuthenticated = false,
  showAddButton = true,
}: {
  isAuthenticated?: boolean;
  showAddButton?: boolean;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'หน้าหลัก',
      href: '/',
    },
    {
      label: 'การบ้าน',
      href: '/kanban',
    },
    {
      label: 'บัญชีเงินห้อง',
      href: '/funds',
    },
    {
      label: 'เนื้อหา & สรุปสอบ',
      href: '/summaries',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Header & Floating Pill Navbar (Desktop & Tablet) */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-4 sm:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo / Title */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eb6885]" />
            <span className="text-base sm:text-lg font-bold text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors">
              ระบบติดตามงานห้อง ม.2/3
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500 shrink-0"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              สำหรับนักเรียน
            </span>
          </Link>

          {/* Desktop Right Cluster: Actions & Pill Nav */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Add Button */}
            {showAddButton && (
              <Link
                href="/add"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all duration-200 hover:shadow-sm shrink-0"
                title="จดงานใหม่"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>จดงาน</span>
              </Link>
            )}

            {/* Line Broadcast Buttons if Authenticated */}
            {isAuthenticated && (
              <div className="shrink-0 scale-90 origin-right">
                <LineBroadcastButtons />
              </div>
            )}

            {/* Floating Pill Nav Capsule */}
            <nav className="flex items-center bg-[#edf2f7] p-1.5 rounded-full border border-slate-200/60 shadow-2xs">
              {navItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 lg:px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Pink Accent Action Pill linking to Parent Portal */}
              <Link
                href="/parent"
                className="ml-1 inline-flex items-center gap-1.5 px-4 lg:px-5 py-1.5 rounded-full bg-[#eb6885] hover:bg-[#e05977] text-white text-sm font-medium shadow-xs transition-all duration-200 hover:shadow-sm"
                title="สลับไปยังระบบสำหรับผู้ปกครอง"
              >
                <span>สำหรับผู้ปกครอง</span>
                <ArrowUpRight size={14} className="stroke-[2.2]" />
              </Link>
            </nav>
          </div>

          {/* Mobile Right Controls */}
          <div className="md:hidden flex items-center gap-1.5">
            {showAddButton && (
              <Link
                href="/add"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs shrink-0"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>จดงาน</span>
              </Link>
            )}

            <Link
              href="/parent"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#eb6885] text-white text-xs font-medium shadow-xs shrink-0"
              title="สลับไปยังระบบสำหรับผู้ปกครอง"
            >
              <span>ผู้ปกครอง</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Floating Capsule Bar */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 flex justify-center">
        <div className="flex items-center justify-between w-full max-w-sm bg-white/95 backdrop-blur-md p-1.5 rounded-full border border-slate-200/80 shadow-lg">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 text-center py-2 px-3 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'bg-[#edf2f7] text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
