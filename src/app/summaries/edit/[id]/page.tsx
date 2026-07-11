'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ArrowLeft, Upload, X, Image as ImageIcon, FileText, Link as LinkIcon, FileUp, ChevronDown, User, Edit } from 'lucide-react';

type SelectedFile = {
  file: File;
  preview?: string;
};

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

export default function EditSummaryPage() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentType, setAttachmentType] = useState<'file' | 'link'>('file');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  
  // For files, we might have existing files and new files.
  // To keep it simple, we don't allow modifying existing files easily without re-uploading,
  // or we just show them and let them add more. Let's just allow editing text and link.
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const router = useRouter();
  const params = useParams();
  const summaryId = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    const fetchSummary = async () => {
      setInitialLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('กรุณาล็อกอินก่อน');
        router.push('/login?redirect=/summaries');
        return;
      }

      const { data, error } = await supabase
        .from('exam_summaries')
        .select('*')
        .eq('id', summaryId)
        .single();

      if (error || !data) {
        toast.error('ไม่พบข้อมูลสรุปสอบ');
        router.push('/summaries');
        return;
      }

      if (data.uploader_id !== user.id) {
        // Now everyone can edit, so we don't block them, but you can add a toast notification if needed.
        // toast('คุณกำลังแก้ไขสรุปสอบของคนอื่น', { icon: 'ℹ️' });
      }

      setTitle(data.title);
      if (SUBJECT_LIST.find(s => s.value === data.subject)) {
        setSubject(data.subject);
      } else {
        setSubject('อื่นๆ');
        setCustomSubject(data.subject);
      }
      setUploaderName(data.uploader_name || '');
      setDescription(data.description || '');
      setAttachmentType(data.attachment_type || 'file');
      setLinkUrl(data.link_url || data.file_url || '');
      
      setInitialLoading(false);
    };
    
    if (summaryId) fetchSummary();
  }, [summaryId, supabase, router]);

  const validateLink = (url: string) => {
    if (!url.trim()) {
      setLinkError('');
      return true;
    }
    // Block Instagram links
    if (/instagram\.com/i.test(url)) {
      setLinkError('ไม่สามารถแปะลิงก์ Instagram ได้ กรุณาใช้ลิงก์อื่น เช่น Google Drive, OneDrive');
      return false;
    }
    // Basic URL validation
    try {
      new URL(url);
      setLinkError('');
      return true;
    } catch {
      setLinkError('กรุณาใส่ URL ที่ถูกต้อง (เช่น https://drive.google.com/...)');
      return false;
    }
  };

  const handleLinkChange = (url: string) => {
    setLinkUrl(url);
    validateLink(url);
  };

  const getSubjectValue = () => {
    if (subject === 'อื่นๆ') return customSubject.trim();
    return subject;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const subjectValue = getSubjectValue();
    if (!title.trim() || !subjectValue) {
      toast.error('กรุณากรอกชื่อสรุปและเลือกวิชา');
      return;
    }

    if (attachmentType === 'link') {
      if (!linkUrl.trim()) {
        toast.error('กรุณาใส่ลิงก์');
        return;
      }
      if (!validateLink(linkUrl)) {
        return;
      }
    }

    setLoading(true);
    const toastId = toast.loading('กำลังบันทึก...');

    try {
      const updateData: any = {
        title: title.trim(),
        subject: subjectValue,
        description: description.trim(),
        uploader_name: uploaderName.trim() || null,
      };

      if (attachmentType === 'link') {
        updateData.link_url = linkUrl.trim();
        updateData.file_url = linkUrl.trim(); // Keep backwards compatibility
      }

      const { error: dbError } = await supabase
        .from('exam_summaries')
        .update(updateData)
        .eq('id', summaryId);

      if (dbError) throw dbError;

      toast.success('อัปเดตสรุปสอบสำเร็จ! 🎉', { id: toastId });
      router.push('/summaries');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการอัปเดต', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <motion.main 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-50 p-4 md:p-8"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Edit className="text-rose-500" />
              แก้ไขสรุปสอบ
            </h1>
            <p className="text-slate-500 mt-1">อัปเดตข้อมูลสรุปสอบของคุณ</p>
          </div>
          <Link
            href="/summaries"
            className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200"
          >
            <ArrowLeft size={16} />
            กลับ
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                ชื่อสรุป <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                placeholder="เช่น สรุปสูตรคณิต, ไฟล์ติวสังคม"
                required
              />
            </div>

            {/* Subject Dropdown */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                วิชา <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all pr-10 cursor-pointer bg-white"
                  required
                >
                  <option value="">-- เลือกวิชา --</option>
                  {SUBJECT_LIST.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                  <option value="อื่นๆ">อื่นๆ (โปรดระบุ)</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {subject === 'อื่นๆ' && (
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all mt-3"
                  placeholder="พิมพ์ชื่อวิชาเอง..."
                  required
                />
              )}
            </div>

            {/* By (Uploader Name) */}
            <div>
              <label htmlFor="uploaderName" className="block text-sm font-medium text-slate-700 mb-2">
                <User size={14} className="inline mr-1" />
                By (ผู้สรุป)
              </label>
              <input
                type="text"
                id="uploaderName"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                placeholder="เช่น พริม, บุ้งกี๋, ..."
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                รายละเอียดเพิ่มเติม
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                placeholder="บอกเพื่อนหน่อยว่าสรุปนี้มีเนื้อหาเกี่ยวกับอะไรบ้าง..."
              />
            </div>

            {/* Link Section (only editable if it was a link, or we just let them edit link if it is one) */}
            {attachmentType === 'link' && (
              <div>
                <label htmlFor="linkUrl" className="block text-sm font-medium text-slate-700 mb-2">
                  ลิงก์ (URL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  id="linkUrl"
                  value={linkUrl}
                  onChange={(e) => handleLinkChange(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 transition-all ${
                    linkError
                      ? 'border-red-300 focus:ring-red-400'
                      : 'border-slate-200 focus:ring-rose-500'
                  }`}
                  placeholder="https://drive.google.com/file/d/..."
                />
                {linkError && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    ⚠️ {linkError}
                  </p>
                )}
                <p className="text-slate-400 text-xs mt-2">
                  💡 รองรับ Google Drive, OneDrive, Dropbox ฯลฯ (ไม่รองรับลิงก์ Instagram)
                </p>
              </div>
            )}

            {/* If it's a file, show a message that files cannot be changed here, only text */}
            {attachmentType === 'file' && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-700 text-sm flex gap-3 items-start">
                <FileText className="shrink-0 mt-0.5" size={18} />
                <p>การแก้ไขไฟล์แนบโดยตรงยังไม่รองรับในขณะนี้ คุณสามารถแก้ไขได้เฉพาะชื่อวิชาและคำอธิบายเท่านั้น</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !title || (!subject || (subject === 'อื่นๆ' && !customSubject)) || (attachmentType === 'link' && (!linkUrl || !!linkError))}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Edit size={20} />
                  บันทึกการแก้ไข
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.main>
  );
}
