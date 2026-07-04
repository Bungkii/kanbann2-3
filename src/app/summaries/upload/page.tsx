'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { BookOpen, ArrowLeft, Upload, X, Image as ImageIcon, FileText, Link as LinkIcon, FileUp, ChevronDown, User } from 'lucide-react';

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
  { label: 'ศิลปะ', value: 'ศิลปะ' },
  { label: 'สุขศึกษา', value: 'สุขศึกษา' },
  { label: 'การงานอาชีพ', value: 'การงานอาชีพ' },
  { label: 'เทคโนโลยี', value: 'เทคโนโลยี' },
];

export default function UploadSummaryPage() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentType, setAttachmentType] = useState<'file' | 'link'>('file');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('คุณต้องล็อกอินก่อนถึงจะแชร์สรุปสอบได้');
        router.push('/login?redirect=/summaries/upload');
      }
    };
    checkAuth();
  }, [supabase.auth, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: SelectedFile[] = [];

    Array.from(files).forEach(file => {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`ไฟล์ ${file.name} ใหญ่เกินไป (จำกัด 20MB)`);
        return;
      }

      const entry: SelectedFile = { file };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedFiles(prev => prev.map(f =>
            f.file === file ? { ...f, preview: reader.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(entry);
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isPdf = (file: File) => file.type === 'application/pdf' || file.name.endsWith('.pdf');

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

    if (attachmentType === 'file' && selectedFiles.length === 0) {
      toast.error('กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์');
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('กรุณาล็อกอินก่อน');

      if (attachmentType === 'file') {
        // Upload files
        const uploadedUrls: string[] = [];

        for (let i = 0; i < selectedFiles.length; i++) {
          const { file } = selectedFiles[i];
          toast.loading(`กำลังอัปโหลด ${i + 1}/${selectedFiles.length}...`, { id: toastId });

          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('exam-summaries')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('exam-summaries')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
        }

        const { error: dbError } = await supabase
          .from('exam_summaries')
          .insert({
            title: title.trim(),
            subject: subjectValue,
            description: description.trim(),
            file_url: uploadedUrls[0] || '',
            file_urls: uploadedUrls,
            uploader_id: user.id,
            uploader_name: uploaderName.trim() || null,
            attachment_type: 'file',
          });

        if (dbError) throw dbError;
      } else {
        // Link mode
        const { error: dbError } = await supabase
          .from('exam_summaries')
          .insert({
            title: title.trim(),
            subject: subjectValue,
            description: description.trim(),
            file_url: linkUrl.trim(),
            file_urls: [],
            uploader_id: user.id,
            uploader_name: uploaderName.trim() || null,
            attachment_type: 'link',
            link_url: linkUrl.trim(),
          });

        if (dbError) throw dbError;
      }

      toast.success('อัปโหลดสรุปสอบสำเร็จ! 🎉', { id: toastId });
      router.push('/summaries');
      router.refresh();
    } catch (error: any) {
      console.error('Error uploading:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการอัปโหลด', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Upload className="text-rose-500" />
              อัปโหลดสรุปสอบ
            </h1>
            <p className="text-slate-500 mt-1">แบ่งปันความรู้ให้เพื่อนๆ เตรียมตัวสอบกลางภาค</p>
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
                  <option value="อื่นๆ">อื่นๆ</option>
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

            {/* Attachment Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                ประเภทไฟล์แนบ <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2 bg-slate-100 rounded-2xl p-1.5">
                <button
                  type="button"
                  onClick={() => setAttachmentType('file')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                    attachmentType === 'file'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileUp size={18} />
                  แนบไฟล์
                </button>
                <button
                  type="button"
                  onClick={() => setAttachmentType('link')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                    attachmentType === 'link'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LinkIcon size={18} />
                  แนบลิงก์
                </button>
              </div>
            </div>

            {/* File Upload Section */}
            {attachmentType === 'file' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ไฟล์สรุป (PDF + รูปภาพ หลายไฟล์ได้) <span className="text-rose-500">*</span>
                </label>

                {selectedFiles.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {selectedFiles.map((sf, index) => (
                      <div key={index} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {sf.preview ? (
                            <img src={sf.preview} alt="Preview" className="w-12 h-12 object-cover rounded-lg shrink-0" />
                          ) : (
                            <div className="bg-rose-100 text-rose-600 p-2.5 rounded-xl shrink-0">
                              {isPdf(sf.file) ? <FileText size={20} /> : <ImageIcon size={20} />}
                            </div>
                          )}
                          <div className="truncate">
                            <p className="text-slate-800 font-medium truncate text-sm">{sf.file.name}</p>
                            <p className="text-slate-400 text-xs">{(sf.file.size / (1024 * 1024)).toFixed(2)} MB • {isPdf(sf.file) ? 'PDF' : 'รูปภาพ'}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-full transition-colors shrink-0"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-50 hover:border-rose-400 transition-all group"
                >
                  <div className="bg-rose-50 text-rose-500 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <BookOpen size={28} />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">
                    {selectedFiles.length > 0 ? 'คลิกเพื่อเพิ่มไฟล์' : 'คลิกเพื่อเลือกไฟล์'}
                  </p>
                  <p className="text-slate-400 text-sm">รองรับ .pdf, .jpg, .png (สูงสุด 20MB ต่อไฟล์ • เลือกได้หลายไฟล์)</p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                />
              </div>
            )}

            {/* Link Section */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !title || (!subject || (subject === 'อื่นๆ' && !customSubject)) || (attachmentType === 'file' && selectedFiles.length === 0) || (attachmentType === 'link' && (!linkUrl || !!linkError))}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังอัปโหลด...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  {attachmentType === 'file'
                    ? `ยืนยันการแชร์สรุป (${selectedFiles.length} ไฟล์)`
                    : 'ยืนยันการแชร์ลิงก์'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
