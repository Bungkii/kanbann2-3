'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AddTaskPage() {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const subject = formData.get('subject') as string;
    const dueDate = formData.get('due_date') as string;
    const details = formData.get('details') as string;
    const teacherName = formData.get('teacher_name') as string;
    const imageFile = formData.get('image') as File | null;

    let imageUrl = null;

    const toastId = toast.loading('กำลังบันทึกข้อมูล...');

    try {
      if (imageFile && imageFile.size > 0) {
        toast.loading('กำลังอัปโหลดรูปภาพ...', { id: toastId });
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('homework-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('homework-images')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      toast.loading('กำลังบันทึกลงระบบ...', { id: toastId });
      const { error: insertError } = await supabase
        .from('homework_tasks')
        .insert([{
          subject,
          due_date: new Date(dueDate).toISOString(),
          details,
          teacher_name: teacherName || null,
          image_url: imageUrl,
          status: 'todo'
        }]);

      if (insertError) throw insertError;

      toast.success('บันทึกงานสำเร็จ! จะแสดงในบอร์ดให้เพื่อนเห็นทันที', { id: toastId });
      // Clear form implicitly by redirecting
      router.push('/kanban');
      router.refresh();
    } catch (error: any) {
      console.error('Error adding homework:', error);
      toast.error(`เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถบันทึกงานได้'}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-start">
      <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-xl border border-slate-100 relative">
        <Link 
          href="/"
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
          title="กลับหน้าแรก"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h2 className="text-3xl font-bold mb-2 text-slate-800 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          บันทึกงานใหม่ (ม.2/3)
        </h2>
        <p className="text-slate-500 text-center flex items-center justify-center gap-1 mb-8">
          จดไว้นะ (จะขึ้นบอร์ดให้เพื่อนเห็นเพื่อเช็คงานด้วยกัน
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          )
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อวิชา (Subject) *</label>
              <input required name="subject" placeholder="เช่น คณิตศาสตร์, วิทยาศาสตร์" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">กำหนดเสร็จ (Due Date) *</label>
              <input required type="date" name="due_date" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">ครูผู้สั่ง (Teacher)</label>
              <input name="teacher_name" placeholder="ชื่อครู" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">รายละเอียดงาน (Details) *</label>
            <textarea required name="details" rows={4} placeholder="อธิบายรายละเอียดให้เพื่อนๆ เข้าใจ..." className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm resize-none" />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">รูปภาพประกอบ (สำหรับคนลอก)</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-6 transition-colors text-center cursor-pointer ${imagePreview ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-60 mx-auto rounded-lg object-contain" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                    <span className="text-white font-medium">คลิกเพื่อเปลี่ยนรูปภาพ</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mb-3"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  <span className="text-slate-500 font-medium mb-1">คลิกเพื่ออัปโหลดรูปภาพ</span>
                  <span className="text-xs text-slate-400">รองรับไฟล์ JPG, PNG</span>
                </div>
              )}
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              name="image" 
              accept="image/*" 
              onChange={handleImageChange}
              className="hidden" 
            />
          </div>
          
          <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-slate-100">
            <Link 
              href="/"
              className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center"
            >
              ยกเลิก
            </Link>
            <button 
              disabled={loading}
              type="submit" 
              className="bg-indigo-600 text-white rounded-xl px-8 py-3 font-semibold hover:bg-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  กำลังส่งข้อมูล...
                </>
              ) : 'บันทึกลงระบบ'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
