'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  User,
  Sparkles
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Real-time status state
  const [liveStatus, setLiveStatus] = useState(() => getCurrentScheduleStatus());

  // Auto-detect mobile (< 768px) -> 'cards' (มุมมองรายวัน), desktop (>= 768px) -> 'table' (ตารางรวมทั้งสัปดาห์)
  useEffect(() => {
    const handleInitialView = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 768) {
          setViewMode('cards');
        } else {
          setViewMode('table');
        }
      }
    };

    handleInitialView();
  }, []);

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

  // Effective highlighted period
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
    text += `🔗 ดูตารางสอนสดได้ที่: https://kanbann.bungkii.vercel.app/schedule`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success(`คัดลอกตารางสอน${dayConfig.fullName}แล้ว!`);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-50 p-4 md:p-8"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Navigation (Matching Summaries style) */}
        <div className="flex items-center justify-between mb-2">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 font-medium text-sm"
          >
            <ArrowLeft size={16} />
            กลับหน้าหลัก
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-1.5 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 font-medium text-sm disabled:opacity-50 cursor-pointer hover:bg-slate-50"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-amber-600' : ''} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>

            <button
              onClick={() => handleCopyDaySchedule(selectedDay)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2 rounded-full shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 hover:shadow-amber-500/40 hover:-translate-y-0.5 text-sm cursor-pointer"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>คัดลอกตาราง</span>
            </button>

            {isLoggedIn && (
              <Link
                href="/settings/schedule"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-full shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 hover:shadow-indigo-600/40 hover:-translate-y-0.5 text-sm"
              >
                <Edit3 size={16} />
                <span>จัดการตาราง</span>
              </Link>
            )}
          </div>
        </div>

        {/* Hero Section (Matching Summaries Clean Gradient Banner) */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-500 rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden ring-1 ring-white/20">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-yellow-300 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex bg-white/20 text-white p-4 rounded-2xl mb-6 backdrop-blur-md shadow-inner shadow-white/20 ring-1 ring-white/30">
                <Calendar size={48} strokeWidth={1.5} />
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-100 mb-4 drop-shadow-sm leading-tight">
                ตารางสอนของห้อง 3
              </h1>
              <p className="text-amber-100 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                ตารางเรียนประจำสัปดาห์ ม.2/3 คาบที่ 1 - 8 ซิงค์ข้อมูลสดแบบเรียลไทม์
              </p>
            </div>

            {/* Live Clock Status Box */}
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 flex flex-col items-center w-full max-w-sm shrink-0 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)]">
              <div className="bg-amber-400/40 p-3 rounded-full mb-3 text-white">
                <Clock size={28} />
              </div>
              <h2 className="font-semibold text-lg text-amber-100 mb-1 text-center">
                {liveStatus.isWeekend 
                  ? 'วันหยุดสุดสัปดาห์' 
                  : (DAYS_CONFIG.find(d => d.val === liveStatus.dayOfWeek)?.fullName || 'วันเรียน')}
              </h2>
              <div className="text-3xl md:text-4xl font-bold text-white tracking-widest drop-shadow-md font-mono">
                {liveStatus.timeFormatted} น.
              </div>

              <div className="mt-4 pt-3 border-t border-white/20 w-full text-center">
                {liveStatus.isWeekend ? (
                  <p className="text-sm font-semibold text-amber-100">
                    🎉 วันหยุด ไม่มีคาบเรียนจ้า
                  </p>
                ) : liveStatus.activePeriod === 'lunch' ? (
                  <p className="text-sm font-bold text-yellow-200">
                    🍜 พักกลางวัน (11:40 - 12:30 น.)
                  </p>
                ) : liveStatus.activePeriod !== null ? (
                  <div>
                    <span className="text-xs text-amber-200 block">กำลังเรียนอยู่</span>
                    <span className="text-base font-bold text-white">
                      คาบที่ {liveStatus.activePeriod} ({liveStatus.activePeriodTimeStr})
                    </span>
                    {(() => {
                      const cur = getItem(liveStatus.dayOfWeek, liveStatus.activePeriod as number);
                      return cur?.subject ? (
                        <div className="mt-1 inline-block bg-white text-slate-900 font-bold text-xs px-2.5 py-0.5 rounded-md shadow-sm">
                          {cur.subject} {cur.teacher ? `(${cur.teacher})` : ''}
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : liveStatus.beforeSchool ? (
                  <p className="text-sm font-medium text-amber-100">
                    🌅 ยังไม่เริ่มคาบเรียน (เริ่ม 08:10 น.)
                  </p>
                ) : liveStatus.afterSchool ? (
                  <p className="text-sm font-medium text-amber-100">
                    ✨ หมดคาบเรียนวันนี้แล้ว
                  </p>
                ) : (
                  <p className="text-sm font-medium text-amber-100">
                    ช่วงเปลี่ยนคาบเรียน
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clean Filter Controls (Matching Summaries Filter Row) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid size={16} />
              ตารางรวมทั้งสัปดาห์
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers size={16} />
              มุมมองรายวัน
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium self-end sm:self-center bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="w-3 h-3 rounded bg-amber-300 border border-amber-400 inline-block shrink-0"></span>
            <span>แถบสีเหลืองแนวตั้ง = คาบเรียนปัจจุบัน (คลิกที่หัวคาบเพื่อเลือกได้)</span>
            {manualHighlightedPeriod !== null && (
              <button
                onClick={() => setManualHighlightedPeriod(null)}
                className="text-amber-600 hover:underline ml-1 font-bold cursor-pointer"
              >
                (รีเซ็ต)
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. TABLE VIEW (ตารางสอนแบบ Grid ทั้งสัปดาห์ คลีนๆ สบายตา) */}
        {/* ========================================================================= */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
            <div className="overflow-x-auto pb-2">
              <table className="w-full min-w-[960px] border-collapse text-center select-text">
                <thead>
                  <tr className="border-b border-slate-200">
                    {/* Day Column Header */}
                    <th className="p-3.5 bg-slate-50 text-slate-700 font-bold text-sm rounded-tl-2xl border border-slate-200 w-28 sticky left-0 z-20 shadow-sm">
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
                              ? 'bg-amber-300 text-slate-900 font-bold border-amber-400 shadow-sm z-10'
                              : 'bg-slate-50 text-slate-700 font-semibold border-slate-200 hover:bg-slate-100'
                          }`}
                          title={`คลิกเพื่อไฮไลท์คาบที่ ${p.period}`}
                        >
                          <div className="flex flex-col items-center">
                            {isColHighlighted && (
                              <span className="text-[10px] bg-slate-900 text-amber-300 font-bold px-2 py-0.2 rounded-full mb-1">
                                คาบนี้
                              </span>
                            )}
                            <span className="text-sm font-bold">คาบ {p.period}</span>
                            <span className={`text-[11px] font-normal mt-0.5 ${isColHighlighted ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
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
                          ? 'bg-amber-300 text-slate-900 font-bold border-amber-400 z-10'
                          : 'bg-slate-50 text-slate-500 font-semibold border-slate-200 hover:bg-slate-100'
                      }`}
                      title="พักกลางวัน"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold flex items-center gap-1">
                          <Coffee size={13} /> พัก
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
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
                              ? 'bg-amber-300 text-slate-900 font-bold border-amber-400 shadow-sm z-10'
                              : 'bg-slate-50 text-slate-700 font-semibold border-slate-200 hover:bg-slate-100'
                          }`}
                          title={`คลิกเพื่อไฮไลท์คาบที่ ${p.period}`}
                        >
                          <div className="flex flex-col items-center">
                            {isColHighlighted && (
                              <span className="text-[10px] bg-slate-900 text-amber-300 font-bold px-2 py-0.2 rounded-full mb-1">
                                คาบนี้
                              </span>
                            )}
                            <span className="text-sm font-bold">คาบ {p.period}</span>
                            <span className={`text-[11px] font-normal mt-0.5 ${isColHighlighted ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
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
                        className={`transition-colors ${isToday ? 'bg-amber-50/20' : 'hover:bg-slate-50/60'}`}
                      >
                        {/* Day Label Cell (Sticky on left) */}
                        <td className={`p-3.5 border font-semibold text-sm text-left sticky left-0 z-10 bg-white border-slate-200 shadow-sm ${isLastRow ? 'rounded-bl-2xl' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${day.headerBg} shrink-0`}></span>
                            <span className="text-slate-800 font-bold whitespace-nowrap">
                              {day.name}
                            </span>
                            {isToday && (
                              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shrink-0">
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
                              className={`p-2.5 border transition-all align-top h-24 min-w-[115px] max-w-[145px] ${
                                isExactCurrentCell
                                  ? 'bg-amber-200 text-slate-900 border-amber-300 font-bold z-10'
                                  : isColHighlighted
                                  ? 'bg-amber-50/90 border-amber-200 text-slate-800'
                                  : 'border-slate-200 bg-white'
                              }`}
                            >
                              <div className="flex flex-col h-full justify-between items-center text-center">
                                {isExactCurrentCell && (
                                  <span className="text-[10px] font-bold bg-slate-900 text-amber-300 px-2 py-0.5 rounded-full mb-1 shrink-0">
                                    📍 ตอนนี้
                                  </span>
                                )}

                                {item?.subject ? (
                                  <>
                                    <span className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                                      {item.subject}
                                    </span>
                                    {item.teacher ? (
                                      <span className="text-xs text-slate-500 mt-1 line-clamp-1">
                                        {item.teacher}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-300">—</span>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-slate-300 text-xs">
                                    —
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
                              ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                              : 'bg-slate-50/50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center py-2 text-xs">
                            <Coffee size={14} className={currentHighlightedPeriod === 'lunch' ? 'text-amber-700' : 'text-slate-400'} />
                            <span className="mt-1 font-medium">พัก</span>
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
                              className={`p-2.5 border transition-all align-top h-24 min-w-[115px] max-w-[145px] ${
                                isLastCell ? 'rounded-br-2xl' : ''
                              } ${
                                isExactCurrentCell
                                  ? 'bg-amber-200 text-slate-900 border-amber-300 font-bold z-10'
                                  : isColHighlighted
                                  ? 'bg-amber-50/90 border-amber-200 text-slate-800'
                                  : 'border-slate-200 bg-white'
                              }`}
                            >
                              <div className="flex flex-col h-full justify-between items-center text-center">
                                {isExactCurrentCell && (
                                  <span className="text-[10px] font-bold bg-slate-900 text-amber-300 px-2 py-0.5 rounded-full mb-1 shrink-0">
                                    📍 ตอนนี้
                                  </span>
                                )}

                                {item?.subject ? (
                                  <>
                                    <span className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                                      {item.subject}
                                    </span>
                                    {item.teacher ? (
                                      <span className="text-xs text-slate-500 mt-1 line-clamp-1">
                                        {item.teacher}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-300">—</span>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-slate-300 text-xs">
                                    —
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

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <span>อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')} น.</span>
              <span>ตารางเรียนห้อง ม.2/3</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. CARDS VIEW (มุมมองรายวันแบบการ์ด คลีนๆ) */}
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
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold whitespace-nowrap transition-all shadow-sm cursor-pointer text-sm ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{day.fullName}</span>
                    {isToday && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-800'
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
                    {/* Lunch break card */}
                    {p.period === 5 && (
                      <div className="col-span-full mb-4 bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-amber-900 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-100 text-amber-800 p-2.5 rounded-xl">
                            <Coffee size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm md:text-base">พักรับประทานอาหารกลางวัน</h4>
                            <p className="text-xs text-amber-700">11:40 น. - 12:30 น.</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold bg-amber-200 text-amber-800 px-3 py-1 rounded-full">
                          พักผ่อน
                        </span>
                      </div>
                    )}

                    {/* Period Card */}
                    <div
                      className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between h-full bg-white ${
                        isCurrentPeriod
                          ? 'border-amber-400 ring-2 ring-amber-300 shadow-md bg-amber-50/30'
                          : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Period & Time header */}
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              isCurrentPeriod 
                                ? 'bg-amber-500 text-white' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              คาบที่ {p.period}
                            </span>
                            {isCurrentPeriod && (
                              <span className="text-[10px] font-bold bg-slate-900 text-amber-300 px-2 py-0.5 rounded-full">
                                📍 ตอนนี้
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            {p.start} - {p.end} น.
                          </span>
                        </div>

                        {/* Subject Name */}
                        <div className="mt-2">
                          <h3 className="text-lg font-bold text-slate-800">
                            {item?.subject || <span className="text-slate-400 font-normal italic">ไม่มีคาบเรียน</span>}
                          </h3>
                        </div>
                      </div>

                      {/* Teacher */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-slate-400" />
                          <span>{item?.teacher || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </motion.main>
  );
}
