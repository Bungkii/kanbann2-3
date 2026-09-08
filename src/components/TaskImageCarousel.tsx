'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
}

export default function TaskImageCarousel({
  images,
  alt = 'ภาพประกอบการบ้าน',
  className = '',
}: TaskImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Clean empty or null values
  const validImages = images.filter(Boolean);

  if (validImages.length === 0) return null;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  // Single image display
  if (validImages.length === 1) {
    return (
      <>
        <div
          onClick={() => setIsLightboxOpen(true)}
          className={`relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 group cursor-pointer ${className}`}
        >
          <img
            src={validImages[0]}
            alt={alt}
            className="w-full h-auto max-h-[360px] object-contain mx-auto transition-transform group-hover:scale-[1.01]"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 p-2 rounded-full bg-black/60 text-white transition-opacity shadow-md">
              <Maximize2 size={18} />
            </span>
          </div>
        </div>

        {/* Lightbox Modal */}
        {isLightboxOpen && (
          <div
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>
            <img
              src={validImages[0]}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  // Multiple images carousel with sliding / scrolling
  return (
    <>
      <div className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-sm select-none ${className}`}>
        {/* Main Image Slider Container */}
        <div
          onClick={() => setIsLightboxOpen(true)}
          className="relative w-full h-[280px] sm:h-[340px] flex items-center justify-center cursor-pointer bg-slate-950"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={validImages[currentIndex]}
              alt={`${alt} (${currentIndex + 1}/${validImages.length})`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full object-contain"
            />
          </AnimatePresence>

          {/* Badge indicator on top right */}
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
            <span>รูปที่ {currentIndex + 1} / {validImages.length}</span>
          </div>

          {/* Click to zoom prompt */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/80 text-[11px] font-medium flex items-center gap-1">
            <Maximize2 size={12} />
            <span>แตะเพื่อขยาย</span>
          </div>

          {/* Left / Right Nav Buttons */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110 active:scale-95 cursor-pointer z-10 shadow-lg"
            aria-label="รูปก่อนหน้า"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110 active:scale-95 cursor-pointer z-10 shadow-lg"
            aria-label="รูปถัดไป"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Bottom Thumbnails Strip / Dots */}
        <div className="bg-slate-900/95 p-2 px-3 flex items-center justify-center gap-1.5 overflow-x-auto border-t border-white/10">
          {validImages.map((imgUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-11 w-11 sm:h-12 sm:w-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                idx === currentIndex
                  ? 'border-sky-400 scale-105 shadow-md shadow-sky-500/20'
                  : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <img src={imgUrl} alt={`thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal with Full-Screen Carousel */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-between p-4 animate-in fade-in duration-200"
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between px-2 py-2 text-white">
            <span className="text-sm font-semibold text-slate-300">
              รูปที่ {currentIndex + 1} จาก {validImages.length}
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Main Image in Lightbox */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={validImages[currentIndex]}
              alt={`${alt} ${currentIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />

            {/* Prev / Next in Lightbox */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all cursor-pointer"
            >
              <ChevronLeft size={28} />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all cursor-pointer"
            >
              <ChevronRight size={28} />
            </button>
          </div>

          {/* Bottom Thumbnails in Lightbox */}
          <div
            className="w-full max-w-xl py-3 flex items-center justify-center gap-2 overflow-x-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {validImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-12 w-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                  idx === currentIndex
                    ? 'border-sky-400 scale-110 shadow-lg'
                    : 'border-white/20 opacity-50 hover:opacity-80'
                }`}
              >
                <img src={imgUrl} alt={`lightbox thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
