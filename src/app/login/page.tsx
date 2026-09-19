import Link from 'next/link';
import LoginForm from './LoginForm';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata = {
  title: 'เข้าสู่ระบบ | พริมทวงยิก ม.2/3',
  description: 'ระบบเข้าสู่ระบบด้วยเลขประจำตัวนักเรียน ห้อง ม.2/3',
};

export default async function LoginPage(props: Props) {
  const searchParams = await props.searchParams;
  const message = searchParams?.message as string | undefined;
  const redirectParam = searchParams?.redirect as string | undefined;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative font-sans selection:bg-indigo-500 selection:text-white">
      {/* Back button matching screenshot */}
      <Link
        href="/"
        className="absolute left-6 top-6 sm:left-8 sm:top-8 py-2 px-4 rounded-lg no-underline text-slate-700 bg-slate-200 hover:bg-slate-300 flex items-center gap-1.5 text-sm font-medium transition-all shadow-2xs group cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-hover:-translate-x-0.5"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>Back</span>
      </Link>

      <div className="w-full max-w-md my-auto">
        <LoginForm initialMessage={message} initialRedirect={redirectParam} />
      </div>
    </div>
  );
}
