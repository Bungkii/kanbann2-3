'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  RefreshCw, 
  Copy, 
  Check, 
  Edit3, 
  LayoutGrid, 
  Layers, 
  Coffee,
  Info,
  User
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { CLASS_PERIODS, LUNCH_PERIOD, DAYS_CONFIG, getCurrentScheduleStatus } from '@/utils/schedule';

export type ScheduleRow = {
  id?: number;
  day_of_week: number;
  period: number;
  subject: string;
  teacher: string | null;
};

export default function ScheduleViewer({ 
  initialSchedule, 
  isLoggedIn 
}: { 
  initialSchedule: ScheduleRow[]; 
  isLoggedIn: boolean; 
}) {
  const [schedule, setSchedule] = useState<ScheduleRow[]>(initialSchedule);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [manualHighlightedPeriod, setManualHighlightedPeriod] = useState<number | 'lunch' | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Real-time status state
  const [liveStatus, setLiveStatus] = useState(() => getCurrentScheduleStatus());

  // Update live status every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStatus(getCurrentScheduleStatus());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Set default selected day to today if it's Monday-Friday
  useEffect(() => {
    const today = new Date().getDay();
    if (today >= 1 && today <= 5) {
      setSelectedDay(today);
    }
  }, []);

  // Supabase Realtime Subscription for live sync with /settings/schedule
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('class_schedule_live_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_schedule' },
        async () => {
          const { data, error } = await supabase
            .from('class_schedule')
            .select('*')
            .order('day_of_week', { ascending: true })
            .order('period', { ascending: true });
          
          if (!error && data) {
            setSchedule(data);
            setLastUpdated(new Date());
            toast.success('ตารางสอนอัปเดตข้อมูลล่าสุดแล้ว ✨', { id: 'schedule-sync' });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('class_schedule')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('period', { ascending: true });

      if (error) throw error;
      if (data) {
        setSchedule(data);
        setLastUpdated(new Date());
        toast.success('รีเฟรชข้อมูลตารางสอนเรียบร้อย');
      }
    } catch (err: any) {
      toast.error('ไม่สามารถโหลดข้อมูลใหม่ได้: ' + (err?.message || ''));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper to get item for day and period
  const getItem = (day: number, period: number) => {
    return schedule.find(s => s.day_of_week === day && s.period === period);
  };

  // Effective highlighted period (manual click overrides live period, clicking again clears)
  const currentHighlightedPeriod = manualHighlightedPeriod !== null 
    ? manualHighlightedPeriod 
    : (liveStatus.isWeekend ? null : liveStatus.activePeriod);

  // Copy today's schedule
  const handleCopyDaySchedule = (dayVal: number) => {
    const dayConfig = DAYS_CONFIG.find(d => d.val === dayVal) || DAYS_CONFIG[0];
    const dayClasses = schedule.filter(s => s.day_of_week === dayVal).sort((a, b) => a.period - b.period);
    
    let text = `📅 ตารางสอน ${dayConfig.fullName} (ม.2/3)\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    
    CLASS_PERIODS.forEach(p => {
      if (p.period === 5) {
        text += `🍜 พักกลางวัน (11:40 - 12:30)\n`;
      }
      const item = dayClasses.find(c => c.period === p.period);
      const subject = item?.subject?.trim() || '—';
      const teacher = item?.teacher?.trim() ? ` (${item.teacher.trim()})` : '';
      text += `• คาบ ${p.period} [${p.start}-${p.end}]: ${subject}${teacher}\n`;
    });
    
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔗 เช็คตารางเรียนสดได้ที่: https://kanbann.bungkii.vercel.app/schedule`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success(`คัดลอกตารางสอน${dayConfig.fullName}แล้ว!`);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Subject color mapping for beautiful tags
  const getSubjectBadgeStyle = (subject: string) => {
    if (!subject) return 'bg-slate-100 text-slate-400 border-slate-200';
    const s = subject.toLowerCase();
    if (s.includes('คณิต') || s.includes('math')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s.includes('วิทย์') || s.includes('science') || s.includes('stem')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s.includes('ไทย')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s.includes('อังกฤษ') || s.includes('eng')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (s.includes('สังคม') || s.includes('ประวัติ')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (s.includes('สุข') || s.includes('พละ')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (s.includes('ศิลปะ') || s.includes('ดนตรี')) return 'bg-pink-50 text-pink-700 border-pink-200';
    if (s.includes('แนะแนว') || s.includes('ชุมนุม') || s.includes('ลูกเสือ')) return 'bg-teal-50 text-teal-700 border-teal-200';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 md:py-10">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2.5 rounded-full transition-all border border-slate-200 bg-white shadow-sm"
            title="กลับหน้าหลัก"
          >
            <ArrowLeft size={22} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                ม.2/3
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ซิงค์สดเรียลไทม์
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1 flex items-center gap-2">
              ตารางสอนของห้อง 3
            </h1>
          </div>
        </div>

        {/* Actions Button Group */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
          {/* View mode toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid size={15} />
              ตารางรวม
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers size={15} />
              การ์ดรายวัน
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>

          {/* Copy today's schedule */}
          <button
            onClick={() => handleCopyDaySchedule(selectedDay)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow transition-all"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>คัดลอกตาราง</span>
          </button>

          {/* Admin Edit Link */}
          {isLoggedIn && (
            <Link
              href="/settings/schedule"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all"
            >
              <Edit3 size={15} />
              <span>จัดการตาราง</span>
            </Link>
          )}
        </div>
      </div>

      {/* Live Status Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 mb-6 shadow-xl relative overflow-hidden border border-slate-700">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-amber-400 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 -mb-8 w-40 h-40 bg-indigo-500 opacity-10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="bg-amber-400/20 border border-amber-400/30 text-amber-300 p-3 rounded-2xl shrink-0 backdrop-blur-md">
              <Clock size={28} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  {liveStatus.isWeekend 
                    ? 'วันหยุดสุดสัปดาห์' 
                    : (DAYS_CONFIG.find(d => d.val === liveStatus.dayOfWeek)?.fullName || 'วันเรียน')}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  เวลา {liveStatus.timeFormatted} น.
                </span>
              </div>

              <div className="mt-1">
                {liveStatus.isWeekend ? (
                  <p className="text-base sm:text-lg font-bold text-slate-100">
                    🎉 วันนี้วันหยุด พักผ่อนให้เต็มที่นะจ๊ะ!
                  </p>
                ) : liveStatus.activePeriod === 'lunch' ? (
                  <p className="text-base sm:text-lg font-bold text-amber-300 flex items-center gap-2">
                    🍜 ตอนนี้กำลังอยู่ในช่วง พักกลางวัน ({LUNCH_PERIOD.timeStr})
                  </p>
                ) : liveStatus.activePeriod !== null ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base sm:text-lg font-bold text-amber-300">
                      ⚡ ตอนนี้กำลังเรียน: คาบที่ {liveStatus.activePeriod} ({liveStatus.activePeriodTimeStr})
                    </p>
                    {(() => {
                      const cur = getItem(liveStatus.dayOfWeek, liveStatus.activePeriod as number);
                      return cur?.subject ? (
                        <span className="bg-amber-400 text-slate-900 font-extrabold text-sm px-2.5 py-0.5 rounded-lg">
                          {cur.subject} {cur.teacher ? `(${cur.teacher})` : ''}
                        </span>
                      ) : null;
                    })()}
                  </div>
                ) : liveStatus.beforeSchool ? (
                  <p className="text-base sm:text-lg font-semibold text-slate-200">
                    🌅 ยังไม่เริ่มคาบเรียนแรก (เริ่ม 08:10 น.)
                  </p>
                ) : liveStatus.afterSchool ? (
                  <p className="text-base sm:text-lg font-semibold text-slate-200">
                    ✨ หมดคาบเรียนประจำวันนี้แล้ว กลับบ้านปลอดภัยนะจ๊ะ!
                  </p>
                ) : (
                  <p className="text-base sm:text-lg font-semibold text-slate-200">
                    ช่วงเปลี่ยนคาบเรียน
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Indicator Legend */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-400 shadow-sm"></span>
              <span className="font-medium text-amber-300">แถบสีเหลืองแนวตั้ง = คาบปัจจุบัน</span>
            </div>
            {manualHighlightedPeriod !== null && (
              <button
                onClick={() => setManualHighlightedPeriod(null)}
                className="text-xs text-amber-300 hover:text-amber-200 underline ml-2 font-medium"
              >
                (รีเซ็ตกลับอัตโนมัติ)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TABLE VIEW (ตารางสอนแบบ Grid ทั้งสัปดาห์ พร้อมแถบไฮไลท์สีเหลืองแนวตรง) */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/80">
          
          {/* Table Description Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="text-amber-500" size={20} />
              <h2 className="font-bold text-slate-800 text-lg">
                ตารางเรียนรวม ม.2/3 (จันทร์ - ศุกร์)
              </h2>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>* เลื่อนตารางแนวนอนได้บนมือถือ</span>
              <span>•</span>
              <span>คลิกที่หัวคาบเพื่อดูทีละคาบ</span>
            </div>
          </div>

          {/* Scrollable Timetable Grid */}
          <div className="overflow-x-auto pb-4 rounded-2xl">
            <table className="w-full min-w-[980px] border-collapse text-center select-text">
              <thead>
                <tr>
                  {/* Day Column Header */}
                  <th className="p-3.5 bg-slate-800 text-white font-bold text-sm rounded-tl-2xl border border-slate-700 w-28 sticky left-0 z-20 shadow-sm">
                    วัน \ คาบ
                  </th>

                  {/* Period 1 to 4 Headers */}
                  {CLASS_PERIODS.slice(0, 4).map((p) => {
                    const isColHighlighted = currentHighlightedPeriod === p.period;
                    return (
                      <th
                        key={p.period}
                        onClick={() => setManualHighlightedPeriod(manualHighlightedPeriod === p.period ? null : p.period)}
                        className={`p-3 border transition-all cursor-pointer select-none ${
                          isColHighlighted
                            ? 'bg-amber-400 text-slate-950 font-black border-amber-500 shadow-md ring-2 ring-amber-400 z-10'
                            : 'bg-slate-100 text-slate-700 font-bold border-slate-200 hover:bg-amber-50 hover:text-amber-900'
                        }`}
                        title={`คลิกเพื่อไฮไลท์คาบที่ ${p.period}`}
                      >
                        <div className="flex flex-col items-center">
                          {isColHighlighted && (
                            <span className="text-[10px] bg-slate-900 text-amber-300 font-extrabold px-2 py-0.5 rounded-full mb-1 animate-bounce">
                              ● คาบนี้
                            </span>
                          )}
                          <span className="text-sm font-extrabold">คาบ {p.period}</span>
                          <span className={`text-[11px] font-normal mt-0.5 ${isColHighlighted ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                            {p.start} - {p.end}
                          </span>
                        </div>
                      </th>
                    );
                  })}

                  {/* Lunch Break Header Column */}
                  <th
                    onClick={() => setManualHighlightedPeriod(manualHighlightedPeriod === 'lunch' ? null : 'lunch')}
                    className={`p-3 border transition-all cursor-pointer w-24 select-none ${
                      currentHighlightedPeriod === 'lunch'
                        ? 'bg-amber-400 text-slate-950 font-black border-amber-500 ring-2 ring-amber-400 z-10'
                        : 'bg-amber-50/80 text-amber-800 font-bold border-amber-200/80 hover:bg-amber-100'
                    }`}
                    title="พักกลางวัน"
                  >
                    <div className="flex flex-col items-center">
                      {currentHighlightedPeriod === 'lunch' && (
                        <span className="text-[10px] bg-slate-900 text-amber-300 font-bold px-1.5 py-0.5 rounded-full mb-1">
                          ● พัก
                        </span>
                      )}
                      <span className="text-xs font-extrabold flex items-center gap-1">
                        <Coffee size={13} /> พักกลางวัน
                      </span>
                      <span className={`text-[10px] font-normal mt-0.5 ${currentHighlightedPeriod === 'lunch' ? 'text-slate-900 font-semibold' : 'text-amber-700'}`}>
                        11:40 - 12:30
                      </span>
                    </div>
                  </th>

                  {/* Period 5 to 8 Headers */}
                  {CLASS_PERIODS.slice(4, 8).map((p, idx) => {
                    const isColHighlighted = currentHighlightedPeriod === p.period;
                    const isLast = idx === 3;
                    return (
                      <th
                        key={p.period}
                        onClick={() => setManualHighlightedPeriod(manualHighlightedPeriod === p.period ? null : p.period)}
                        className={`p-3 border transition-all cursor-pointer select-none ${
                          isLast ? 'rounded-tr-2xl' : ''
                        } ${
                          isColHighlighted
                            ? 'bg-amber-400 text-slate-950 font-black border-amber-500 shadow-md ring-2 ring-amber-400 z-10'
                            : 'bg-slate-100 text-slate-700 font-bold border-slate-200 hover:bg-amber-50 hover:text-amber-900'
                        }`}
                        title={`คลิกเพื่อไฮไลท์คาบที่ ${p.period}`}
                      >
                        <div className="flex flex-col items-center">
                          {isColHighlighted && (
                            <span className="text-[10px] bg-slate-900 text-amber-300 font-extrabold px-2 py-0.5 rounded-full mb-1 animate-bounce">
                              ● คาบนี้
                            </span>
                          )}
                          <span className="text-sm font-extrabold">คาบ {p.period}</span>
                          <span className={`text-[11px] font-normal mt-0.5 ${isColHighlighted ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                            {p.start} - {p.end}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {DAYS_CONFIG.map((day, dayIdx) => {
                  const isToday = liveStatus.dayOfWeek === day.val;
                  const isLastRow = dayIdx === DAYS_CONFIG.length - 1;

                  return (
                    <tr 
                      key={day.val}
                      className={`transition-colors ${day.rowHoverBg} ${isToday ? 'bg-amber-50/25' : ''}`}
                    >
                      {/* Day Label Cell (Sticky on left) */}
                      <td className={`p-3.5 border font-bold text-sm text-left sticky left-0 z-10 bg-white border-slate-200 shadow-sm ${isLastRow ? 'rounded-bl-2xl' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${day.headerBg} shadow-sm shrink-0`}></span>
                          <span className="text-slate-800 font-extrabold whitespace-nowrap">
                            {day.name}
                          </span>
                          {isToday && (
                            <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-auto shrink-0 shadow-sm">
                              วันนี้
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Period 1 to 4 Cells */}
                      {CLASS_PERIODS.slice(0, 4).map((p) => {
                        const item = getItem(day.val, p.period);
                        const isColHighlighted = currentHighlightedPeriod === p.period;
                        const isExactCurrentCell = isToday && liveStatus.activePeriod === p.period;

                        return (
                          <td
                            key={p.period}
                            className={`p-2.5 border transition-all align-top h-24 min-w-[120px] max-w-[150px] ${
                              isExactCurrentCell
                                ? 'bg-amber-200/90 border-amber-400 ring-2 ring-amber-500 shadow-md font-bold z-10'
                                : isColHighlighted
                                ? 'bg-amber-100/70 border-amber-300/80 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.3)]'
                                : 'border-slate-200 bg-white/70'
                            }`}
                          >
                            <div className="flex flex-col h-full justify-between items-center text-center">
                              {isExactCurrentCell && (
                                <span className="text-[10px] font-black bg-slate-900 text-amber-300 px-2 py-0.5 rounded-full mb-1 shadow-sm shrink-0">
                                  📍 กำลังเรียน
                                </span>
                              )}

                              {item?.subject ? (
                                <>
                                  <span className={`text-sm font-bold leading-snug line-clamp-2 px-1.5 py-0.5 rounded-md ${
                                    isExactCurrentCell 
                                      ? 'text-slate-950 font-extrabold' 
                                      : isColHighlighted 
                                      ? 'text-amber-950 font-bold'
                                      : 'text-slate-800'
                                  }`}>
                                    {item.subject}
                                  </span>
                                  {item.teacher ? (
                                    <span className={`text-xs mt-1 line-clamp-1 ${
                                      isExactCurrentCell
                                        ? 'text-slate-800 font-semibold'
                                        : isColHighlighted
                                        ? 'text-amber-800 font-medium'
                                        : 'text-slate-500'
                                    }`}>
                                      {item.teacher}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-300">—</span>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full text-slate-300 text-xs italic">
                                  — ว่าง —
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Lunch Column Cell */}
                      <td
                        className={`p-2 border transition-all text-center align-middle ${
                          currentHighlightedPeriod === 'lunch'
                            ? 'bg-amber-200/80 border-amber-400 text-amber-950 font-bold'
                            : 'bg-amber-50/40 border-amber-200/50 text-amber-700/80'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center py-2">
                          <Coffee size={15} className={currentHighlightedPeriod === 'lunch' ? 'text-amber-800 animate-bounce' : 'text-amber-500'} />
                          <span className="text-[11px] font-bold mt-1">พัก</span>
                          <span className="text-[10px] text-slate-400">11:40-12:30</span>
                        </div>
                      </td>

                      {/* Period 5 to 8 Cells */}
                      {CLASS_PERIODS.slice(4, 8).map((p, pIdx) => {
                        const item = getItem(day.val, p.period);
                        const isColHighlighted = currentHighlightedPeriod === p.period;
                        const isExactCurrentCell = isToday && liveStatus.activePeriod === p.period;
                        const isLastCell = isLastRow && pIdx === 3;

                        return (
                          <td
                            key={p.period}
                            className={`p-2.5 border transition-all align-top h-24 min-w-[120px] max-w-[150px] ${
                              isLastCell ? 'rounded-br-2xl' : ''
                            } ${
                              isExactCurrentCell
                                ? 'bg-amber-200/90 border-amber-400 ring-2 ring-amber-500 shadow-md font-bold z-10'
                                : isColHighlighted
                                ? 'bg-amber-100/70 border-amber-300/80 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.3)]'
                                : 'border-slate-200 bg-white/70'
                            }`}
                          >
                            <div className="flex flex-col h-full justify-between items-center text-center">
                              {isExactCurrentCell && (
                                <span className="text-[10px] font-black bg-slate-900 text-amber-300 px-2 py-0.5 rounded-full mb-1 shadow-sm shrink-0">
                                  📍 กำลังเรียน
                                </span>
                              )}

                              {item?.subject ? (
                                <>
                                  <span className={`text-sm font-bold leading-snug line-clamp-2 px-1.5 py-0.5 rounded-md ${
                                    isExactCurrentCell 
                                      ? 'text-slate-950 font-extrabold' 
                                      : isColHighlighted 
                                      ? 'text-amber-950 font-bold'
                                      : 'text-slate-800'
                                  }`}>
                                    {item.subject}
                                  </span>
                                  {item.teacher ? (
                                    <span className={`text-xs mt-1 line-clamp-1 ${
                                      isExactCurrentCell
                                        ? 'text-slate-800 font-semibold'
                                        : isColHighlighted
                                        ? 'text-amber-800 font-medium'
                                        : 'text-slate-500'
                                    }`}>
                                      {item.teacher}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-300">—</span>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full text-slate-300 text-xs italic">
                                  — ว่าง —
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> แถบสีเหลืองแนวตั้ง
              </span>
              <span>= คาบเรียนที่กำลังดำเนินอยู่ขณะนี้ (หรือคาบที่เลือก)</span>
            </div>
            <div className="text-slate-400">
              อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CARDS VIEW (มุมมองรายวันแบบการ์ด แยกทีละคาบ) */}
      {/* ========================================================================= */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          {/* Day Selector Tabs */}
          <div className="flex overflow-x-auto gap-2.5 pb-2 scrollbar-none">
            {DAYS_CONFIG.map((day) => {
              const isSelected = selectedDay === day.val;
              const isToday = liveStatus.dayOfWeek === day.val;

              return (
                <button
                  key={day.val}
                  onClick={() => setSelectedDay(day.val)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all shadow-sm ${
                    isSelected
                      ? `${day.headerBg} shadow-md scale-105 ring-2 ring-offset-2 ring-slate-400`
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{day.fullName}</span>
                  {isToday && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/30 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      วันนี้
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Daily Schedule Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CLASS_PERIODS.map((p) => {
              const item = getItem(selectedDay, p.period);
              const isToday = liveStatus.dayOfWeek === selectedDay;
              const isCurrentPeriod = isToday && liveStatus.activePeriod === p.period;

              return (
                <div key={p.period} className="flex flex-col">
                  {/* Lunch break card insert before period 5 */}
                  {p.period === 5 && (
                    <div className="col-span-full mb-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-4 flex items-center justify-between text-amber-900 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-200 text-amber-800 p-2.5 rounded-xl">
                          <Coffee size={22} />
                        </div>
                        <div>
                          <h4 className="font-bold text-base">พักรับประทานอาหารกลางวัน</h4>
                          <p className="text-xs text-amber-700">11:40 น. - 12:30 น. (50 นาที)</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold bg-amber-200 text-amber-800 px-3 py-1 rounded-full">
                        พักผ่อน
                      </span>
                    </div>
                  )}

                  {/* Period Card */}
                  <div
                    className={`rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden ${
                      isCurrentPeriod
                        ? 'bg-amber-100/90 border-amber-400 ring-4 ring-amber-400/40 shadow-xl -translate-y-1'
                        : 'bg-white border-slate-200/90 hover:shadow-md hover:border-slate-300'
                    }`}
                  >
                    {isCurrentPeriod && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-white font-extrabold text-[10px] px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        กำลังเรียนอยู่
                      </div>
                    )}

                    <div>
                      {/* Period & Time header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                          isCurrentPeriod 
                            ? 'bg-slate-900 text-amber-300' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          คาบที่ {p.period}
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-500">
                          {p.start} - {p.end} น.
                        </span>
                      </div>

                      {/* Subject Name */}
                      <div className="mt-2">
                        <h3 className={`text-lg font-bold ${
                          isCurrentPeriod ? 'text-slate-900' : 'text-slate-800'
                        }`}>
                          {item?.subject || <span className="text-slate-400 font-normal italic">ไม่มีคาบเรียน</span>}
                        </h3>
                      </div>
                    </div>

                    {/* Teacher & Subject tag */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <User size={14} className="text-slate-400" />
                        <span className="font-medium">
                          {item?.teacher || <span className="text-slate-400">—</span>}
                        </span>
                      </div>
                      {item?.subject && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${getSubjectBadgeStyle(item.subject)}`}>
                          วิชาหลัก
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Settings & Help Banner */}
      <div className="mt-8 bg-slate-100/80 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Info size={20} className="text-indigo-600 shrink-0" />
          <p>
            ข้อมูลตารางสอนนี้ถูกซิงค์ตรงกับฐานข้อมูลระบบพริมจ๋า หากครูหรือหัวหน้าห้องต้องการแก้ไข ให้ไปที่เมนู <Link href="/settings/schedule" className="text-indigo-600 font-bold hover:underline">ตั้งค่าตารางสอน</Link>
          </p>
        </div>
        <Link
          href="/settings/schedule"
          className="shrink-0 text-xs sm:text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-xl transition-all shadow-sm"
        >
          แก้ไขตารางสอน →
        </Link>
      </div>

    </div>
  );
}
