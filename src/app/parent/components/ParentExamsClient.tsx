'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Countdown from '@/components/Countdown';
import {
  BookOpen,
  Calendar,
  Clock,
  Search,
  ExternalLink,
  ChevronDown,
  FileText,
  User,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  FileEdit,
  Download,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type ExamTopic = {
  id: string;
  subject: string;
  teacher: string;
  topics: string[];
  mcq_count: number;
  essay_count: number;
  term?: string;
  created_at?: string;
  updated_at?: string;
  sanitizedHtml?: string | null;
};

export type ExamSummary = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  file_url: string;
  file_urls?: string[];
  uploader_name?: string | null;
  attachment_type?: string | null;
  link_url?: string | null;
  term?: string | null;
  created_at: string;
};

interface ParentExamsClientProps {
  topics: ExamTopic[];
  summaries: ExamSummary[];
  finalExamDate: string;
}

const SUBJECT_ALIASES: Record<string, string> = {
  'วิทย์': 'วิทยาศาสตร์',
  'คณิต': 'คณิตศาสตร์',
  'อังกฤษ': 'ภาษาอังกฤษ',
  'สังคม': 'สังคมศึกษา',
  'ไทย': 'ภาษาไทย',
};

function normalizeSubject(subject: string): string {
  return SUBJECT_ALIASES[subject] || subject;
}

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

