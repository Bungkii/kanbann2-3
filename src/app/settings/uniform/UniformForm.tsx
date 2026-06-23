'use client';

import { useState } from 'react';
import { updateUniform } from './actions';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

type UniformSchedule = {
  id: string;
  day_of_week: number;
  day_name: string;
  uniform_name: string;
  theme_color: string;
};

export default function UniformForm({ initialSchedule }: { initialSchedule: UniformSchedule[] }) {
  const [schedule, setSchedule] = useState<UniformSchedule[]>(initialSchedule);
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

  const handleUpdate = async (dayOfWeek: number, uniformName: string, themeColor: string) => {
    setIsSubmitting(dayOfWeek);
    const toastId = toast.loading('กำลังบันทึก...');

    try {
      const result = await updateUniform(dayOfWeek, uniformName, themeColor);
      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success('บันทึกสำเร็จ!', { id: toastId });
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ', { id: toastId });
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleChange = (index: number, field: keyof UniformSchedule, value: string) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  return (
    <div className="space-y-6">
      {schedule.map((day, index) => (
        <div key={day.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col md:flex-row gap-4 items-end md:items-center">
          <div className="w-full md:w-1/4">
            <label className="block text-sm font-bold text-slate-700 mb-1">{day.day_name}</label>
          </div>
          
          <div className="w-full md:w-2/4">
            <label className="block text-xs font-medium text-slate-500 mb-1 md:hidden">ชุดที่ต้องใส่</label>
            <input
              type="text"
              value={day.uniform_name}
              onChange={(e) => handleChange(index, 'uniform_name', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="w-full md:w-1/4 flex gap-2 items-center">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1 md:hidden">สีธีม (Hex)</label>
              <input
                type="color"
                value={day.theme_color}
                onChange={(e) => handleChange(index, 'theme_color', e.target.value)}
                className="w-full h-11 px-2 py-1 rounded-xl border border-slate-200 cursor-pointer"
              />
            </div>
            
            <button
              onClick={() => handleUpdate(day.day_of_week, day.uniform_name, day.theme_color)}
              disabled={isSubmitting === day.day_of_week}
              className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {isSubmitting === day.day_of_week ? (
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
              ) : (
                <Save size={18} />
              )}
            </button>
          </div>
        </div>
      ))}
      {schedule.length === 0 && (
        <p className="text-center text-slate-500 py-4">ไม่พบข้อมูลตาราง กรุณารันคำสั่ง SQL เพื่อเพิ่มข้อมูลตั้งต้น</p>
      )}
    </div>
  );
}
