'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
        <div className="text-red-400 mb-4 flex justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
        </div>
      <h2 className="text-2xl font-bold text-slate-800">เกิดข้อผิดพลาดบางอย่าง</h2>
      <p className="text-slate-500 max-w-md">ระบบไม่สามารถดึงข้อมูลพริมทวงยิกมาแสดงได้ อาจเป็นเพราะเครือข่าย หรือเซิร์ฟเวอร์</p>
      <button 
        onClick={() => reset()} 
        className="mt-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
      >
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
}
