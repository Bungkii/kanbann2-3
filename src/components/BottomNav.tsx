'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Home,
  LayoutDashboard,
  PlusSquare,
  Calendar,
  BookOpen,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'หน้าหลัก', Icon: Home },
  { href: '/kanban', label: 'กระดาน', Icon: LayoutDashboard },
  { href: '/add', label: 'จดงาน', Icon: PlusSquare, primary: true },
  { href: '/schedule', label: 'ตาราง', Icon: Calendar },
  { href: '/summaries', label: 'สรุป', Icon: BookOpen },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Only show in PWA standalone mode
    const mq = window.matchMedia('(display-mode: standalone)');
    setIsStandalone(mq.matches || (window.navigator as any).standalone === true);
    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Don't render in browser mode — only in PWA standalone
  if (!isStandalone) return null;

  // Hide on login/signup pages
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid rgba(0,0,0,0.07)' }}
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-1 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, Icon, primary }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);

          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center -mt-6 mb-1"
                aria-label={label}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-br from-violet-500 to-pink-500 shadow-violet-300'
                      : 'bg-gradient-to-br from-violet-600 to-pink-600 shadow-violet-200'
                  }`}
                >
                  <Icon size={26} className="text-white" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-semibold text-violet-700 mt-1">
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all active:scale-95 min-w-[52px]"
              aria-label={label}
            >
              <div
                className={`w-6 h-6 flex items-center justify-center transition-all ${
                  isActive ? 'text-violet-600 scale-110' : 'text-slate-400'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-violet-700' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-violet-500 -mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
