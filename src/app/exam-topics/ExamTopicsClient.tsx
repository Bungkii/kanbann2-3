'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, BookOpen, AlertCircle, Calendar, Edit, CheckCircle2, FileEdit, GraduationCap, Plus, Trash2, X, Save, Layers, ChevronDown } from 'lucide-react';
import Countdown from '@/components/Countdown';
import { addExamTopic, updateExamTopic, deleteExamTopic, ExamTopic } from './actions';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-48 w-full bg-slate-50 animate-pulse rounded-2xl border border-slate-200"></div>
});

const SUBJECT_LIST = [
  { label: 'คณิตศาสตร์', value: 'คณิตศาสตร์' },
  { label: 'วิทยาศาสตร์', value: 'วิทยาศาสตร์' },
  { label: 'ภาษาไทย', value: 'ภาษาไทย' },
  { label: 'ภาษาอังกฤษ', value: 'ภาษาอังกฤษ' },
  { label: 'สังคมศึกษา', value: 'สังคมศึกษา' },
  { label: 'ประวัติศาสตร์', value: 'ประวัติศาสตร์' },
  { label: 'STEM ACTIVITY', value: 'STEM ACTIVITY' },
  { label: 'General Science', value: 'General Science' },
  { label: 'General Math', value: 'General Math' },
];

type SanitizedExamTopic = ExamTopic & { sanitizedHtml: string | null };

