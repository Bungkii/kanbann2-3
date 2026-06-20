'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddHomeworkModal from './AddHomeworkModal';

export function AddHomeworkDialog({ user }: { user: any }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (!user) {
      router.push('/login');
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className="w-full bg-white rounded-3xl p-10 h-full min-h-[300px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 group text-left"
      >
        <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">บันทึกงานใหม่ (ม.2/3)</h2>
        <p className="text-slate-500 text-center">จดไว้นะ (จะขึ้นให้เพื่อน 2/3 ทุกคนเห็น 👀)</p>
      </button>

      {isOpen && (
        <AddHomeworkModal onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
