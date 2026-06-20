'use client';

import { useState, useEffect } from 'react';

export default function AnnouncementPopup() {
  const [show, setShow] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has opted out
    const dismissed = localStorage.getItem('hideAnnouncement');
    if (dismissed) return;

    // Try to load .png first
    const imgPng = new window.Image();
    imgPng.src = '/asset/media.png';
    imgPng.onload = () => {
      setImageUrl('/asset/media.png');
      setShow(true);
    };
    imgPng.onerror = () => {
      // Fallback to .jpg
      const imgJpg = new window.Image();
      imgJpg.src = '/asset/media.jpg';
      imgJpg.onload = () => {
        setImageUrl('/asset/media.jpg');
        setShow(true);
      };
      // If both fail, do nothing (popup won't show)
    };
  }, []);

  const handleClose = () => {
    setShow(false);
  };

  const handleNeverShowAgain = () => {
    localStorage.setItem('hideAnnouncement', 'true');
    setShow(false);
  };

  if (!show || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl relative w-full max-w-[640px] flex flex-col items-center animate-in zoom-in-95 duration-300">
        
        {/* Close Button Top Right */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur-md transition-all hover:scale-110"
          title="ปิด"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        {/* Image Container (Max 640x640) */}
        <div className="w-full bg-slate-100 flex items-center justify-center" style={{ maxHeight: '640px' }}>
          <img 
            src={imageUrl} 
            alt="ประกาศประชาสัมพันธ์" 
            className="w-full h-auto object-contain max-h-[640px]"
          />
        </div>

        {/* Footer with "Don't show again" */}
        <div className="w-full p-4 bg-white flex justify-center border-t border-slate-100">
          <button 
            onClick={handleNeverShowAgain}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            ไม่แสดงอีก
          </button>
        </div>
      </div>
    </div>
  );
}
