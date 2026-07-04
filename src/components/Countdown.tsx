'use client';

import { useState, useEffect } from 'react';

export default function Countdown({ date }: { date: string }) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    const targetDate = new Date(date).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [date]);

  if (!mounted) {
    return <span>กำลังโหลด...</span>;
  }

  const targetDate = new Date(date).getTime();
  const now = new Date().getTime();
  
  if (targetDate - now <= 0) {
    return <span>ถึงวันสอบแล้ว! 📝</span>;
  }

  return (
    <span suppressHydrationWarning>
      เหลือเวลาอีก {timeLeft.days} วัน {timeLeft.hours} ชม. {timeLeft.minutes} นาที {timeLeft.seconds} วินาที
    </span>
  );
}
