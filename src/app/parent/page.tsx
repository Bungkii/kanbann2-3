import React from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import Countdown from '@/components/Countdown';
import { getSystemSettings } from '@/app/settings/system/actions';
import PageTransition from '@/components/PageTransition';
import ParentLogo from './components/ParentLogo';

export const dynamic = 'force-dynamic';

export default async function ParentHomePage() {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const isParentDomain =
    process.env.APP_MODE === 'parent' ||
    process.env.NEXT_PUBLIC_APP_MODE === 'parent' ||
    host.startsWith('kanbann.bungkii.app') ||
    (host.startsWith('kanbann.') && !host.includes('vercel.app'));

  const assignmentsHref = isParentDomain ? '/assignments' : '/parent/assignments';
  const examsHref = isParentDomain ? '/exams' : '/parent/exams';

  const settings = await getSystemSettings();
  const kanbanEnabled = settings.kanban_enabled !== false;
  const summariesEnabled = settings.summaries_enabled !== false;

  const finalExamDate = settings.final_exam_date
    ? `${settings.final_exam_date}T00:00:00+07:00`
    : '2026-09-22T00:00:00+07:00';

  const renderCard = (
    isEnabled: boolean,
    href: string,
    children: React.ReactNode,
    className: string = 'group flex-1 flex flex-col'
  ) => {
    const innerContent = (
      <div className="relative flex-1 flex flex-col w-full">
        {!isEnabled && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/40 backdrop-blur-[2px] cursor-not-allowed">
            <div className="bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              ปิดระบบชั่วคราว
            </div>
          </div>
        )}
        {children}
      </div>
    );

    if (isEnabled) {
      return (
        <Link href={href} className={className}>
          {innerContent}
        </Link>
      );
    }

    return (
      <div className={className}>
        {innerContent}
      </div>
    );
  };

  return (
    <PageTransition className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-4 sm:py-6">
      {/* Hero Welcome Banner with Lucide SVG Logo */}
      <div className="max-w-4xl w-full mb-8 text-center flex flex-col items-center">
        <div className="mb-4 group">
          <ParentLogo size="lg" className="group-hover:scale-105 transition-transform duration-300" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          ระบบติดตามงานห้อง ม.2/3
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1.5 max-w-lg font-medium">
          ชั้นมัธยมศึกษาปีที่ 2/3 โรงเรียนอัสสัมชัญธนบุรี (สำหรับผู้ปกครอง)
        </p>
      </div>
      {/* 2-Column Grid (Only Parent-Relevant Cards) */}
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch justify-center">
        {/* Left Section */}
        <div className="flex flex-col gap-6 w-full h-full">
          {/* Card 1: กระดานการบ้าน */}
          {renderCard(
            true,
            assignmentsHref,
            <div className="bg-white rounded-3xl p-10 h-full min-h-[300px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">กระดานการบ้าน</h2>
              <p className="text-slate-500 text-center">ดูงานค้างและกำหนดส่งของห้อง 3</p>
            </div>
          )}

          {/* ตารางสอนของห้อง 3 */}
          {renderCard(
            true,
            "/schedule",
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 relative overflow-hidden h-full">
              <div className="bg-amber-50 text-amber-500 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">ตารางสอนของห้อง 3</h2>
              <p className="text-slate-500 text-center text-sm">ตารางเรียน ม.2/3 คาบ 1-8</p>
            </div>,
            "group flex-1 min-h-[160px] flex flex-col w-full"
          )}

          <div className="flex flex-col gap-4 items-center mt-auto h-[104px] justify-end">
            <Link
              href="https://primjaa.bungkii.app"
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors border border-slate-300 rounded-full px-6 py-2 shadow-sm bg-white hover:bg-slate-100 w-full text-center text-sm"
            >
              สลับไปยังระบบนักเรียน ↗
            </Link>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-full h-full flex flex-col gap-6">
          {/* พริมง่วงทวงบุญคุณ 🔔 */}
          {renderCard(
            kanbanEnabled,
            assignmentsHref,
            <div className={`bg-white rounded-3xl p-10 h-full min-h-[300px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center transition-all duration-300 ${kanbanEnabled ? 'hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1' : ''}`}>
              <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M8 7v7" /><path d="M12 7v4" /><path d="M16 7v9" /></svg>
              </div>
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-800 text-center">พริมง่วงทวงบุญคุณ</h2>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                </div>
              </div>
              <p className="text-slate-500 text-center">พริมง่วงทวงความยุติธรรม</p>
            </div>
          )}

          {/* แจกสรุปสอบปลายภาค 1/69 */}
          {renderCard(
            summariesEnabled,
            examsHref,
            <div className={`bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-8 border border-rose-100 flex flex-col items-center justify-center transition-all duration-300 ${summariesEnabled ? 'hover:shadow-[0_8px_30px_rgb(225,29,72,0.2)] hover:-translate-y-1' : ''} relative overflow-hidden h-full`}>
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
              
              <div className="bg-white/20 text-white p-4 rounded-full mb-4 group-hover:scale-110 transition-transform backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 text-center">แจกสรุปสอบปลายภาค 1/69</h2>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mt-2 border border-white/30">
                <p className="text-white text-xs font-medium tracking-wide">
                  <Countdown date={finalExamDate} />
                </p>
              </div>
            </div>,
            "group flex-1 min-h-[160px] flex flex-col w-full"
          )}

          {/* เนื้อหาออกสอบปลายภาค 1/69 */}
          {renderCard(
            true,
            examsHref,
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-8 border border-indigo-100 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(99,102,241,0.2)] hover:-translate-y-1 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
              
              <div className="bg-white/20 text-white p-4 rounded-full mb-4 group-hover:scale-110 transition-transform backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 text-center">เนื้อหาออกสอบปลายภาค 1/69</h2>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mt-2 border border-white/30">
                <p className="text-white text-xs font-medium tracking-wide">
                  ดูหัวข้อสอบทั้งหมด
                </p>
              </div>
            </div>,
            "group flex-1 min-h-[160px] flex flex-col w-full"
          )}

          <div className="flex flex-col gap-4 items-center mt-auto h-[104px] justify-start pt-4">
            <div className="text-slate-400 font-medium text-xs flex items-center justify-center gap-1.5 w-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>โหมดอ่านอย่างเดียวสำหรับผู้ปกครอง</span>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