export default function ParentExamsClient({
  topics,
  summaries,
  finalExamDate,
}: ParentExamsClientProps) {
  const [activeTab, setActiveTab] = useState<'topics' | 'summaries'>('topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [lightboxImgs, setLightboxImgs] = useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  // Distinct subjects list
  const subjects = useMemo(() => {
    const set = new Set<string>();
    topics.forEach(t => t.subject && set.add(normalizeSubject(t.subject.trim())));
    summaries.forEach(s => s.subject && set.add(normalizeSubject(s.subject.trim())));
    return Array.from(set).sort();
  }, [topics, summaries]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      const norm = normalizeSubject(t.subject);
      if (selectedSubject && norm !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = t.subject?.toLowerCase().includes(q);
        const matchTeacher = t.teacher?.toLowerCase().includes(q);
        const matchTopics = Array.isArray(t.topics) && t.topics.some(tp => String(tp).toLowerCase().includes(q));
        if (!matchSubject && !matchTeacher && !matchTopics) return false;
      }
      return true;
    });
  }, [topics, selectedSubject, searchQuery]);

  // Filter summaries
  const filteredSummaries = useMemo(() => {
    return summaries.filter(s => {
      const norm = normalizeSubject(s.subject);
      if (selectedSubject && norm !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = s.title?.toLowerCase().includes(q);
        const matchSubject = s.subject?.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        const matchUploader = s.uploader_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchSubject && !matchDesc && !matchUploader) return false;
      }
      return true;
    });
  }, [summaries, selectedSubject, searchQuery]);

  const getUrls = (summary: ExamSummary): string[] => {
    if (summary.file_urls && summary.file_urls.length > 0) return summary.file_urls;
    if (summary.file_url) return [summary.file_url];
    return [];
  };

  const openLightbox = (imgs: string[], idx: number) => {
    setLightboxImgs(imgs);
    setLightboxIdx(idx);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Switcher Pill Capsule (Exact user reference design) */}
        <div className="inline-flex items-center bg-[#edf2f7] p-1.5 rounded-full border border-slate-200/60 shadow-2xs">
          <button
            onClick={() => setActiveTab('topics')}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === 'topics'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เนื้อหาออกสอบ ({topics.length})
          </button>
          <button
            onClick={() => setActiveTab('summaries')}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === 'summaries'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            สรุปสอบปลายภาค ({summaries.length})
          </button>
        </div>

        <span className="text-xs font-medium text-slate-400">
          ม.2/3 • โหมดอ่านอย่างเดียว
        </span>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TAB: EXAM TOPICS (100% Identical to /exam-topics)          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'topics' && (
        <div className="space-y-6">
          {/* Hero Section (Exact student code from ExamTopicsClient.tsx) */}
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden ring-1 ring-white/20">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-fuchsia-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex bg-white/20 text-white p-4 rounded-2xl mb-6 backdrop-blur-md shadow-inner shadow-white/20 ring-1 ring-white/30">
                  <GraduationCap size={48} strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-100 mb-6 drop-shadow-sm leading-tight">
                  เนื้อหาออกสอบ<br className="hidden md:block" />ปลายภาค 1/69
                </h1>
                <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 mb-8 font-medium leading-relaxed">
                  รวมหัวข้อสำคัญที่ต้องอ่านเตรียมสอบ ครบทุกวิชา ให้คุณพร้อมสู้ศึกปลายภาคได้อย่างมั่นใจ
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 flex flex-col items-center w-full max-w-sm shrink-0 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)]">
                <div className="bg-indigo-500/50 p-3 rounded-full mb-4">
                  <Calendar size={28} className="text-white" />
                </div>
                <h2 className="font-semibold text-xl text-rose-100 mb-3 text-center">นับถอยหลังวันสอบ</h2>
                <div className="text-3xl md:text-4xl font-bold text-white tracking-widest drop-shadow-md">
                  <Countdown date={finalExamDate} />
                </div>
              </div>
            </div>
          </div>

          {/* Info Alert (Exact student code) */}
          <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 rounded-3xl p-5 flex gap-4 text-amber-800 shadow-sm">
            <div className="bg-amber-100 p-2 rounded-full shrink-0 h-fit mt-0.5">
              <AlertCircle size={22} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 text-amber-900">ข้อมูลอาจมีการเปลี่ยนแปลง</h3>
              <p className="text-amber-700 font-medium">เนื้อหาออกสอบนี้เป็นการรวบรวมเบื้องต้น โปรดตรวจสอบกับคุณครูประจำวิชาอีกครั้งเพื่อความชัวร์ที่สุดครับ</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาขอบเขตเนื้อหา, วิชา, ครูผู้สอน..."
                className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-slate-700 placeholder:text-slate-400"
              />
            </div>

            <div className="relative w-full sm:w-64">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full appearance-none bg-white rounded-2xl border border-slate-200 px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 shadow-sm cursor-pointer"
              >
                <option value="">วิชาทั้งหมด</option>
                {subjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Topics List (Exact student card markup from ExamTopicsClient.tsx) */}
          {filteredTopics.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100 shadow-xl shadow-slate-200/30">
              <div className="bg-slate-50 text-slate-300 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">ยังไม่มีข้อมูลเนื้อหาสอบ</h3>
              <p className="text-slate-500 text-lg">รอคุณครูประจำวิชาแจ้งหัวข้อสอบนะ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {filteredTopics.map((item) => (
                <div key={item.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-indigo-200/50 transition-all duration-300 p-6 md:p-8 group relative overflow-hidden flex flex-col h-full hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>

                  <div className="relative z-10 flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors mb-2">
                        {item.subject}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full inline-block">ครูผู้สอน: {item.teacher}</p>
                        <p className="text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full inline-block">เทอม: {item.term || '1/69'}</p>
                      </div>
                    </div>
                    <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                      <BookOpen size={24} />
                    </div>
                  </div>

                  {/* Exam format counts */}
                  {((item.mcq_count ?? 0) > 0 || (item.essay_count ?? 0) > 0) && (
                    <div className="relative z-10 flex flex-wrap gap-3 mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      {(item.mcq_count ?? 0) > 0 && (
                        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100/50 px-4 py-2 rounded-xl font-bold flex-1 justify-center border border-emerald-100">
                          <CheckCircle2 size={18} />
                          ปรนัย {item.mcq_count} ข้อ
                        </div>
                      )}
                      {(item.essay_count ?? 0) > 0 && (
                        <div className="flex items-center gap-2 text-amber-700 bg-amber-100/50 px-4 py-2 rounded-xl font-bold flex-1 justify-center border border-amber-100">
                          <FileEdit size={18} />
                          อัตนัย {item.essay_count} ข้อ
                        </div>
                      )}
                    </div>
                  )}

                  <div className="relative z-10 mt-auto bg-indigo-50/50 rounded-2xl p-5 border border-indigo-50 flex-1">
                    <h4 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                      หัวข้อที่ออกสอบ:
                    </h4>
                    <div className="prose prose-sm prose-slate max-w-none text-slate-700 font-medium prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                      {(item.topics || []).length > 1 || ((item.topics || [])[0] && typeof (item.topics || [])[0] === 'string' && !(item.topics || [])[0].includes('<')) ? (
                        <ul className="space-y-3 list-none pl-0">
                          {(item.topics || []).map((topic, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm font-medium leading-relaxed">
                              <span className="text-indigo-400 font-bold mt-0.5 select-none">→</span>
                              <span>{String(topic)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: item.sanitizedHtml || '' }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. TAB: EXAM SUMMARIES (100% Identical to /summaries)         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'summaries' && (
        <div className="space-y-6">
          {/* Hero Section (Exact student code from src/app/summaries/page.tsx) */}
          <div className="bg-gradient-to-br from-rose-600 via-pink-600 to-orange-500 rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden ring-1 ring-white/20">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-orange-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex bg-white/20 text-white p-4 rounded-2xl mb-6 backdrop-blur-md shadow-inner shadow-white/20 ring-1 ring-white/30">
                  <BookOpen size={48} strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-rose-100 mb-6 drop-shadow-sm leading-tight">
                  คลังสรุปสอบ<br className="hidden md:block" />ปลายภาค 1/69
                </h1>
                <p className="text-rose-100 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 mb-8 font-medium leading-relaxed">
                  จุดรวมสรุปเนื้อหาสอบปลายภาค อ่านฟรี โหลดฟรี เพื่อห้อง 3 ทุกท่าน และผู้ปกครองที่รัก
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 flex flex-col items-center w-full max-w-sm shrink-0 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)]">
                <div className="bg-rose-500/50 p-3 rounded-full mb-4">
                  <Clock size={28} className="text-white" />
                </div>
                <h2 className="font-semibold text-xl text-rose-100 mb-3 text-center">นับถอยหลังวันสอบ</h2>
                <div className="text-3xl md:text-4xl font-bold text-white tracking-widest drop-shadow-md">
                  <Countdown date={finalExamDate} />
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อชีท, วิชา, ผู้สรุป..."
                className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm text-slate-700 placeholder:text-slate-400"
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

          {/* Summaries Grid (Exact student card markup from /summaries) */}
          {filteredSummaries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="bg-slate-50 text-slate-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">ยังไม่มีสรุปสอบเลย</h3>
              <p className="text-slate-500">รอเพื่อนๆ มาแชร์ชีทสรุปกันก่อนนะ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSummaries.map((summary) => {
                const isLink = summary.attachment_type === 'link';
                const urls = getUrls(summary);
                const pdfUrls = urls.filter(u => getFileType(u) === 'pdf');
                const imageUrls = isLink ? [] : urls.filter(u => getFileType(u) === 'image');
                const firstUrl = isLink ? (summary.link_url || summary.file_url) : urls[0];

                return (
                  <div key={summary.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-rose-100/50 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>

                    {/* Open link icon */}
                    {firstUrl && (
                      <a
                        href={firstUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 bg-white/80 hover:bg-white p-2 rounded-full backdrop-blur-sm transition-all z-10 shadow-sm"
                        title="เปิดไฟล์"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}

                    {/* Image thumbnails */}
                    {imageUrls.length > 0 && (
                      <div className={`grid ${imageUrls.length === 1 ? 'grid-cols-1' : imageUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-0.5 rounded-t-2xl overflow-hidden`}>
                        {imageUrls.slice(0, 3).map((url, i) => (
                          <div key={i} className="relative aspect-[4/3] cursor-pointer overflow-hidden" onClick={() => openLightbox(imageUrls, i)}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
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

                    {/* Link type indicator */}
                    {isLink && (
                      <div className="bg-blue-50 rounded-t-2xl p-6 flex items-center justify-center">
                        <LinkIcon className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
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
                          {normalizeSubject(summary.subject)}
                        </span>
                        <span className="bg-sky-50 text-sky-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                          เทอม {summary.term || '1/69'}
                        </span>
                        {summary.uploader_name && (
                          <span className="bg-indigo-50 text-indigo-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <User size={10} /> By {summary.uploader_name}
                          </span>
                        )}
                        {isLink && (
                          <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <LinkIcon size={10} /> ลิงก์
                          </span>
                        )}
                        {pdfUrls.length > 0 && (
                          <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <FileText size={12} /> PDF
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {summary.description && (
                        <p className="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {summary.description}
                        </p>
                      )}

                      {/* Footer Info */}
                      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {timeAgo(summary.created_at)}
                        </span>

                        {firstUrl && (
                          <a
                            href={firstUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-rose-500 font-semibold hover:underline"
                          >
                            <Download size={13} />
                            {isLink ? 'เปิดลิงก์' : 'ดาวน์โหลด'}
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
      )}

      {/* Lightbox Modal (Exact student code) */}
      {lightboxImgs.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setLightboxImgs([])}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={lightboxImgs[lightboxIdx]} 
              alt="Full Preview" 
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
            <button 
              onClick={() => setLightboxImgs([])}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2.5 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            {lightboxImgs.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIdx((lightboxIdx - 1 + lightboxImgs.length) % lightboxImgs.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setLightboxIdx((lightboxIdx + 1) % lightboxImgs.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
