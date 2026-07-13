import Link from 'next/link';

export default function FeatureDisabled({ title }: { title: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm max-w-md w-full text-center">
        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">{title}</h1>
        <p className="text-slate-500 mb-8">
          ฟีเจอร์นี้ถูกปิดใช้งานชั่วคราวโดยผู้ดูแลระบบ
        </p>
        <Link 
          href="/"
          className="inline-block bg-slate-800 text-white px-6 py-2.5 rounded-full font-medium hover:bg-slate-900 transition-colors"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
