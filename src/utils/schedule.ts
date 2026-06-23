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
