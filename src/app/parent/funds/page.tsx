import React from 'react';
import type { Metadata } from 'next';
import FundsClient from '@/app/funds/FundsClient';
import { getFundsForWeek, getFundsData, getExpenses, getFundsSettings } from '@/app/funds/actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ระบบบัญชีเงินห้อง ม.2/3 | สำหรับผู้ปกครอง',
  description: 'ตรวจสอบยอดเงินห้อง รายรับ-รายจ่าย และประวัติการชำระเงินค่าบำรุงห้อง ม.2/3 แบบโปร่งใส (โหมดอ่านอย่างเดียวสำหรับผู้ปกครอง)',
};

function getMonday(d: Date) {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${date}`;
}

export default async function ParentFundsPage(props: {
  searchParams: Promise<{ week?: string }>;
}) {
  const searchParams = await props.searchParams;
  const fundsStats = await getFundsData();

  const currentWeekStart = getMonday(new Date());
  const weekStart = searchParams.week || currentWeekStart;
  const fundsData = await getFundsForWeek(weekStart);

  const expenses = await getExpenses();
  const settings = await getFundsSettings();

  return (
    <div className="-mt-12 sm:-mt-16">
      <FundsClient
        isLoggedIn={false}
        isParentMode={true}
        fundsStats={fundsStats}
        currentWeekStart={currentWeekStart}
        selectedWeek={weekStart}
        fundsData={fundsData}
        expenses={expenses}
        settings={settings}
      />
    </div>
  );
}
