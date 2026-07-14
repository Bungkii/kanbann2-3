'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getAllSolutions, getActiveTasks, addSolution } from '@/app/kanban/solution-actions';
import { SolutionCard } from '@/components/HomeworkSolutions';
import Link from 'next/link';
import { ChevronLeft, X, Image as ImageIcon } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import toast from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';

export default function HomeworkFeedPage() {
  const [solutions, setSolutions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState('');

  // Upload Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let id = localStorage.getItem('kb_device_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('kb_device_id', id);
    }
    setDeviceId(id);
    
    const savedName = localStorage.getItem('kb_nickname');
    if (savedName) setUploaderName(savedName);

    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [solRes, taskRes] = await Promise.all([getAllSolutions(), getActiveTasks()]);
    if (solRes.success && solRes.data) setSolutions(solRes.data);
    if (taskRes.success && taskRes.data) setTasks(taskRes.data);
    setIsLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId) return toast.error('กรุณาเลือกวิชา/งาน');
    if (!imageFile) return toast.error('กรุณาเลือกรูปภาพแนวทาง');
    if (!uploaderName.trim()) return toast.error('กรุณากรอกชื่อของคุณ');

    localStorage.setItem('kb_nickname', uploaderName.trim());
    setIsSubmitting(true);
    const toastId = toast.loading('กำลังอัปโหลดรูปภาพ...');

    try {
      const supabase = createClient();
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('homework-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('homework-images')
        .getPublicUrl(fileName);

      toast.loading('กำลังบันทึกข้อมูล...', { id: toastId });
      
      const res = await addSolution(selectedTaskId, uploaderName.trim(), description.trim(), publicUrl);
      if (!res.success) throw new Error(res.error);

      toast.success('แชร์แนวทางสำเร็จ!', { id: toastId });
      
      setShowAddForm(false);
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      setSelectedTaskId('');
      
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(`เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถอัปโหลดได้'}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft size={24} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">ลอกงาน 🚀</h1>
              <p className="text-slate-500 text-sm">รวมแนวทางการบ้านทั้งหมดจากเพื่อนๆ</p>
            </div>
          </div>
          {!showAddForm && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors"
            >
              + แชร์งาน
            </button>
          )}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-800">แชร์แนวทางของคุณ</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">เลือกงาน/วิชา</label>
                <select 
                  required 
                  value={selectedTaskId} 
                  onChange={e => setSelectedTaskId(e.target.value)} 
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="" disabled>-- เลือกงานที่ต้องการแชร์ --</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50/50 min-h-[120px]"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
                  ) : (
                    <div className="text-center text-slate-500">
                      <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                      <span className="text-sm font-medium">คลิกเพื่อเลือกรูปภาพ หรือถ่ายรูป</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อผู้แชร์ (นามแฝงได้)</label>
                  <input required type="text" value={uploaderName} onChange={e => setUploaderName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="เช่น ด.ช.สมชาย" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">คำอธิบายเพิ่มเติม (ตัวเลือก)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="เช่น ข้อ 3 ผมไม่แน่ใจนะ..." />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isSubmitting || !imageFile || !selectedTaskId} className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {isSubmitting ? 'กำลังอัปโหลด...' : 'อัปโหลดแบ่งปัน'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-100 animate-pulse h-64 rounded-2xl w-full"></div>
            ))}
          </div>
        ) : solutions.length === 0 && !showAddForm ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">ยังไม่มีลอกงานเลย</h3>
            <p className="text-slate-500">มากดแชร์แบ่งเพื่อนลอกกันหน่อย!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {solutions.map(sol => (
              <div key={sol.id} className="relative mt-4">
                <div className="absolute -top-3 left-4 z-10 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200 shadow-sm">
                  วิชา: {sol.task_subject}
                </div>
                <SolutionCard 
                  solution={sol}
                  deviceId={deviceId}
                  onUpdate={fetchData}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
