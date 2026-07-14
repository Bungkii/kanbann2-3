'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getAllSolutions, getActiveTasks, addSolution } from '@/app/kanban/solution-actions';
import { SolutionCard } from '@/components/HomeworkSolutions';
import Link from 'next/link';
import { ChevronLeft, X, Image as ImageIcon } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import toast from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { motion, AnimatePresence } from 'framer-motion';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function HomeworkFeedPage() {
  const [solutions, setSolutions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState('');

  // Upload Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [postType, setPostType] = useState<'share' | 'request'>('share');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(files);
      
      const previews: string[] = [];
      let loaded = 0;
      
      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews[index] = reader.result as string;
          loaded++;
          if (loaded === files.length) {
            setImagePreviews([...previews]);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      setImageFiles([]);
      setImagePreviews([]);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId) return toast.error('กรุณาเลือกวิชา/งาน');
    if (postType === 'share' && imageFiles.length === 0) return toast.error('กรุณาเลือกรูปภาพแนวทางอย่างน้อย 1 รูป');
    if (!uploaderName.trim()) return toast.error('กรุณากรอกชื่อของคุณ');

    localStorage.setItem('kb_nickname', uploaderName.trim());
    setIsSubmitting(true);
    const toastId = toast.loading(postType === 'share' ? 'กำลังอัปโหลดรูปภาพ...' : 'กำลังสร้างคำขอ...');

    try {
      let publicUrls: string[] = [];
      
      if (postType === 'share' && imageFiles.length > 0) {
        // Upload all images in parallel to ImgBB
        const uploadPromises = imageFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('image', file);
          
          const response = await fetch('https://api.imgbb.com/1/upload?key=d6e98dfc0cc0437c381b0f99f293fa14', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error?.message || 'ImgBB upload failed');
          }
            
          return result.data.url;
        });

        publicUrls = await Promise.all(uploadPromises);
        toast.loading('กำลังบันทึกข้อมูล...', { id: toastId });
      }
      
      const res = await addSolution(selectedTaskId, uploaderName.trim(), description, publicUrls, postType);
      if (!res.success) throw new Error(res.error);

      toast.success(postType === 'share' ? 'แชร์แนวทางสำเร็จ!' : 'โพสต์ตามหางานสำเร็จ!', { id: toastId });
      
      setShowAddForm(false);
      setDescription('');
      setImageFiles([]);
      setImagePreviews([]);
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

        {/* Drawer Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddForm(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              />

              {/* Sidebar/Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
              >
                <form onSubmit={handleAddSubmit} className="flex flex-col h-full">
                  
                  {/* Sticky Header */}
                  <div className="flex-none p-5 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">แชร์แนวทาง / ขอลอก</h3>
                      <p className="text-xs text-slate-500 mt-1">แบ่งปันหรือขอความช่วยเหลือจากเพื่อนๆ</p>
                    </div>
                    <button type="button" onClick={() => setShowAddForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">
                    
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        type="button" 
                        onClick={() => setPostType('share')} 
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${postType === 'share' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        แจกแนวทาง
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setPostType('request')} 
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${postType === 'request' ? 'bg-white shadow-sm text-pink-700' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        ขอลอกงาน
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">เลือกงาน/วิชา <span className="text-red-500">*</span></label>
                      <select 
                        required 
                        value={selectedTaskId} 
                        onChange={e => setSelectedTaskId(e.target.value)} 
                        className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-shadow"
                      >
                        <option value="" disabled>-- เลือกงานที่ต้องการ{postType === 'share' ? 'แชร์' : 'ขอ'} --</option>
                        {tasks.map(t => (
                          <option key={t.id} value={t.id}>{t.subject}</option>
                        ))}
                      </select>
                    </div>

                    {postType === 'share' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">รูปภาพแนวทาง <span className="text-red-500">*</span></label>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-colors bg-slate-50/50 min-h-[140px]"
                        >
                          {imagePreviews.length > 0 ? (
                            <div className="flex flex-wrap gap-2 justify-center">
                              {imagePreviews.map((preview, idx) => (
                                <img key={idx} src={preview} alt={`Preview ${idx + 1}`} className="h-24 w-auto rounded-lg object-cover shadow-sm border border-slate-200" />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-slate-500">
                              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3">
                                <ImageIcon size={24} className="text-indigo-400" />
                              </div>
                              <span className="text-sm font-bold text-slate-700 block">อัปโหลดรูปภาพ</span>
                              <span className="text-xs text-slate-400">เลือกได้หลายรูปพร้อมกัน</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อผู้{postType === 'share' ? 'แชร์' : 'ขอ'} (นามแฝงได้) <span className="text-red-500">*</span></label>
                      <input required type="text" value={uploaderName} onChange={e => setUploaderName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="เช่น ด.ช.สมชาย" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">คำอธิบายเพิ่มเติม (ตัวเลือก)</label>
                      <div className="bg-white rounded-xl overflow-hidden border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                        <ReactQuill 
                          theme="snow" 
                          value={description} 
                          onChange={setDescription} 
                          placeholder={postType === 'share' ? "เช่น ข้อ 3 ผมไม่แน่ใจนะ..." : "ช่วยด้วยยย ทำไม่เป็น"}
                          className="h-40 mb-12"
                        />
                      </div>
                    </div>
                    
                  </div>

                  {/* Sticky Footer */}
                  <div className="flex-none p-5 border-t border-slate-100 bg-white z-10 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
                    <button type="submit" disabled={isSubmitting || (postType === 'share' && imageFiles.length === 0) || !selectedTaskId} className={`w-full py-3 text-sm font-bold text-white rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:scale-100 active:scale-[0.98] ${postType === 'share' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-pink-600 hover:bg-pink-700 shadow-pink-200'}`}>
                      {isSubmitting ? 'กำลังบันทึกข้อมูล...' : postType === 'share' ? '✨ อัปโหลดแบ่งปัน' : '🙏 โพสต์ขอลอก'}
                    </button>
                  </div>
                  
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
