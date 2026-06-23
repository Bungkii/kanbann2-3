'use client';

import { useState } from 'react';
import { updateClassSchedule } from './actions';
import toast from 'react-hot-toast';

type ScheduleRow = {
  day_of_week: number;
  period: number;
  subject: string;
  teacher: string | null;
};

const DAYS = [
  { val: 1, name: 'จันทร์' },
  { val: 2, name: 'อังคาร' },
  { val: 3, name: 'พุธ' },
  { val: 4, name: 'พฤหัสบดี' },
  { val: 5, name: 'ศุกร์' },
];

export default function ScheduleForm({ initialData }: { initialData: ScheduleRow[] }) {
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(1);

  const getPeriodsForDay = (day: number) => {
    return Array.from({ length: 8 }, (_, i) => i + 1).map(period => {
      const existing = data.find(d => d.day_of_week === day && d.period === period);
      return existing || { day_of_week: day, period, subject: '', teacher: '' };
    });
  };

  const handleUpdate = async (dayOfWeek: number, period: number, subject: string, teacher: string) => {
    setSaving(true);
    const result = await updateClassSchedule(dayOfWeek, period, subject, teacher);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`อัปเดตคาบ ${period} สำเร็จ`);
    }
    setSaving(false);
  };

  const currentPeriods = getPeriodsForDay(activeDay);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {DAYS.map(day => (
          <button
            key={day.val}
            onClick={() => setActiveDay(day.val)}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeDay === day.val 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            วัน{day.name}
          </button>
        ))}
      </div>

      {/* Schedule List */}
      <div className="space-y-4">
        {currentPeriods.map((p) => (
          <div key={`${p.day_of_week}-${p.period}`} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <div className="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">
              คาบที่ {p.period}
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={p.subject}
                onChange={(e) => {
                  const newData = [...data];
                  const index = newData.findIndex(d => d.day_of_week === p.day_of_week && d.period === p.period);
                  if (index >= 0) {
                    newData[index].subject = e.target.value;
                  } else {
                    newData.push({ ...p, subject: e.target.value, teacher: p.teacher || '' });
                  }
                  setData(newData);
                }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="ชื่อวิชา เช่น คณิตศาสตร์"
              />
              <input
                type="text"
                value={p.teacher || ''}
                onChange={(e) => {
                  const newData = [...data];
                  const index = newData.findIndex(d => d.day_of_week === p.day_of_week && d.period === p.period);
                  if (index >= 0) {
                    newData[index].teacher = e.target.value;
                  } else {
                    newData.push({ ...p, teacher: e.target.value });
                  }
                  setData(newData);
                }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="ชื่อครูผู้สอน เช่น ม.ธนากร"
              />
              <button
                onClick={() => handleUpdate(p.day_of_week, p.period, p.subject, p.teacher || '')}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
              >
                บันทึก
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
