import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex-1 flex items-center justify-center min-h-screen p-8 bg-slate-50">
      <div className="max-w-5xl w-full flex flex-col md:flex-row gap-8 items-stretch justify-center">
        {/* Left Section */}
        <div className="flex flex-col gap-6 flex-1 max-w-md">
          <Link href="/add" className="group">
            <div className="bg-white rounded-3xl p-10 h-full min-h-[300px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">หน้าสำหรับคนจดงาน</h2>
              <p className="text-slate-500 text-center">เด็กหญิงพิชามนเท่านั้นจ่า</p>
            </div>
          </Link>

          <div className="flex flex-col gap-4 items-center mt-4">
            {!user ? (
              <Link
                href="/login"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors border border-slate-300 rounded-full px-6 py-2 shadow-sm bg-white hover:bg-slate-100"
              >
                เข้าสู่ระบบชามนพิ
              </Link>
            ) : (
              <form action="/auth/signout" method="post">
                <button className="text-slate-600 hover:text-slate-900 font-medium transition-colors border border-slate-300 rounded-full px-6 py-2 shadow-sm bg-white hover:bg-slate-100">
                  ออกจากระบบพิชามน
                </button>
              </form>
            )}

            <Link
              href="/line"
              className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors text-sm flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              จัดการข้อความ LINE
            </Link>
          </div>
        </div>

        {/* Right Section */}
        <Link href="/kanban" className="flex-1 max-w-md group">
          <div className="bg-white rounded-3xl p-10 h-full min-h-[300px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
            <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M8 7v7" /><path d="M12 7v4" /><path d="M16 7v9" /></svg>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-slate-800">พริมง่วงทวงบุญคุณ</h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
            </div>
            <p className="text-slate-500 text-center">พริมง่วงทวงความยุติธรรม</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
