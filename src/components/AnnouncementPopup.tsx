'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface PopupImage {
  image_url: string;
  link_url?: string;
}

export default function AnnouncementPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<PopupImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 prev, 1 next
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPopup = async () => {
      const hideUntilStr = localStorage.getItem('hide_popup_until');
      if (hideUntilStr) {
        const hideUntil = parseInt(hideUntilStr, 10);
        if (Date.now() < hideUntil) { setIsLoading(false); return; }
        else localStorage.removeItem('hide_popup_until');
      }

      let loaded: PopupImage[] = [];

      // 1. Try system_settings (multi-image array)
      try {
        const res = await fetch('/api/popup-settings');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.popup_images) && data.popup_images.length > 0) {
            loaded = data.popup_images.filter((p: PopupImage) => p.image_url?.trim());
          }
        }
      } catch { /* fall through */ }

      // 2. Fallback: file-based /api/asset/media
      if (loaded.length === 0) {
        try {
          const fallback = await fetch('/api/asset/media', { method: 'HEAD' });
          if (fallback.ok) loaded = [{ image_url: '/api/asset/media' }];
        } catch { /* no popup */ }
      }

      if (loaded.length > 0) {
        setImages(loaded);
        setIsOpen(true);
      }
      setIsLoading(false);
    };

    checkPopup();
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_popup_until', (Date.now() + 14 * 24 * 60 * 60 * 1000).toString());
    }
    setIsOpen(false);
  };

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goTo = (idx: number) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  if (isLoading || !isOpen || images.length === 0) return null;

  const current = images[currentIndex];
  const hasMultiple = images.length > 1;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Image carousel area */}
            <div className="flex-1 overflow-hidden bg-slate-900 relative min-h-[200px]">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="w-full"
                >
                  {current.link_url ? (
                    <a href={current.link_url} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block group cursor-pointer relative">
                      <img src={current.image_url} alt={`Popup ${currentIndex + 1}`}
                        className="w-full h-auto object-contain max-h-[calc(90vh-120px)] group-hover:brightness-90 transition-all" />
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                        <ExternalLink size={12} /><span>กดเพื่อดูเพิ่มเติม</span>
                      </div>
                    </a>
                  ) : (
                    <img src={current.image_url} alt={`Popup ${currentIndex + 1}`}
                      className="w-full h-auto object-contain max-h-[calc(90vh-120px)]" />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Prev / Next arrows */}
              {hasMultiple && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors backdrop-blur-sm">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors backdrop-blur-sm">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Close button (top-right) */}
              <button onClick={handleClose}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm">
                <X size={16} />
              </button>

              {/* Dot indicators */}
              {hasMultiple && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); goTo(i); }}
                      className={`rounded-full transition-all ${i === currentIndex ? 'bg-white w-5 h-2' : 'bg-white/50 w-2 h-2 hover:bg-white/75'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom bar */}
            <div className="bg-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-t border-slate-100 shrink-0">
              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded focus:ring-2 focus:ring-slate-400 focus:outline-none checked:bg-slate-800 checked:border-slate-800 transition-colors cursor-pointer" />
                  <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm sm:text-base text-slate-600 font-medium select-none group-hover:text-slate-800 transition-colors">
                  ไม่ต้องแสดงข้อความนี้ 14 วัน
                </span>
              </label>

              {hasMultiple && (
                <span className="text-xs text-slate-400 font-medium">
                  {currentIndex + 1} / {images.length}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
