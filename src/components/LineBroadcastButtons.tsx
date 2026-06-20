'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function LineBroadcastButtons() {
  const [isSending, setIsSending] = useState(false);

  const handleBroadcast = async (type: 'morning' | 'summary') => {
    const label = type === 'morning' ? 'แจ้งเตือนงานวันนี้' : 'สรุปงานทั้งหมด';
    if (!confirm(`ยืนยันการส่ง "${label}" เข้า LINE ทันทีหรือไม่?`)) {
      return;
    }

    setIsSending(true);
    const toastId = toast.loading('กำลังยิงข้อความเข้า LINE...');

    try {
      const endpoint = type === 'morning' ? '/api/cron/morning' : '/api/cron/summary';
      const res = await fetch(endpoint);
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
        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-medium rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        title="ส่งแจ้งเตือนงานที่ต้องส่งวันนี้"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/></svg>
        แจ้งเตือนงานวันนี้
      </button>

      <button
        onClick={() => handleBroadcast('summary')}
        disabled={isSending}
        className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        title="ส่งสรุปงานทั้งหมดในระบบ"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        สรุปงานทั้งหมด
      </button>
    </div>
  );
}
