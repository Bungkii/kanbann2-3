'use client';

import { useState, useRef } from 'react';
import { addCandidate } from './actions';
import toast from 'react-hot-toast';
import { Upload, Plus, Image as ImageIcon } from 'lucide-react';

export default function CandidateForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
        e.target.value = '';
        return;
      }
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const toastId = toast.loading('กำลังเพิ่มผู้สมัคร...');
    
    try {
      const result = await addCandidate(formData);
      
      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success('เพิ่มผู้สมัครสำเร็จ!', { id: toastId });
        formRef.current?.reset();
        setPreviewUrl(null);
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
          ชื่อผู้สมัคร <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          placeholder="เช่น พริม, เฟิส, งดออกเสียง"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          รูปภาพประจำตัว (ไม่บังคับ)
        </label>
        <div className="flex items-center gap-6">
          <div className="shrink-0">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-sm" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-slate-50 flex items-center justify-center text-slate-400">
                <ImageIcon size={32} />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors border border-slate-200">
              <Upload size={18} />
              <span>เลือกรูปภาพ</span>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-slate-500 mt-2">รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 5MB</p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
      >
        {isSubmitting ? (
          <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
        ) : (
          <Plus size={20} />
        )}
        เพิ่มผู้สมัคร
      </button>
    </form>
  );
}
