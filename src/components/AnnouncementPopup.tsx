'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function AnnouncementPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPopup = async () => {
      // Check if user has hidden the popup for 14 days
      const hideUntilStr = localStorage.getItem('hide_popup_until');
      if (hideUntilStr) {
        const hideUntil = parseInt(hideUntilStr, 10);
        if (Date.now() < hideUntil) {
          setIsLoading(false);
          return;
        } else {
          localStorage.removeItem('hide_popup_until'); // Expired
        }
      }

      // Check if media exists via our API
      try {
        const res = await fetch('/api/asset/media', { method: 'HEAD' });
        if (res.ok) {
          // Add a random query param just to bust browser cache while testing if needed,
          // but usually static url is fine.
          setImgSrc('/api/asset/media');
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Failed to check popup media', err);
      }
      setIsLoading(false);
    };

    checkPopup();
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      // Set to hide for 14 days
      const hideUntil = Date.now() + 14 * 24 * 60 * 60 * 1000;
      localStorage.setItem('hide_popup_until', hideUntil.toString());
    }
    setIsOpen(false);
  };

  if (isLoading || !isOpen || !imgSrc) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Image Section */}
            <div className="flex-1 overflow-hidden bg-slate-900 relative">
              <img 
                src={imgSrc} 
                alt="Announcement" 
                className="w-full h-auto object-contain max-h-[calc(90vh-60px)]"
              />
            </div>

            {/* Bottom Bar */}
            <div className="bg-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-t border-slate-100 shrink-0">
              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded focus:ring-2 focus:ring-slate-400 focus:outline-none checked:bg-slate-800 checked:border-slate-800 transition-colors cursor-pointer"
                  />
                  <svg 
                    className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth="3"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm sm:text-base text-slate-600 font-medium select-none group-hover:text-slate-800 transition-colors">
                  ไม่ต้องแสดงข้อความนี้ 14 วัน
                </span>
              </label>

              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
