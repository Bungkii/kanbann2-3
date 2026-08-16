export type Period = {
  period: number;
  start: string; // '08:10'
  end: string;   // '09:00'
};

export const CLASS_PERIODS: Period[] = [
  { period: 1, start: '08:10', end: '09:00' },
  { period: 2, start: '09:00', end: '09:50' },
  { period: 3, start: '10:00', end: '10:50' },
  { period: 4, start: '10:50', end: '11:40' },
  // Lunch 11:40 - 12:30
  { period: 5, start: '12:30', end: '13:20' },
  { period: 6, start: '13:20', end: '14:10' },
  { period: 7, start: '14:20', end: '15:10' },
  { period: 8, start: '15:10', end: '16:00' },
];

export const LUNCH_PERIOD = {
  start: '11:40',
  end: '12:30',
  label: 'พักกลางวัน',
  timeStr: '11:40 - 12:30',
};

export const DAYS_CONFIG = [
  {
    val: 1,
    name: 'จันทร์',
    fullName: 'วันจันทร์',
    colorName: 'เหลือง',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    headerBg: 'bg-amber-500 text-white',
    rowHoverBg: 'hover:bg-amber-50/50',
    activeGlow: 'ring-2 ring-amber-400 bg-amber-50',
  },
  {
    val: 2,
    name: 'อังคาร',
    fullName: 'วันอังคาร',
    colorName: 'ชมพู',
    badgeBg: 'bg-pink-100 text-pink-800 border-pink-300',
    headerBg: 'bg-pink-500 text-white',
    rowHoverBg: 'hover:bg-pink-50/50',
    activeGlow: 'ring-2 ring-pink-400 bg-pink-50',
  },
  {
    val: 3,
    name: 'พุธ',
    fullName: 'วันพุธ',
    colorName: 'เขียว',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    headerBg: 'bg-emerald-500 text-white',
    rowHoverBg: 'hover:bg-emerald-50/50',
    activeGlow: 'ring-2 ring-emerald-400 bg-emerald-50',
  },
  {
    val: 4,
    name: 'พฤหัสบดี',
    fullName: 'วันพฤหัสบดี',
    colorName: 'ส้ม',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
    headerBg: 'bg-orange-500 text-white',
    rowHoverBg: 'hover:bg-orange-50/50',
    activeGlow: 'ring-2 ring-orange-400 bg-orange-50',
  },
  {
    val: 5,
    name: 'ศุกร์',
    fullName: 'วันศุกร์',
    colorName: 'ฟ้า',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
    headerBg: 'bg-sky-500 text-white',
    rowHoverBg: 'hover:bg-sky-50/50',
    activeGlow: 'ring-2 ring-sky-400 bg-sky-50',
  },
];

/**
 * Returns the current active period, or the next upcoming period for today.
 * If school is over for today, returns null.
 */
export function getCurrentOrNextPeriod(): { period: number, isNext: boolean, timeStr: string } | null {
  const today = new Date();
  const options = { timeZone: 'Asia/Bangkok' };
  const thDate = new Date(today.toLocaleString('en-US', options));
  
  const currentMinutes = thDate.getHours() * 60 + thDate.getMinutes();

  for (let i = 0; i < CLASS_PERIODS.length; i++) {
    const p = CLASS_PERIODS[i];
    const [startH, startM] = p.start.split(':').map(Number);
    const [endH, endM] = p.end.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      // We are currently in this period
      return { period: p.period, isNext: false, timeStr: `${p.start} - ${p.end}` };
    }

    if (currentMinutes < startMinutes) {
      // This is the next upcoming period
      return { period: p.period, isNext: true, timeStr: `${p.start} - ${p.end}` };
    }
  }

  // School is over for today
  return null;
}

/**
 * Detailed real-time status calculation for the schedule grid
 */
export function getCurrentScheduleStatus() {
  const today = new Date();
  const options = { timeZone: 'Asia/Bangkok' };
  const thDate = new Date(today.toLocaleString('en-US', options));
  
  const dayOfWeek = thDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const currentMinutes = thDate.getHours() * 60 + thDate.getMinutes();
  const timeFormatted = `${String(thDate.getHours()).padStart(2, '0')}:${String(thDate.getMinutes()).padStart(2, '0')}`;

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Check Lunch (11:40 - 12:30)
  const [lunchStartH, lunchStartM] = LUNCH_PERIOD.start.split(':').map(Number);
  const [lunchEndH, lunchEndM] = LUNCH_PERIOD.end.split(':').map(Number);
  const lunchStartMinutes = lunchStartH * 60 + lunchStartM;
  const lunchEndMinutes = lunchEndH * 60 + lunchEndM;

  const isLunch = currentMinutes >= lunchStartMinutes && currentMinutes < lunchEndMinutes;

  let activePeriod: number | 'lunch' | null = null;
  let nextPeriod: number | 'lunch' | null = null;
  let activePeriodTimeStr = '';
  let nextPeriodTimeStr = '';

  if (isLunch) {
    activePeriod = 'lunch';
    activePeriodTimeStr = LUNCH_PERIOD.timeStr;
    nextPeriod = 5;
    nextPeriodTimeStr = `${CLASS_PERIODS[4].start} - ${CLASS_PERIODS[4].end}`;
  } else {
    for (let i = 0; i < CLASS_PERIODS.length; i++) {
      const p = CLASS_PERIODS[i];
      const [startH, startM] = p.start.split(':').map(Number);
      const [endH, endM] = p.end.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        activePeriod = p.period;
        activePeriodTimeStr = `${p.start} - ${p.end}`;
        if (p.period === 4) {
          nextPeriod = 'lunch';
          nextPeriodTimeStr = LUNCH_PERIOD.timeStr;
        } else if (i + 1 < CLASS_PERIODS.length) {
          nextPeriod = CLASS_PERIODS[i + 1].period;
          nextPeriodTimeStr = `${CLASS_PERIODS[i + 1].start} - ${CLASS_PERIODS[i + 1].end}`;
        }
        break;
      }

      if (currentMinutes < startMinutes && activePeriod === null && nextPeriod === null) {
        nextPeriod = p.period;
        nextPeriodTimeStr = `${p.start} - ${p.end}`;
      }
    }
  }

  const [firstStartH, firstStartM] = CLASS_PERIODS[0].start.split(':').map(Number);
  const beforeSchool = currentMinutes < (firstStartH * 60 + firstStartM);
  const [lastEndH, lastEndM] = CLASS_PERIODS[CLASS_PERIODS.length - 1].end.split(':').map(Number);
  const afterSchool = currentMinutes >= (lastEndH * 60 + lastEndM);

  return {
    dayOfWeek,
    isWeekend,
    timeFormatted,
    currentMinutes,
    activePeriod, // 1..8, 'lunch', or null
    nextPeriod,   // 1..8, 'lunch', or null
    activePeriodTimeStr,
    nextPeriodTimeStr,
    beforeSchool,
    afterSchool,
  };
}
