'use client';

import { useState } from 'react';
import { updateCleaningSchedule } from './actions';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

type CleaningRow = {
  day_of_week: number;
  day_name: string;
  cleaners: string;
};

export default function CleaningForm({ initialData }: { initialData: CleaningRow[] }) {
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (dayOfWeek: number, cleaners: string) => {
    setSaving(true);
    const result = await updateCleaningSchedule(dayOfWeek, cleaners);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('อัปเดตตารางเวรสำเร็จ');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {data.map((row) => (
        <div key={row.day_of_week} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-full md:w-32 font-bold text-slate-700 flex items-center gap-2">
            <Trash2 size={18} className="text-emerald-500" />
            {row.day_name}
          </div>
          <div className="flex-1 w-full flex items-center gap-2">
            <input
              type="text"
              value={row.cleaners}
              onChange={(e) => {
                const newData = [...data];
                const index = newData.findIndex(d => d.day_of_week === row.day_of_week);
                newData[index].cleaners = e.target.value;
                setData(newData);
              }}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
              placeholder="กรอกชื่อเวรทำความสะอาด เช่น ด.ช.สมชาย, ด.ญ.สมหญิง"
            />
            <button
              onClick={() => handleUpdate(row.day_of_week, row.cleaners)}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
            >
              บันทึก
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
