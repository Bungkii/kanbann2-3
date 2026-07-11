import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import Countdown from '@/components/Countdown';
import { getSystemSettings } from '@/app/settings/system/actions';
import { ElementType } from 'react';
import PageTransition from '@/components/PageTransition';

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const settings = await getSystemSettings();
  const isAddWorkEnabled = settings.add_work_enabled !== false;
  const kanbanEnabled = settings.kanban_enabled !== false;
  const summariesEnabled = settings.summaries_enabled !== false;
  const electionEnabled = settings.election_enabled !== false;
  const bossEvaluationEnabled = settings.boss_evaluation_enabled !== false;

  const renderCard = (
    isEnabled: boolean,
    href: string,
    children: React.ReactNode,
    className: string = "group flex-1 flex flex-col"
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
    <PageTransition className="flex-1 flex items-center justify-center min-h-screen p-8 bg-slate-50">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch justify-center">
        {/* Left Section */}
        <div className="flex flex-col gap-6 w-full h-full">
          {renderCard(
            isAddWorkEnabled,
            user ? "/add" : "/login",
            <div className={`bg-white rounded-3xl p-10 h-full min-h-[300px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center transition-all duration-300 ${isAddWorkEnabled ? 'hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1' : ''}`}>
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">หน้าสำหรับคนจดงาน</h2>
              <p className="text-slate-500 text-center">{user ? 'กดเพื่อจดงานใหม่ได้เลยจ้า' : 'ล็อกอินก่อนเข้าใช้งานนะจ้ะ'}</p>
            </div>
          )}

          <div className="flex flex-col gap-4 items-center mt-auto h-[104px] justify-end">
            {!user ? (
              <Link
                href="/login"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors border border-slate-300 rounded-full px-6 py-2 shadow-sm bg-white hover:bg-slate-100 w-full text-center"
              >
                เข้าสู่ระบบชามนพิ
              </Link>
            ) : (
              <>
                <form action="/auth/signout" method="post" className="w-full">
                  <button className="w-full text-slate-600 hover:text-slate-900 font-medium transition-colors border border-slate-300 rounded-full px-6 py-2 shadow-sm bg-white hover:bg-slate-100">
                    ออกจากระบบพิชามน
                  </button>
                </form>

                <Link
                  href="/line"
                  className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors text-sm flex items-center justify-center gap-1.5 w-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  จัดการข้อความ LINE
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Middle Section */}
        <div className="w-full h-full flex flex-col gap-6">
          {renderCard(
            kanbanEnabled,
            "/kanban",
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

          {/* Exam Summaries */}
          {renderCard(
            summariesEnabled,
            "/summaries",
            <div className={`bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-8 border border-rose-100 flex flex-col items-center justify-center transition-all duration-300 ${summariesEnabled ? 'hover:shadow-[0_8px_30px_rgb(225,29,72,0.2)] hover:-translate-y-1' : ''} relative overflow-hidden h-full`}>
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
              
              <div className="bg-white/20 text-white p-4 rounded-full mb-4 group-hover:scale-110 transition-transform backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 text-center">แจกสรุปสอบกลางภาค 1/69</h2>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mt-2 border border-white/30">
                <p className="text-white text-xs font-medium tracking-wide">
                  <Countdown date="2026-07-13T00:00:00+07:00" />
                </p>
              </div>
            </div>,
            "group flex-1 min-h-[160px] flex flex-col w-full"
          )}

          {/* Exam Topics */}
          {renderCard(
            true, // Assuming we want this enabled
            "/exam-topics",
            <div className={`bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-8 border border-indigo-100 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(99,102,241,0.2)] hover:-translate-y-1 relative overflow-hidden h-full`}>
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
              
              <div className="bg-white/20 text-white p-4 rounded-full mb-4 group-hover:scale-110 transition-transform backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 text-center">เนื้อหาออกสอบกลางภาค 1/69</h2>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mt-2 border border-white/30">
                <p className="text-white text-xs font-medium tracking-wide">
                  ดูหัวข้อสอบทั้งหมด
                </p>
              </div>
            </div>,
            "group flex-1 min-h-[160px] flex flex-col w-full"
          )}
        </div>

        {/* Right Section (Election) */}
        <div className="w-full h-full flex flex-col gap-6">
          {renderCard(
            electionEnabled,
            "/election",
            <div className={`bg-white rounded-3xl p-10 h-full min-h-[300px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center transition-all duration-300 ${electionEnabled ? 'hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1' : ''}`}>
              <div className="bg-amber-50 text-amber-500 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">ผลการเลือกตั้งปี 2569</h2>
              <p className="text-slate-500 text-center">อัปเดตผลโหวตหัวหน้าห้องล่าสุด!</p>
            </div>
          )}

          {/* Leader Assessment */}
          {renderCard(
            bossEvaluationEnabled,
            "/evaluate-boss",
            <div className={`bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center transition-all duration-300 ${bossEvaluationEnabled ? 'hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1' : ''} relative overflow-hidden h-full`}>
              <div className="bg-emerald-50 text-emerald-500 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/><path d="M18 21v-8a2 2 0 0 0-2-2h-3"/><path d="M4 14.5V7a2 2 0 0 1 2-2h6l4 4"/></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">ระบบประเมินหัวหน้า</h2>
              <p className="text-slate-500 text-center text-sm">คลิกเพื่อประเมินได้เลย</p>
            </div>,
            "group flex-1 min-h-[160px] flex flex-col w-full"
          )}

          <div className="flex flex-col gap-4 items-center mt-auto h-[104px] justify-start pt-4">
            {user ? (
              <>
                <Link
                  href="/election/edit"
                  className="text-amber-600 hover:text-amber-700 font-medium transition-colors text-sm flex items-center justify-center gap-1.5 w-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  จัดการผู้สมัคร
                </Link>
                <Link
                  href="/settings"
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors text-sm flex items-center justify-center gap-1.5 w-full mt-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
                  ตั้งค่าระบบพริมจ๋า
                </Link>
                <Link
                  href="/funds"
                  className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors text-sm flex items-center justify-center gap-1.5 w-full mt-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
                  ระบบทวงเงินห้อง
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="text-slate-400 hover:text-amber-600 font-medium transition-colors text-sm flex items-center justify-center gap-1.5 w-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
                เข้าสู่ระบบเพื่อจัดการ
              </Link>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
