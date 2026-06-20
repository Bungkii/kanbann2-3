'use client';

import { useState } from 'react';

export default function Footer() {
  const [showPromptPay, setShowPromptPay] = useState(false);

  return (
    <>
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 relative z-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row justify-center items-center gap-4 text-sm font-medium text-slate-500">
          <button
            onClick={() => setShowPromptPay(true)}
            className="flex items-center gap-2 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 px-5 py-2.5 rounded-full border border-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>
            สนับสนุนเด็กชายบุ้งกี๋
          </button>

          <a
            href="https://forms.gle/hrCRndjeW194GjhNA"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-red-500 transition-colors bg-slate-50 hover:bg-red-50 px-5 py-2.5 rounded-full border border-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M17.47 9c1.93-.2 3.53-1.9 3.53-4"/><path d="M8 12H4.62"/><path d="M16 12h3.38"/><path d="M8 15H5.5"/><path d="M16 15h2.5"/></svg>
            รายงานปัญหา
          </a>
        </div>
      </footer>

      {showPromptPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowPromptPay(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">สนับสนุนเด็กชายบุ้งกี๋</h3>
              <button onClick={() => setShowPromptPay(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4 flex justify-center">
              <img
                src="/asset/promptpay.jpg"
                alt="PromptPay QR Code"
                className="w-full max-w-[250px] h-auto rounded-xl shadow-sm"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/300x400/indigo/white?text=ใส่รูป PromptPay\\nที่โฟลเดอร์\\npublic/asset/promptpay.jpg';
                }}
              />
            </div>
            <p className="text-center text-sm text-slate-500">
              สนับสนุนการพัฒนาและเป็นดอกเบี้ย
            </p>
          </div>
        </div>
      )}
    </>
  );
}
