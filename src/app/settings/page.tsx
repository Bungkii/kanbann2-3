import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PageTransition from "@/components/PageTransition";
import { ArrowLeft, Settings as SettingsIcon, Shirt, Calendar, Trash2 } from 'lucide-react';

export const revalidate = 0;

export default async function SettingsDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <PageTransition className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-4xl relative">
        <Link 
          href="/"
          className="absolute -top-4 left-0 md:-left-12 text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors z-10"
          title="กลับหน้าแรก"
        >
          <ArrowLeft size={24} />
        </Link>
        
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="text-center mb-10 flex flex-col items-center">
            <div className="bg-slate-100 text-slate-600 p-4 rounded-full mb-4">
              <SettingsIcon size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">ตั้งค่าระบบพริมจ๋า</h1>
            <p className="text-slate-500">
              จัดการระบบต่างๆ ภายในห้องเรียน
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/settings/schedule" className="group">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 flex flex-col items-center text-center h-full transition-all hover:bg-indigo-50 hover:border-indigo-100 hover:shadow-sm">
                <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Calendar size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-700">ตารางสอน</h2>
                <p className="text-sm text-slate-500">จัดการตารางเรียนแต่ละคาบ (ม.2/3)</p>
              </div>
            </Link>

            <Link href="/settings/cleaning" className="group">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 flex flex-col items-center text-center h-full transition-all hover:bg-emerald-50 hover:border-emerald-100 hover:shadow-sm">
                <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Trash2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-emerald-700">ตารางเวร</h2>
                <p className="text-sm text-slate-500">จัดการเวรทำความสะอาด จันทร์-ศุกร์</p>
              </div>
            </Link>

            <Link href="/settings/uniform" className="group">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 flex flex-col items-center text-center h-full transition-all hover:bg-amber-50 hover:border-amber-100 hover:shadow-sm">
                <div className="bg-amber-100 text-amber-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Shirt size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-amber-700">ชุดเครื่องแบบ</h2>
                <p className="text-sm text-slate-500">กำหนดชุดนักเรียนที่ต้องใส่ในแต่ละวัน</p>
              </div>
            </Link>

            <Link href="/settings/system" className="group">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 flex flex-col items-center text-center h-full transition-all hover:bg-rose-50 hover:border-rose-100 hover:shadow-sm">
                <div className="bg-rose-100 text-rose-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <SettingsIcon size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-rose-700">ระบบทั่วไป</h2>
                <p className="text-sm text-slate-500">เปิด-ปิดแบบประเมินหัวหน้า ฯลฯ</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
