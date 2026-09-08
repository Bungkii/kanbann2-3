'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface ParentCountdownProps {
  targetDate: string;
  title?: string;
  subtitle?: string;
  variant?: 'hero' | 'compact';
}

export default function ParentCountdown({
  targetDate,
  title = 'นับถอยหลังวันสอบปลายภาค 1/69',
  subtitle = 'ติดตามกำหนดการสอบปลายภาคของนักเรียนชั้น ม.2/3',
  variant = 'hero',
}: ParentCountdownProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    setMounted(true);
    const targetTime = new Date(targetDate).getTime();

    const calculateTime = () => {
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 shadow-sm animate-pulse">
        <div className="h-6 bg-white/10 rounded-full w-1/3 mb-4"></div>
        <div className="h-10 bg-white/10 rounded-full w-1/2"></div>
      </div>
    );
  }

  const targetDateObj = new Date(targetDate);
  const formattedDate = targetDateObj.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
        <Clock size={13} className="text-[#eb6885]" />
        {timeLeft.isPast ? (
          <span>ถึงกำหนดการสอบแล้ว</span>
        ) : (
          <span>
            เหลืออีก {timeLeft.days} วัน {timeLeft.hours} ชม. {timeLeft.minutes} นาที
          </span>
        )}
      </span>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-7 md:p-10 shadow-sm border border-slate-800/80">
      {/* Soft atmospheric ambient glow */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-72 h-72 bg-[#eb6885]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-medium backdrop-blur-sm mb-3 border border-white/10">
            <Calendar size={13} className="text-[#eb6885]" />
            <span>วันสอบ: {formattedDate}</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            {title}
          </h2>

          <p className="text-slate-300 text-xs md:text-sm max-w-lg leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Live Countdown Grid (Minimal & Clean) */}
        {timeLeft.isPast ? (
          <div className="px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-center">
            <span className="text-lg font-bold text-amber-300">ถึงช่วงเวลาสอบแล้ว</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-3 rounded-2xl border border-white/15 text-center min-w-[62px] md:min-w-[72px]">
              <span className="text-2xl md:text-3xl font-extrabold text-white">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] md:text-xs text-slate-300 block font-medium mt-0.5">วัน</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-3 rounded-2xl border border-white/15 text-center min-w-[62px] md:min-w-[72px]">
              <span className="text-2xl md:text-3xl font-extrabold text-white">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] md:text-xs text-slate-300 block font-medium mt-0.5">ชม.</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-3 rounded-2xl border border-white/15 text-center min-w-[62px] md:min-w-[72px]">
              <span className="text-2xl md:text-3xl font-extrabold text-white">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] md:text-xs text-slate-300 block font-medium mt-0.5">นาที</span>
            </div>

            <div className="bg-[#eb6885]/25 backdrop-blur-md px-3.5 py-3 rounded-2xl border border-[#eb6885]/30 text-center min-w-[62px] md:min-w-[72px]">
              <span className="text-2xl md:text-3xl font-extrabold text-[#fca5a5]">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] md:text-xs text-rose-200 block font-medium mt-0.5">วินาที</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
