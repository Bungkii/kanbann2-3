'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, Trophy, ArrowLeft, Image as ImageIcon, Send, X, ClipboardList, Info } from 'lucide-react';

export default function AddTaskPage() {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [workType, setWorkType] = useState<'individual' | 'group'>('individual');
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

  const removeImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    const submissionMethod = formData.get('submission_method') as string;
    const maxScore = formData.get('max_score') as string;
    const groupSize = workType === 'group' ? formData.get('group_size') as string : null;
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
          submission_method: submissionMethod || null,
          image_url: imageUrl,
          status: 'todo',
          work_type: workType,
          group_size: groupSize ? parseInt(groupSize) : null,
          max_score: maxScore ? parseFloat(maxScore) : null
        }]);

      if (insertError) throw insertError;

      toast.success('บันทึกงานสำเร็จ! จะแสดงในบอร์ดให้เพื่อนเห็นทันที', { id: toastId });
      router.push('/kanban');
      router.refresh();
    } catch (error: any) {
      console.error('Error adding homework:', error);
      toast.error(`เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถบันทึกงานได้คราบ'}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-start">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-xl border border-slate-100 relative"
      >
        <Link 
          href="/"
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
          title="กลับหน้าแรก"
        >
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-3xl font-bold mb-2 text-slate-800 flex items-center gap-3">
          <ClipboardList className="text-indigo-600" size={28} />
          บันทึกงานใหม่
        </h2>
        <p className="text-slate-500 flex items-center gap-1 mb-8">
          <Info size={16} />
          จดไว้นะ (จะขึ้นบอร์ดให้เพื่อนเห็นเพื่อเช็คงานด้วยกัน)
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อวิชา *</label>
              <input required name="subject" placeholder="เช่น คณิตศาสตร์, วิทยาศาสตร์" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">กำหนดเสร็จ *</label>
              <input required type="date" name="due_date" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">ครูผู้สั่ง</label>
              <input name="teacher_name" placeholder="ชื่อครู" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">วิธีการส่งงาน (Submission Method)</label>
            <input name="submission_method" placeholder="ส่งที่โต๊ะ, ส่งในไก่งวง, ส่งกับครู" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">คะแนนเต็ม (Max Score)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Trophy size={16} className="text-slate-400" />
                </div>
                <input type="number" step="0.5" name="max_score" placeholder="เช่น 10, 20" className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">ประเภทงาน (Work Type) *</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setWorkType('individual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${workType === 'individual' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                >
                  <User size={18} />
                  <span className="font-medium">งานเดี่ยว</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkType('group')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${workType === 'group' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                >
                  <Users size={18} />
                  <span className="font-medium">งานกลุ่ม</span>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {workType === 'group' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: -24 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: -24 }}
                  transition={{ duration: 0.3 }}
                  className="md:col-span-2 overflow-hidden"
                >
                  <label className="block text-sm font-semibold text-slate-700 mb-2">จำนวนคนในกลุ่ม (Group Size) *</label>
                  <input required type="number" min="2" name="group_size" placeholder="เช่น 3, 5" className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">รายละเอียดงาน (Details) *</label>
            <textarea required name="details" rows={4} placeholder="อธิบายรายละเอียดให้เพื่อนๆ เข้าใจ..." className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm resize-none" />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">รูปภาพปลากรอบ</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-6 transition-colors text-center cursor-pointer relative ${imagePreview ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative group">
                  <img src={imagePreview} alt="Preview" className="max-h-60 mx-auto rounded-lg object-contain" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <span className="text-white font-medium">คลิกเพื่อเปลี่ยนรูปภาพ</span>
                  </div>
                  <button 
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors z-10"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <ImageIcon className="text-slate-400 mb-3" size={40} />
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
              ) : (
                <>
                  <Send size={18} />
                  บันทึกลงระบบ
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
