'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function LineBroadcastButtons() {
  const [isSending, setIsSending] = useState(false);

  const handleBroadcast = async (type: 'morning' | 'evening') => {
    if (!confirm(`ยืนยันการส่งแจ้งเตือนเข้า LINE กลุ่มทันทีหรือไม่? (ทุกคนที่ติดตามจะได้รับข้อความ)`)) {
      return;
    }

    setIsSending(true);
    const toastId = toast.loading('กำลังยิงข้อความเข้า LINE...');

    try {
      const res = await fetch(`/api/cron/${type}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send broadcast');
      }

      toast.success('ส่งข้อความเข้า LINE สำเร็จ!', { id: toastId });
    } catch (error: any) {
      console.error('Broadcast error:', error);
      toast.error(`ส่งไม่สำเร็จ: ${error.message}`, { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleBroadcast('morning')}
        disabled={isSending}
        className="px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        title="ส่งแจ้งเตือนงานที่ต้องส่งวันนี้"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        แจ้งเตือนงานวันนี้
      </button>

      <button
        onClick={() => handleBroadcast('evening')}
        disabled={isSending}
        className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        title="ส่งสรุปงานทั้งหมดที่ค้างอยู่"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        สรุปงานทั้งหมด
      </button>
    </div>
  );
}