export default function ExamTopicsClient({ topics: initialTopics, isLoggedIn }: { topics: SanitizedExamTopic[], isLoggedIn: boolean }) {
  const [topics, setTopics] = useState(initialTopics);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    subject: '',
    teacher: '',
    topicsStr: '',
    mcqCount: 0,
    essayCount: 0,
  });

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const openAddNew = () => {
    setFormData({ subject: '', teacher: '', topicsStr: '', mcqCount: 0, essayCount: 0 });
    setErrorMsg('');
    setEditingId('new');
    setDrawerOpen(true);
  };

  const openEdit = (topic: ExamTopic) => {
    let topicsStr = '';
    if (topic.topics && topic.topics.length > 0) {
      if (topic.topics.length === 1 && topic.topics[0].includes('<')) {
        topicsStr = topic.topics[0];
      } else {
        topicsStr = `<ul>${topic.topics.map(t => `<li>${t}</li>`).join('')}</ul>`;
      }
    }
    setFormData({
      subject: topic.subject,
      teacher: topic.teacher,
      topicsStr,
      mcqCount: topic.mcq_count || 0,
      essayCount: topic.essay_count || 0,
    });
    setErrorMsg('');
    setEditingId(topic.id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setEditingId(null);
      setErrorMsg('');
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const fd = new FormData();
    fd.append('subject', formData.subject);
    fd.append('teacher', formData.teacher);
    fd.append('topics', formData.topicsStr);
    fd.append('mcq_count', formData.mcqCount.toString());
    fd.append('essay_count', formData.essayCount.toString());

    let res;
    if (editingId === 'new') {
      res = await addExamTopic(fd);
    } else if (editingId) {
      res = await updateExamTopic(editingId, fd);
    }

    if (res?.success) {
      closeDrawer();
      window.location.reload();
    } else {
      setErrorMsg(res?.error || 'เกิดข้อผิดพลาด');
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันที่จะลบเนื้อหาสอบนี้?')) return;
    const res = await deleteExamTopic(id);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error || 'ลบไม่สำเร็จ');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200 w-fit font-medium hover:shadow-md"
          >
            <ArrowLeft size={18} />
            กลับหน้าหลัก
          </Link>
          {isLoggedIn && (
            <button
              onClick={openAddNew}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-full shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 hover:shadow-indigo-600/40 hover:-translate-y-0.5 w-fit self-end sm:self-auto cursor-pointer"
            >
              <Plus size={18} />
              เพิ่มเนื้อหาสอบ
            </button>
          )}
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden ring-1 ring-white/20">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-fuchsia-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex bg-white/20 text-white p-4 rounded-2xl mb-6 backdrop-blur-md shadow-inner shadow-white/20 ring-1 ring-white/30">
                <GraduationCap size={48} strokeWidth={1.5} />
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-100 mb-6 drop-shadow-sm leading-tight">
                เนื้อหาออกสอบ<br className="hidden md:block" />กลางภาค 1/69
              </h1>
              <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 mb-8 font-medium leading-relaxed">
                รวมหัวข้อสำคัญที่ต้องอ่านเตรียมสอบ ครบทุกวิชา ให้คุณพร้อมสู้ศึกกลางภาคได้อย่างมั่นใจ
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 flex flex-col items-center w-full max-w-sm shrink-0 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)]">
              <div className="bg-indigo-500/50 p-3 rounded-full mb-4">
                <Calendar size={28} className="text-white" />
              </div>
              <h2 className="font-semibold text-xl text-indigo-100 mb-3 text-center">นับถอยหลังวันสอบ</h2>
              <div className="text-3xl md:text-4xl font-bold text-white tracking-widest drop-shadow-md">
                <Countdown date="2026-07-13T00:00:00+07:00" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 rounded-3xl p-5 flex gap-4 text-amber-800 shadow-sm">
          <div className="bg-amber-100 p-2 rounded-full shrink-0 h-fit mt-0.5">
            <AlertCircle size={22} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1 text-amber-900">ข้อมูลอาจมีการเปลี่ยนแปลง</h3>
            <p className="text-amber-700 font-medium">เนื้อหาออกสอบนี้เป็นการรวบรวมเบื้องต้น โปรดตรวจสอบกับคุณครูประจำวิชาอีกครั้งเพื่อความชัวร์ที่สุดครับ</p>
          </div>
        </div>

        {/* Topics List */}
        {topics.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100 shadow-xl shadow-slate-200/30">
            <div className="bg-slate-50 text-slate-300 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">ยังไม่มีข้อมูลเนื้อหาสอบ</h3>
            <p className="text-slate-500 text-lg">
              รอคนมาเพิ่มข้อมูลเนื้อหาออกสอบกันก่อนนะ
            </p>
            {isLoggedIn && (
              <button
                onClick={openAddNew}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-full shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus size={20} />
                เพิ่มวิชาสอบตอนนี้เลย
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {topics.map((item) => (
              <div key={item.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-indigo-200/50 transition-all duration-300 p-6 md:p-8 group relative overflow-hidden flex flex-col h-full hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>
                
                <div className="relative z-10 flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors mb-2">
                      {item.subject}
                    </h3>
                    <p className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full inline-block">ครูผู้สอน: {item.teacher}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isLoggedIn && (
                      <>
                        <button
                          onClick={() => openEdit(item)}
                          className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors duration-200 shadow-sm cursor-pointer"
                          title="แก้ไข"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-rose-50 text-rose-500 p-2.5 rounded-xl hover:bg-rose-600 hover:text-white transition-colors duration-200 shadow-sm cursor-pointer"
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                    {!isLoggedIn && (
                      <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <BookOpen size={24} />
                      </div>
                    )}
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

      {/* ===== DRAWER OVERLAY ===== */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${drawerOpen ? 'visible' : 'invisible'}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeDrawer}
        />
        
        {/* Drawer Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl transition-transform duration-300 ease-out overflow-y-auto ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Drawer Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-5 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-3 text-indigo-900">
              <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                {editingId === 'new' ? <Plus size={20} /> : <Edit size={20} />}
              </span>
              {editingId === 'new' ? 'เพิ่มวิชาสอบใหม่' : 'แก้ไขวิชาสอบ'}
            </h2>
            <button onClick={closeDrawer} className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
              <X size={22} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="px-6 py-6">
            {errorMsg && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-medium border border-rose-100 flex items-center gap-2">
                <X size={16} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อวิชา</label>
                <div className="relative">
                  <select
                    required={(!SUBJECT_LIST.some(s => s.value === formData.subject) && formData.subject !== '') ? false : true}
                    value={(!SUBJECT_LIST.some(s => s.value === formData.subject) && formData.subject !== '') ? 'อื่นๆ' : formData.subject}
                    onChange={(e) => {
                      if (e.target.value === 'อื่นๆ') {
                        setFormData({...formData, subject: ' '});
                      } else {
                        setFormData({...formData, subject: e.target.value});
                      }
                    }}
                    className="w-full appearance-none bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium pr-10 cursor-pointer"
                  >
                    <option value="">-- เลือกวิชา --</option>
                    {SUBJECT_LIST.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                    <option value="อื่นๆ">อื่นๆ (โปรดระบุ)</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {(!SUBJECT_LIST.some(s => s.value === formData.subject) && formData.subject !== '') && (
                  <input 
                    type="text" 
                    required 
                    value={formData.subject.trim()}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium mt-3"
                    placeholder="พิมพ์ชื่อวิชาเอง..."
                  />
                )}
              </div>

              {/* Teacher */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ครูผู้สอน</label>
                <input 
                  type="text" 
                  required 
                  value={formData.teacher}
                  onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  placeholder="เช่น มิสเสาวลักษณ์"
                />
              </div>

              {/* MCQ & Essay counts */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    ปรนัย (กี่ข้อ)
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.mcqCount}
                    onChange={(e) => setFormData({...formData, mcqCount: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <FileEdit size={16} className="text-amber-500" />
                    อัตนัย (กี่ข้อ)
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.essayCount}
                    onChange={(e) => setFormData({...formData, essayCount: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Topics (Rich Text) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Layers size={16} className="text-indigo-500" />
                  หัวข้อที่ออกสอบ
                </label>
                <RichTextEditor 
                  value={formData.topicsStr}
                  onChange={(value) => setFormData({...formData, topicsStr: value})}
                  placeholder="เช่น การแยกตัวประกอบ, ทฤษฎีบทพีทาโกรัส..."
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={closeDrawer}
                  className="flex-1 px-6 py-3.5 rounded-2xl font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3.5 rounded-2xl font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : <><Save size={20} /> บันทึก</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
