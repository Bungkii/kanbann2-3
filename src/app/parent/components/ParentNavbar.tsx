'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Search, User } from 'lucide-react';
import { useParentStudent } from './ParentStudentContext';

export default function ParentNavbar() {
  const pathname = usePathname();
  const isUnderParent = pathname.startsWith('/parent');
  const basePath = isUnderParent ? '/parent' : '';
  const { selectedStudent, setIsSearchOpen } = useParentStudent();

  const navItems = [
    {
      label: 'หน้าหลัก',
      href: basePath || '/',
    },
    {
      label: 'การบ้าน',
      href: `${basePath}/assignments`,
    },
    {
      label: 'บัญชีเงินห้อง',
      href: `${basePath}/funds`,
    },
    {
      label: 'เนื้อหา & สรุปสอบ',
      href: `${basePath}/exams`,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/' || href === '/parent') {
      return pathname === '/' || pathname === '/parent';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Header & Floating Pill Navbar (Desktop & Tablet) */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-4 sm:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo / Title */}
          <Link href={basePath || '/'} className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eb6885]" />
            <span className="text-base sm:text-lg font-bold text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors">
              ระบบติดตามงานห้อง ม.2/3
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              สำหรับผู้ปกครอง
            </span>
          </Link>

          {/* Desktop Right Cluster: Student Badge & Pill Nav */}
          <div className="hidden md:flex items-center gap-3">
            {/* Student Search & Selection Badge */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
                selectedStudent
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/80'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/80'
              }`}
              title="คลิกเพื่อค้นหาและเปลี่ยนนักเรียนที่ติดตาม"
            >
              {selectedStudent ? (
                <>
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-emerald-300 shrink-0 bg-white">
                    <img
                      src={selectedStudent.prefix === 'ด.ญ.' ? '/asset/student-girl.webp' : '/asset/student-boy.webp'}
                      alt={selectedStudent.prefix}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="max-w-[140px] truncate">
                    {selectedStudent.first_name} ({selectedStudent.nickname})
                  </span>
                  <Search size={12} className="text-emerald-600 opacity-60" />
                </>
              ) : (
                <>
                  <Search size={13} className="text-indigo-600 shrink-0" />
                  <span>ค้นหานักเรียน</span>
                </>
              )}
            </button>

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

              {/* Pink Accent Action Pill */}
              <Link
                href="https://primjaa.bungkii.app"
                className="ml-1 inline-flex items-center gap-1.5 px-4 lg:px-5 py-1.5 rounded-full bg-[#eb6885] hover:bg-[#e05977] text-white text-sm font-medium shadow-xs transition-all duration-200 hover:shadow-sm"
                title="สลับไปยังหน้าหลักของนักเรียน"
              >
                <span>ระบบนักเรียน</span>
                <ArrowUpRight size={14} className="stroke-[2.2]" />
              </Link>
            </nav>
          </div>

          {/* Mobile Right Controls */}
          <div className="md:hidden flex items-center gap-1.5">
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                selectedStudent
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
              title="ค้นหาและเลือกนักเรียน"
            >
              {selectedStudent ? (
                <>
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-emerald-300 shrink-0 bg-white">
                    <img
                      src={selectedStudent.prefix === 'ด.ญ.' ? '/asset/student-girl.webp' : '/asset/student-boy.webp'}
                      alt={selectedStudent.prefix}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="max-w-[70px] truncate">{selectedStudent.nickname}</span>
                </>
              ) : (
                <>
                  <Search size={12} />
                  <span>เลือกนักเรียน</span>
                </>
              )}
            </button>

            <Link
              href="https://primjaa.bungkii.app"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#eb6885] text-white text-xs font-medium shadow-xs shrink-0"
            >
              <span>นักเรียน</span>
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
