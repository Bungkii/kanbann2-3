import Link from 'next/link';
import LoginForm from './LoginForm';
import { ArrowLeft, KeyRound } from 'lucide-react';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage(props: Props) {
  const searchParams = await props.searchParams;
  const message = searchParams?.message as string | undefined;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative font-sans">
      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute left-6 top-6 py-2 px-4 rounded-full no-underline text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm flex items-center gap-2 text-sm font-medium transition-all hover:-translate-x-0.5"
      >
        <ArrowLeft size={16} />
        กลับหน้าหลัก
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100/80 shadow-xs">
            <KeyRound size={30} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            เข้าสู่ระบบพริมจ๋า
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ระบบกระดานจัดการงานและห้องเรียน ม.2/3
          </p>
        </div>

        {/* Client Form Component */}
        <LoginForm initialMessage={message} />
      </div>
    </div>
  );
}
