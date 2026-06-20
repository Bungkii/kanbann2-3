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
      <div className="text-6xl mb-4">🥲</div>
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
