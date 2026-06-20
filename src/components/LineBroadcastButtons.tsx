'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type BroadcastType = 'morning' | 'summary' | 'evening';

const BUTTONS: { type: BroadcastType; label: string; title: string; color: string; icon: React.ReactNode }[] = [
  {
    type: 'morning',
    label: 'แจ้งเตือนงานวันนี้',
    title: 'ส่งแจ้งเตือนงานที่ต้องส่งวันนี้/เลยกำหนด',
    color: 'bg-red-100 text-red-700 hover:bg-red-200',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
    ),
  },
  {
    type: 'summary',
    label: 'สรุปงานทั้งหมด',
    title: 'ส่งรายการงานทั้งหมดในระบบ',
    color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    type: 'evening',
    label: 'สรุปงานประจำวัน',
    title: 'ส่งสรุปงานที่ค้างอยู่ตอนเย็น',
    color: 'bg-violet-100 text-violet-700 hover:bg-violet-200',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
      </svg>
    ),
  },
];

const ENDPOINT: Record<BroadcastType, string> = {
  morning: '/api/cron/morning',
  summary: '/api/cron/summary',
  evening: '/api/cron/evening',
};

export default function LineBroadcastButtons() {
  const [sending, setSending] = useState<BroadcastType | null>(null);

  const handleBroadcast = async (type: BroadcastType) => {
    const btn = BUTTONS.find(b => b.type === type)!;
    if (!confirm(`ยืนยันการส่ง "${btn.label}" เข้า LINE ทันทีหรือไม่?`)) return;

    setSending(type);
    const toastId = toast.loading('กำลังยิงข้อความเข้า LINE...');

    try {
      const res = await fetch(ENDPOINT[type]);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('ส่งข้อความเข้า LINE สำเร็จ! 🎉', { id: toastId });
    } catch (error: any) {
      toast.error(`ส่งไม่สำเร็จ: ${error.message}`, { id: toastId });
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {BUTTONS.map(btn => (
        <button
          key={btn.type}
          onClick={() => handleBroadcast(btn.type)}
          disabled={sending !== null}
          title={btn.title}
          className={`px-3 py-2 ${btn.color} font-medium rounded-xl text-sm transition-colors flex items-center gap-1.5 disabled:opacity-50`}
        >
          {sending === btn.type ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : btn.icon}
          {btn.label}
        </button>
      ))}
    </div>
  );
}
