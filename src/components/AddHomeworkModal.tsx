'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AddHomeworkModal({ onClose }: { onClose: () => void }) {
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

      toast.loading('กำลังเพิ่มการบ้าน...', { id: toastId });
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

      toast.success('เพิ่มการบ้านสำเร็จ!', { id: toastId });
      onClose();
      router.refresh();
    } catch (error: any) {
      console.error('Error adding homework:', error);
      toast.error(`เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถเพิ่มการบ้านได้'}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-slate-100">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          บันทึกงานใหม่กันลืม
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อวิชา (Subject) *</label>
              <input required name="subject" placeholder="เช่น คณิตศาสตร์, วิทยาศาสตร์" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">กำหนดเสร็จ (Due Date) *</label>
              <input required type="date" name="due_date" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">ครูผู้สั่ง (Teacher)</label>
              <input name="teacher_name" placeholder="ชื่อครู" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">รายละเอียดงาน (Details) *</label>
            <textarea required name="details" rows={3} placeholder="อธิบายรายละเอียดการบ้าน..." className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm resize-none" />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">รูปภาพประกอบ (แนบรูป)</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-4 transition-colors text-center cursor-pointer ${imagePreview ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                    <span className="text-white font-medium">เปลี่ยนรูปภาพ</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mb-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  <span className="text-sm text-slate-500">คลิกเพื่ออัปโหลดรูปภาพ</span>
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
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              disabled={loading}
              type="submit" 
              className="bg-indigo-600 text-white rounded-xl px-6 py-2.5 font-medium hover:bg-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  กำลังบันทึก...
                </>
              ) : 'บันทึกลงระบบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
