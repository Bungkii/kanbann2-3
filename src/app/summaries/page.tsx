'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getExamSummaries } from './actions';
import Countdown from '@/components/Countdown';
import { BookOpen, Download, FileText, ArrowLeft, Upload, Clock, Image as ImageIcon, Search, ExternalLink, ChevronDown } from 'lucide-react';

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

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  }
  if (diffDays > 0) return `${diffDays} วันที่แล้ว`;
  if (diffHours > 0) return `${diffHours} ชม.ที่แล้ว`;
  if (diffMins > 0) return `${diffMins} นาทีที่แล้ว`;
  return 'เมื่อกี้';
}

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
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

  const subjects = useMemo(() => {
    const set = new Set(summaries.map(s => s.subject));
    return Array.from(set).sort();
  }, [summaries]);

  const filtered = useMemo(() => {
    return summaries.filter(s => {
      const matchSearch = !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchSubject = !selectedSubject || s.subject === selectedSubject;
      return matchSearch && matchSubject;
    });
  }, [summaries, searchQuery, selectedSubject]);

  const getUrls = (summary: SummaryData): string[] => {
    if (summary.file_urls && summary.file_urls.length > 0) return summary.file_urls;
    if (summary.file_url) return [summary.file_url];
    return [];
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Navigation */}
        <div className="flex items-center justify-between mb-2">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200"
          >
            <ArrowLeft size={16} />
            กลับหน้าหลัก
          </Link>
          <Link
            href="/summaries/upload"
            className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-5 py-2.5 rounded-full shadow-sm transition-all flex items-center gap-2 hover:shadow-md"
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
              จุดรวมสรุปเนื้อหาสอบกลางภาค อ่านฟรี โหลดฟรี เพื่อห้อง 3 ทุกท่าน
            </p>

            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 flex flex-col items-center">
              <div className="flex items-center gap-2 text-white/90 mb-2">
                <Clock size={20} />
                <span className="font-medium text-lg">นับถอยหลังวันสอบกลางภาค</span>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white tracking-wider">
                <Countdown date="2026-07-13T00:00:00+07:00" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อชีท, วิชา..."
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent shadow-sm text-slate-700 placeholder:text-slate-400 transition-all"
            />
          </div>

          <div className="relative w-full sm:w-64">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full appearance-none bg-white rounded-2xl border border-slate-200 px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-700 shadow-sm cursor-pointer"
            >
              <option value="">วิชาทั้งหมด</option>
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Summaries List */}
        <div>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="bg-slate-50 text-slate-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                {summaries.length === 0 ? 'ยังไม่มีสรุปสอบเลย' : 'ไม่พบผลลัพธ์'}
              </h3>
              <p className="text-slate-500 mb-6">
                {summaries.length === 0
                  ? 'มาเป็นคนแรกที่แชร์ความรู้ให้เพื่อนๆ กันเถอะ!'
                  : 'ลองเปลี่ยนคำค้นหาหรือตัวกรองวิชาดูนะ'}
              </p>
              {summaries.length === 0 && (
                <Link
                  href="/summaries/upload"
                  className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 font-medium px-6 py-3 rounded-full hover:bg-rose-100 transition-colors"
                >
                  <Upload size={20} />
                  แชร์สรุปสอบเลย!
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((summary) => {
                const urls = getUrls(summary);
                const pdfUrls = urls.filter(u => getFileType(u) === 'pdf');
                const imageUrls = urls.filter(u => getFileType(u) === 'image');
                const firstUrl = urls[0];

                return (
                  <div key={summary.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full group relative">
                    {/* Open link icon */}
                    {firstUrl && (
                      <a
                        href={firstUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors z-10"
                        title="เปิดไฟล์"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}

                    {/* Image thumbnails */}
                    {imageUrls.length > 0 && (
                      <div className={`grid ${imageUrls.length === 1 ? 'grid-cols-1' : imageUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-0.5 rounded-t-2xl overflow-hidden`}>
                        {imageUrls.slice(0, 3).map((url, i) => (
                          <div key={i} className="relative aspect-[4/3] cursor-pointer overflow-hidden" onClick={() => setLightboxImg(url)}>
                            <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                            {i === 2 && imageUrls.length > 3 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">+{imageUrls.length - 3}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-5 flex flex-col flex-1">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-slate-800 mb-3 pr-8 group-hover:text-rose-600 transition-colors line-clamp-2">
                        {summary.title}
                      </h3>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-rose-50 text-rose-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                          {summary.subject}
                        </span>
                        <span className="bg-sky-50 text-sky-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                          กลางภาค เทอม 1
                        </span>
                        <span className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                          พริมจ๋าลาออก
                        </span>
                        {pdfUrls.length > 0 && (
                          <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <FileText size={12} /> PDF
                          </span>
                        )}
                        {imageUrls.length > 0 && (
                          <span className="bg-violet-50 text-violet-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <ImageIcon size={12} /> {imageUrls.length} รูป
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {summary.description && (
                        <p className="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {summary.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            📅 {timeAgo(summary.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {pdfUrls.length > 0 && (
                            <a
                              href={pdfUrls[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                            >
                              <FileText size={12} />
                              เปิด PDF
                            </a>
                          )}
                          {imageUrls.length > 0 && !pdfUrls.length && (
                            <button
                              onClick={() => setLightboxImg(imageUrls[0])}
                              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                            >
                              <ImageIcon size={12} />
                              ดูรูป
                            </button>
                          )}
                        </div>
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
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 p-2.5 rounded-full backdrop-blur-sm text-lg font-bold"
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
          {/* Navigation for images in same summary */}
          {(() => {
            const currentSummary = summaries.find(s => {
              const urls = getUrls(s);
              return urls.filter(u => getFileType(u) === 'image').includes(lightboxImg);
            });
            if (!currentSummary) return null;
            const imgs = getUrls(currentSummary).filter(u => getFileType(u) === 'image');
            if (imgs.length <= 1) return null;
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
