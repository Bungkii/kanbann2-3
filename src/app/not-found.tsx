import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header with Navigation */}
      <header className="w-full bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 py-4 md:py-6">
            <Link href="/" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              🏠 หน้าแรก
            </Link>
            <Link href="/add" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
              📝 จดงาน
            </Link>
            <Link href="/kanban" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              📋 กระดานงาน
            </Link>
            <Link href="/summaries" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-colors">
              📖 สรุปสอบ
            </Link>
            <Link href="/election" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors">
              🗳️ เลือกตั้ง
            </Link>
            <Link href="/evaluate-boss" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
              👑 ประเมินหัวหน้า
            </Link>
            <Link href="/settings" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
              ⚙️ ตั้งค่าระบบ
            </Link>
          </div>
        </div>
      </header>

      {/* 404 Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 py-16">
        <div className="text-center max-w-2xl bg-white p-10 md:p-16 rounded-3xl shadow-xl border border-slate-100">
          <h1 className="text-9xl font-black text-slate-200 mb-6 drop-shadow-sm">404</h1>
          <div className="w-24 h-2 bg-blue-500 rounded-full mx-auto mb-8"></div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            ไม่พบหน้าที่คุณต้องการ
          </h2>
          <p className="text-slate-500 text-lg mb-10">
            ขออภัยค่ะ พริมจ๋าหาหน้าที่คุณต้องการไม่เจอ ลองเลือกเมนูจากแถบด้านบน หรือกลับไปเริ่มต้นที่หน้าแรกนะคะ 😢
          </p>
          
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </main>
    </div>
  );
}
