import Link from 'next/link';
import LoginForm from './LoginForm';
import { ArrowLeft, Sparkles, BookOpen } from 'lucide-react';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata = {
  title: 'เข้าสู่ระบบ 🌸 | พริมทวงยิก ม.2/3',
  description: 'ระบบเข้าสู่ระบบด้วยเลขประจำตัวนักเรียน และทางเข้าสำหรับผู้ปกครองห้อง ม.2/3',
};

export default async function LoginPage(props: Props) {
  const searchParams = await props.searchParams;
  const message = searchParams?.message as string | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/90 via-pink-50/50 to-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 py-10 relative font-sans selection:bg-rose-400 selection:text-white">
      {/* Back button */}
      <Link
        href="/"
        className="absolute left-4 top-4 sm:left-6 sm:top-6 py-2 px-4 rounded-full no-underline text-slate-600 bg-white/90 hover:bg-white border border-pink-200/60 shadow-2xs backdrop-blur-md flex items-center gap-2 text-xs sm:text-sm font-semibold transition-all hover:-translate-x-0.5 z-20"
      >
        <ArrowLeft size={15} />
        กลับหน้าหลัก
      </Link>

      {/* Parent Manual Quick Link (Top Right) */}
      <Link
        href="/parent/manual"
        className="absolute right-4 top-4 sm:right-6 sm:top-6 py-2 px-4 rounded-full no-underline text-rose-700 bg-white/90 hover:bg-rose-50 border border-pink-200/80 shadow-2xs backdrop-blur-md flex items-center gap-2 text-xs sm:text-sm font-semibold transition-all hover:scale-105 z-20"
      >
        <BookOpen size={14} className="text-rose-500" />
        <span className="hidden sm:inline">คู่มือผู้ปกครอง 🌸</span>
        <span className="sm:hidden">คู่มือ 🌸</span>
      </Link>

      {/* Subtle ambient pink sakura glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[420px] h-[420px] bg-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-100/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10 my-auto">
        {/* App branding header */}
        <div className="text-center mb-6">
          {/* 🌸 LOGO SLOT: โลโก้ของระบบ (สามารถเปลี่ยนรูปได้ที่นี่หรือแทนที่ /icons/icon-192.jpg) */}
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl mx-auto mb-3.5 bg-white p-2 border-2 border-pink-200 shadow-[0_8px_30px_rgba(244,63,94,0.15)] flex items-center justify-center relative group">
            <img
              src="/icons/icon-192.jpg"
              alt="โลโก้ระบบห้อง ม.2/3"
              className="w-full h-full object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute -bottom-2 bg-rose-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs tracking-wide">
              ม.2/3
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
            <span>เข้าสู่ระบบ</span>
            <span className="text-rose-500 text-xl">🌸</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            พริมทวงยิก · ระบบห้องเรียน & ผู้ปกครอง ม.2/3
          </p>
        </div>

        {/* White & Pink Glassmorphism Form Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-9 shadow-[0_12px_45px_rgba(244,63,94,0.1)] border border-pink-100">
          <LoginForm initialMessage={message} />
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-xs text-slate-400">
            ระบบนักเรียน ม.2/3 เข้าใช้งานด้วยเลขประจำตัว 5 หลัก
          </p>
          <p className="text-[11px] text-slate-400">
            รหัสเริ่มต้น:{' '}
            <code className="bg-pink-50 border border-pink-200 text-rose-700 px-1.5 py-0.5 rounded-md font-mono font-bold">
              bBb@เลขประจำตัว
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
