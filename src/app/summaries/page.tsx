'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getExamSummaries } from './actions';
import Countdown from '@/components/Countdown';
import { BookOpen, Download, FileText, ArrowLeft, Upload, Clock, Image as ImageIcon, ExternalLink } from 'lucide-react';

type SummaryData = {
  id: string;
  title: string;
  subject: string;
  description: string;
  file_url: string;
  file_urls?: string[];
  created_at: string;
};

function getFileType(url: string): 'pdf' | 'image' {
  const lower = url.toLowerCase();
  if (lower.includes('.pdf')) return 'pdf';
  return 'image';
}

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    setIsLoading(true);
    const result = await getExamSummaries();
    if (result.summaries) {
      setSummaries(result.summaries);
    }
    setIsLoading(false);
  };

  const getUrls = (summary: SummaryData): string[] => {
    if (summary.file_urls && summary.file_urls.length > 0) return summary.file_urls;
    if (summary.file_url) return [summary.file_url];
    return [];
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header & Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200"
          >
            <ArrowLeft size={16} />
            กลับหน้าหลัก
          </Link>
          <Link
            href="/summaries/upload"
            className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-4 py-2 rounded-full shadow-sm transition-all flex items-center gap-2"
          >
            <Upload size={16} />
            แชร์สรุปสอบ
          </Link>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-8 md:p-12 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="bg-white/20 text-white p-5 rounded-full mb-6 backdrop-blur-md">
              <BookOpen size={48} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">คลังสรุปสอบกลางภาค 1/69</h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              ศูนย์รวมสรุปเนื้อหาสอบกลางภาค อ่านฟรี โหลดฟรี เพื่อเพื่อนร่วมห้องทุกคน!
            </p>
            
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 flex flex-col items-center">
              <div className="flex items-center gap-2 text-white/90 mb-2">
                <Clock size={20} />
                <span className="font-medium text-lg">นับถอยหลังวันสอบ (13/7/69)</span>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white tracking-wider">
                <Countdown date="2026-07-13T00:00:00+07:00" />
              </div>
            </div>
          </div>
        </div>

        {/* Summaries List */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="text-rose-500" />
            สรุปล่าสุด
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div>
            </div>
          ) : summaries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="bg-slate-50 text-slate-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">ยังไม่มีสรุปสอบเลย</h3>
              <p className="text-slate-500 mb-6">มาเป็นคนแรกที่แชร์ความรู้ให้เพื่อนๆ กันเถอะ!</p>
              <Link
                href="/summaries/upload"
                className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 font-medium px-6 py-3 rounded-full hover:bg-rose-100 transition-colors"
              >
                <Upload size={20} />
                แชร์สรุปสอบเลย!
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {summaries.map((summary) => {
                const urls = getUrls(summary);
                const pdfUrls = urls.filter(u => getFileType(u) === 'pdf');
                const imageUrls = urls.filter(u => getFileType(u) === 'image');

                return (
                  <div key={summary.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all flex flex-col h-full group overflow-hidden">
                    {/* Image preview strip */}
                    {imageUrls.length > 0 && (
                      <div className={`grid ${imageUrls.length === 1 ? 'grid-cols-1' : imageUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-0.5 bg-slate-100`}>
                        {imageUrls.slice(0, 3).map((url, i) => (
                          <div key={i} className="relative aspect-[4/3] cursor-pointer overflow-hidden" onClick={() => setLightboxImg(url)}>
                            <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                            {i === 2 && imageUrls.length > 3 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">+{imageUrls.length - 3}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex-1">
                        <div className="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-full inline-block mb-4">
                          {summary.subject}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-rose-600 transition-colors line-clamp-2">
                          {summary.title}
                        </h3>
                        <p className="text-slate-500 text-sm mb-4 line-clamp-3">
                          {summary.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                        </p>

                        {/* File counts */}
                        <div className="flex gap-3 text-xs text-slate-400 mb-4">
                          {pdfUrls.length > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText size={14} /> {pdfUrls.length} PDF
                            </span>
                          )}
                          {imageUrls.length > 0 && (
                            <span className="flex items-center gap-1">
                              <ImageIcon size={14} /> {imageUrls.length} รูป
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="mt-auto pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                        {pdfUrls.map((url, i) => (
                          <a
                            key={`pdf-${i}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-rose-50 text-rose-600 text-xs font-medium px-3 py-2 rounded-full hover:bg-rose-100 transition-colors"
                          >
                            <FileText size={14} />
                            เปิด PDF {pdfUrls.length > 1 ? `#${i + 1}` : ''}
                          </a>
                        ))}
                        {imageUrls.length > 0 && (
                          <button
                            onClick={() => setLightboxImg(imageUrls[0])}
                            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-2 rounded-full hover:bg-indigo-100 transition-colors"
                          >
                            <ImageIcon size={14} />
                            ดูรูป ({imageUrls.length})
                          </button>
                        )}
                        {urls.length > 0 && (
                          <a
                            href={urls[0]}
                            download
                            className="flex items-center gap-1.5 bg-slate-50 text-slate-600 text-xs font-medium px-3 py-2 rounded-full hover:bg-slate-100 transition-colors ml-auto"
                          >
                            <Download size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-sm"
            onClick={() => setLightboxImg(null)}
          >
            ✕
          </button>
          <img 
            src={lightboxImg} 
            alt="Full view" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {/* Navigation dots for multiple images */}
          {summaries.some(s => {
            const urls = getUrls(s);
            const imgs = urls.filter(u => getFileType(u) === 'image');
            return imgs.includes(lightboxImg) && imgs.length > 1;
          }) && (() => {
            const currentSummary = summaries.find(s => {
              const urls = getUrls(s);
              return urls.filter(u => getFileType(u) === 'image').includes(lightboxImg);
            });
            if (!currentSummary) return null;
            const imgs = getUrls(currentSummary).filter(u => getFileType(u) === 'image');
            const currentIdx = imgs.indexOf(lightboxImg);
            return (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3" onClick={(e) => e.stopPropagation()}>
                {imgs.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxImg(img)}
                    className={`w-3 h-3 rounded-full transition-all ${i === currentIdx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </main>
  );
}
