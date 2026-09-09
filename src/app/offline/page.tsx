'use client';

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        {/* Animated icon */}
        <div className="relative mx-auto w-28 h-28 mb-8">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500 to-pink-500 opacity-20 animate-pulse" />
          <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-2xl font-black text-slate-800 mb-2">
          ไม่มีอินเทอร์เน็ต
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          พริมทวงยิกต้องการเน็ตเพื่อโหลดข้อมูลล่าสุด
          <br />
          กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง
        </p>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 mb-4"
        >
          ลองใหม่อีกครั้ง
        </button>

        <Link
          href="/"
          className="block text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
