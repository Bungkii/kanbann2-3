'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share, X, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function ParentPwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (PWA installed)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check if previously dismissed in this session
    const dismissed = sessionStorage.getItem('parent_pwa_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Capture beforeinstallprompt for Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('parent_pwa_dismissed', 'true');
  };

  // Do not show if already installed in standalone PWA or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Floating Install Prompt Pill */}
      <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border border-white/15 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Smartphone size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold truncate text-white">
                ติดตั้งเป็นแอปบนมือถือ (PWA)
              </p>
              <p className="text-[11px] text-slate-300 truncate">
                เปิดได้เร็ว สะดวก และจำข้อมูลบุตรหลานเสมอ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/25 flex items-center gap-1 cursor-pointer"
            >
              <Download size={13} />
              <span>ติดตั้ง</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
              aria-label="ปิด"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div
          onClick={() => setShowIOSModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-sky-100 text-sky-600">
                  <Smartphone size={22} />
                </span>
                <h3 className="font-extrabold text-base text-slate-800">
                  เพิ่มไปยังหน้าจอโฮม
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 space-y-3">
              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  แตะที่ปุ่ม <strong>แชร์ (Share)</strong> <Share className="inline -mt-1 mx-0.5 text-sky-600" size={15} /> ที่แถบเมนู Safari
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  เลื่อนลงมาแล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong>
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  แตะ <strong>"เพิ่ม" (Add)</strong> ที่มุมบนขวา เพื่อเริ่มใช้งานแอปได้ทันที
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shadow-md shadow-sky-600/20"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </>
  );
}
