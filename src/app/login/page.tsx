import Link from 'next/link';
import LoginForm from './LoginForm';
import { ArrowLeft } from 'lucide-react';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata = {
  title: 'เข้าสู่ระบบ | พริมทวงยิก ม.2/3',
};

export default async function LoginPage(props: Props) {
  const searchParams = await props.searchParams;
  const message = searchParams?.message as string | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50/30 to-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative font-sans">
      {/* Back button */}
      <Link
        href="/"
        className="absolute left-4 top-4 sm:left-6 sm:top-6 py-2 px-4 rounded-full no-underline text-slate-600 bg-white/80 hover:bg-white border border-white/80 shadow-sm backdrop-blur-sm flex items-center gap-2 text-sm font-medium transition-all hover:-translate-x-0.5 z-10"
      >
        <ArrowLeft size={15} />
        กลับ
      </Link>

      {/* Subtle background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* App branding header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-xl overflow-hidden">
            <img
              src="/icons/icon-192.jpg"
              alt="พริมทวงยิก"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            เข้าสู่ระบบ
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            พริมทวงยิก · ระบบห้อง ม.2/3
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 sm:p-10 shadow-[0_8px_40px_rgba(124,58,237,0.1)] border border-white">
          <LoginForm initialMessage={message} />
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-6">
          เฉพาะนักเรียน ม.2/3 เท่านั้น · รหัสเริ่มต้น{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded-md font-mono text-slate-600">bBb@เลขประจำตัว</code>
        </p>
      </div>
    </div>
  );
}

