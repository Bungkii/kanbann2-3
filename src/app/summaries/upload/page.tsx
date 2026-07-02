'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { BookOpen, ArrowLeft, Upload, File as FileIcon, X, Image as ImageIcon, FileText } from 'lucide-react';

type SelectedFile = {
  file: File;
  preview?: string; // data URL for image preview
};

export default function UploadSummaryPage() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Auth
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
    
    // Reset input so same file can be added again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isPdf = (file: File) => file.type === 'application/pdf' || file.name.endsWith('.pdf');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || selectedFiles.length === 0) {
      toast.error('กรุณากรอกข้อมูลให้ครบและเลือกไฟล์อย่างน้อย 1 ไฟล์');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('กำลังอัปโหลดไฟล์...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('กรุณาล็อกอินก่อน');

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

      // Save to DB with file_urls array
      const { error: dbError } = await supabase
        .from('exam_summaries')
        .insert({
          title: title.trim(),
          subject: subject.trim(),
          description: description.trim(),
          file_url: uploadedUrls[0] || '', // backwards compat
          file_urls: uploadedUrls,
          uploader_id: user.id
        });

      if (dbError) throw dbError;

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
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                ชื่อสรุป (เช่น สรุปสูตรคณิต, ไฟล์ติวสังคม) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                placeholder="ชื่อเรียกสั้นๆ ให้เพื่อนเข้าใจง่าย"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                วิชา <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                placeholder="เช่น คณิตศาสตร์, ฟิสิกส์, ประวัติศาสตร์"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                รายละเอียดเพิ่มเติม (เนื้อหาในสรุป, ออกสอบเรื่องอะไรบ้าง)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                placeholder="บอกเพื่อนหน่อยว่าสรุปนี้มีเนื้อหาเกี่ยวกับอะไรบ้าง..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ไฟล์สรุป (รองรับ PDF + รูปภาพ หลายไฟล์) <span className="text-rose-500">*</span>
              </label>
              
              {/* File list */}
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

              {/* Upload area */}
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

            <button
              type="submit"
              disabled={loading || !title || !subject || selectedFiles.length === 0}
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
                  ยืนยันการแชร์สรุป ({selectedFiles.length} ไฟล์)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
