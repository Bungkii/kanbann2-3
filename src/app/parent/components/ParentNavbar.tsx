'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

const NAV_ITEMS = [
  {
    label: 'หน้าหลัก',
    href: '/parent',
  },
  {
    label: 'การบ้าน',
    href: '/parent/assignments',
  },
  {
    label: 'เนื้อหา & สรุปสอบ',
    href: '/parent/exams',
  },
];

export default function ParentNavbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/parent') {
      return pathname === '/parent';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Header & Floating Pill Navbar (Desktop & Tablet) */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-4 sm:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo / Title */}
          <Link href="/parent" className="flex items-center gap-2.5 group">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eb6885]" />
            <span className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors">
              ระบบติดตามงานห้อง ม.2/3
            </span>
          </Link>

          {/* Floating Pill Nav Capsule (Exact match to reference design) */}
          <nav className="hidden md:flex items-center bg-[#edf2f7] p-1.5 rounded-full border border-slate-200/60 shadow-2xs">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Pink Accent Action Pill (Replaces 'เข้าสู่ระบบ' with 'ระบบนักเรียน ↗') */}
            <Link
              href="https://primjaa.bungkii.app"
              className="ml-1 inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full bg-[#eb6885] hover:bg-[#e05977] text-white text-sm font-medium shadow-xs transition-all duration-200 hover:shadow-sm"
              title="สลับไปยังหน้าหลักของนักเรียน"
            >
              <span>ระบบนักเรียน</span>
              <ArrowUpRight size={14} className="stroke-[2.2]" />
            </Link>
          </nav>

          {/* Mobile Right Link */}
          <div className="md:hidden flex items-center">
            <Link
              href="https://primjaa.bungkii.app"
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#eb6885] text-white text-xs font-medium shadow-xs"
            >
              <span>ระบบนักเรียน</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Floating Capsule Bar */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 flex justify-center">
        <div className="flex items-center justify-between w-full max-w-sm bg-white/95 backdrop-blur-md p-1.5 rounded-full border border-slate-200/80 shadow-lg">
          {NAV_ITEMS.map((item) => {
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
