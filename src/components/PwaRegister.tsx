'use client';

import { useEffect, useState } from 'react';

export default function PwaRegister() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] SW registration failed:', err);
        });
    }

    // Detect if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detect successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled || !isInstallable) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
      style={{ animation: 'slideUp 0.4s ease' }}
    >
      <div className="bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/20">
          <img src="/icons/icon-192.jpg" alt="App icon" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">ติดตั้งแอป</p>
          <p className="text-xs text-white/80 mt-0.5">พริมทวงยิก ม.2/3 บนหน้าจอหลัก</p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-white text-violet-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-white/90 transition-colors flex-shrink-0"
        >
          ติดตั้ง
        </button>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
