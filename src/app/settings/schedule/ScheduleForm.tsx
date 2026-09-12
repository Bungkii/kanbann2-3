'use client';

import { useState } from 'react';
import { updateClassSchedule, updateDaySchedule, resetToDefaultSchedule } from './actions';
import toast from 'react-hot-toast';
import { CLASS_PERIODS } from '@/utils/schedule';
import { ScheduleRow, DEFAULT_CLASS_SCHEDULE } from '@/utils/defaultSchedule';
import { Save, RotateCcw, CheckCircle2, Clock } from 'lucide-react';

const DAYS = [
  { val: 1, name: 'จันทร์', fullName: 'วันจันทร์', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { val: 2, name: 'อังคาร', fullName: 'วันอังคาร', color: 'text-pink-600 bg-pink-50 border-pink-200' },
  { val: 3, name: 'พุธ', fullName: 'วันพุธ', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { val: 4, name: 'พฤหัสบดี', fullName: 'วันพฤหัสบดี', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { val: 5, name: 'ศุกร์', fullName: 'วันศุกร์', color: 'text-sky-600 bg-sky-50 border-sky-200' },
];

export default function ScheduleForm({ 
  initialData, 
  isDbEmpty = false 
}: { 
  initialData: ScheduleRow[]; 
  isDbEmpty?: boolean;
}) {
  const [data, setData] = useState<ScheduleRow[]>(initialData);
  const [savingPeriod, setSavingPeriod] = useState<number | null>(null);
  const [savingDay, setSavingDay] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeDay, setActiveDay] = useState(1);

  const getPeriodsForDay = (day: number) => {
    return Array.from({ length: 8 }, (_, i) => i + 1).map(period => {
      const existing = data.find(d => d.day_of_week === day && d.period === period);
      return existing || { day_of_week: day, period, subject: '', teacher: '' };
    });
  };

  const handleUpdateSinglePeriod = async (dayOfWeek: number, period: number, subject: string, teacher: string) => {
    setSavingPeriod(period);
    const toastId = toast.loading(`กำลังบันทึกคาบที่ ${period}...`);
    const result = await updateClassSchedule(dayOfWeek, period, subject, teacher);
    setSavingPeriod(null);
    if (result.error) {
      toast.error(result.error, { id: toastId });
    } else {
      toast.success(`บันทึกคาบที่ ${period} สำเร็จ ✨`, { id: toastId });
    }
  };

  const handleSaveWholeDay = async () => {
    setSavingDay(true);
    const activeDayConfig = DAYS.find(d => d.val === activeDay) || DAYS[0];
    const toastId = toast.loading(`กำลังบันทึกตารางสอน${activeDayConfig.fullName}...`);
    const periods = getPeriodsForDay(activeDay);
    
    const result = await updateDaySchedule(activeDay, periods.map(p => ({
      period: p.period,
      subject: p.subject,
      teacher: p.teacher || null
    })));

    setSavingDay(false);
    if (result.error) {
      toast.error(result.error, { id: toastId });
    } else {
      toast.success(`บันทึกตารางสอน${activeDayConfig.fullName} ทั้งหมด 8 คาบสำเร็จ! 🎉`, { id: toastId });
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm('ยืนยันบันทึกและกู้คืนตารางสอนมาตรฐาน ม.2/3 (ครบทั้ง 40 คาบ จันทร์-ศุกร์) ลงฐานข้อมูล Supabase?')) {
      return;
    }
    setResetting(true);
    const toastId = toast.loading('กำลังกู้คืนและบันทึกตารางสอนลง Supabase...');
    const result = await resetToDefaultSchedule();
    setResetting(false);
    if (result.error) {
      toast.error(result.error, { id: toastId });
    } else {
      setData(DEFAULT_CLASS_SCHEDULE);
      toast.success('กู้คืนและบันทึกตารางสอน ม.2/3 ลงฐานข้อมูลสำเร็จเรียบร้อย! ✨', { id: toastId });
    }
  };

  const currentPeriods = getPeriodsForDay(activeDay);
  const activeDayConfig = DAYS.find(d => d.val === activeDay) || DAYS[0];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Sync Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
          <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
          <span>โหลดข้อมูลตารางสอน ม.2/3 พร้อมแก้ไขและซิงค์แบบเรียลไทม์</span>
        </div>
        <button
          onClick={handleResetToDefault}
          disabled={resetting}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          title="โหลดข้อมูลตารางสอนเริ่มต้น ม.2/3 ทั้งหมดลงฐานข้อมูล Supabase"
        >
          <RotateCcw size={14} className={resetting ? 'animate-spin' : ''} />
          {resetting ? 'กำลังบันทึก...' : 'โหลดตารางสอนเริ่มต้น (ม.2/3)'}
        </button>
      </div>

      {/* Day Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {DAYS.map(day => (
          <button
            key={day.val}
            onClick={() => setActiveDay(day.val)}
            className={`px-5 py-2.5 rounded-2xl whitespace-nowrap font-bold text-sm transition-all cursor-pointer ${
              activeDay === day.val 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            วัน{day.name}
          </button>
        ))}
      </div>

      {/* Schedule List for Active Day */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <span>ตารางสอน{activeDayConfig.fullName}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              8 คาบ
            </span>
          </h3>
          <button
            onClick={handleSaveWholeDay}
            disabled={savingDay}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save size={15} />
            {savingDay ? 'กำลังบันทึก...' : `บันทึกทั้งวัน (${activeDayConfig.name})`}
          </button>
        </div>

        {currentPeriods.map((p) => {
          const timeInfo = CLASS_PERIODS.find(cp => cp.period === p.period);
          const isLunchBefore = p.period === 5;

          return (
            <div key={`${p.day_of_week}-${p.period}`}>
              {isLunchBefore && (
                <div className="my-3 py-2.5 px-4 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-amber-800">
                  <span>🍜 พักรับประทานอาหารกลางวัน (11:40 - 12:30 น.)</span>
                </div>
              )}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:border-indigo-200 transition-colors">
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold flex items-center justify-center">
                      {p.period}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      คาบที่ {p.period}
                    </span>
                  </div>
                  {timeInfo && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Clock size={12} />
                      {timeInfo.start} - {timeInfo.end} น.
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="flex-1">
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
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      placeholder="ชื่อวิชา เช่น คณิตศาสตร์ 3, วิทยาศาสตร์..."
                    />
                  </div>
                  <div className="flex-1">
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
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                      placeholder="ชื่อครูผู้สอน เช่น มิสเสาวลักษณ์, ม.ธนากร..."
                    />
                  </div>
                  <button
                    onClick={() => handleUpdateSinglePeriod(p.day_of_week, p.period, p.subject, p.teacher || '')}
                    disabled={savingPeriod === p.period}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {savingPeriod === p.period ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Bottom Whole Day Save Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveWholeDay}
            disabled={savingDay}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save size={18} />
            {savingDay ? 'กำลังบันทึก...' : `บันทึกตารางสอน${activeDayConfig.fullName} ทั้งหมด`}
          </button>
        </div>
      </div>
    </div>
  );
}
