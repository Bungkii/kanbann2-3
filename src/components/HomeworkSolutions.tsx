'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getSolutions, addSolution, toggleLikeSolution, addComment } from '@/app/kanban/solution-actions';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { Heart, MessageSquare, Send, Image as ImageIcon, X, ChevronDown, ChevronUp, Share } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

export default function HomeworkSolutions({ taskId }: { taskId: string }) {
  const [solutions, setSolutions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Device ID for liking
  const [deviceId, setDeviceId] = useState('');
  useEffect(() => {
    let id = localStorage.getItem('kb_device_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('kb_device_id', id);
    }
    setDeviceId(id);
    fetchSolutions();
  }, [taskId]);

  const fetchSolutions = async () => {
    setIsLoading(true);
    const res = await getSolutions(taskId);
    if (res.success) {
      setSolutions(res.data || []);
    }
    setIsLoading(false);
  };

  // Add Solution Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploaderName, setUploaderName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore nickname from local storage if available
  useEffect(() => {
    const savedName = localStorage.getItem('kb_nickname');
    if (savedName) setUploaderName(savedName);
  }, []);

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
    if (!imageFile) {
      toast.error('กรุณาเลือกรูปภาพแนวทาง');
      return;
    }
    if (!uploaderName.trim()) {
      toast.error('กรุณากรอกชื่อของคุณ');
      return;
    }

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
      
      const res = await addSolution(taskId, uploaderName.trim(), description.trim(), publicUrl);
      if (!res.success) throw new Error(res.error);

      toast.success('แชร์แนวทางสำเร็จ!', { id: toastId });
      
      // Reset form
      setShowAddForm(false);
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      
      // Refresh
      fetchSolutions();
    } catch (error: any) {
      console.error(error);
      toast.error(`เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถอัปโหลดได้'}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">กำลังโหลดแนวทาง...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header & Add Button */}
      {!showAddForm && (
        <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
          <div>
            <h4 className="font-bold text-indigo-900">แชร์แนวทางการบ้าน 🚀</h4>
            <p className="text-xs text-indigo-700 mt-1">แบ่งปันให้เพื่อนลอก หรือดูแนวทางจากเพื่อนๆ</p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors"
          >
            + แชร์แนวทาง
          </button>
        </div>
      )}

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
            {/* Image Upload */}
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
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="เช่น ข้อ 3 ผมไม่แน่ใจนะ, ลายมืออาจจะอ่านยากนิดนึง..." />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">ยกเลิก</button>
              <button type="submit" disabled={isSubmitting || !imageFile} className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? 'กำลังอัปโหลด...' : 'อัปโหลดแบ่งปัน'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Feed */}
      <div className="space-y-6">
        {solutions.length === 0 && !showAddForm && (
          <div className="text-center py-12 text-slate-400">
            <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
            <p>ยังไม่มีแนวทางสำหรับงานนี้</p>
            <p className="text-sm mt-1">มาเป็นคนแรกที่แชร์สิ!</p>
          </div>
        )}

        {solutions.map((sol) => (
          <SolutionCard 
            key={sol.id} 
            solution={sol} 
            deviceId={deviceId}
            onUpdate={fetchSolutions}
          />
        ))}
      </div>

    </div>
  );
}

// Subcomponent for each solution card
export function SolutionCard({ solution, deviceId, onUpdate }: { solution: any, deviceId: string, onUpdate: () => void }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('kb_nickname');
    if (savedName) setAuthorName(savedName);
  }, []);

  const hasLiked = (solution.liked_by || []).includes(deviceId);
  const likesCount = (solution.liked_by || []).length;
  const commentsCount = (solution.comments || []).length;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    // Optimistic UI update could be done here, but we'll just wait for the fast server action
    const res = await toggleLikeSolution(solution.id, deviceId);
    if (res.success) {
      onUpdate();
    }
    setIsLiking(false);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    let name = authorName.trim();
    if (!name) {
      name = 'ไม่ระบุชื่อ';
    } else {
      localStorage.setItem('kb_nickname', name);
    }

    setIsCommenting(true);
    const res = await addComment(solution.id, name, commentText.trim());
    setIsCommenting(false);

    if (res.success) {
      setCommentText('');
      onUpdate(); // refresh comments
    } else {
      toast.error('ส่งคอมเมนต์ไม่สำเร็จ');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/homework-feed`;
    navigator.clipboard.writeText(url);
    toast.success('คัดลอกลิงก์เพื่อรีโพสต์แล้ว');
  };

  const isRequest = solution.post_type === 'request';

  return (
    <div className={`border rounded-2xl overflow-hidden shadow-sm ${isRequest ? 'bg-pink-50/30 border-pink-100' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${isRequest ? 'border-pink-100 bg-pink-50' : 'border-slate-100 bg-slate-50/50'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isRequest ? 'bg-gradient-to-tr from-pink-500 to-rose-500' : 'bg-gradient-to-tr from-indigo-500 to-purple-500'}`}>
            {solution.uploader_name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800 leading-none">{solution.uploader_name}</p>
            <p className="text-[10px] text-slate-500 mt-1">
              {formatDistanceToNow(new Date(solution.created_at), { addSuffix: true, locale: th })}
            </p>
          </div>
        </div>
      </div>

      {/* Image */}
      {!isRequest && solution.image_url && (
        <div className="bg-slate-900 relative">
          <img src={solution.image_url} alt="Homework Solution" className="w-full h-auto max-h-[500px] object-contain" />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-b border-slate-50">
        <div className="flex gap-4">
          <button 
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 font-bold transition-colors ${hasLiked ? 'text-pink-600' : 'text-slate-600 hover:text-pink-500'}`}
          >
            <Heart size={22} className={hasLiked ? 'fill-pink-600' : ''} />
            <span>{likesCount > 0 ? likesCount : 'ถูกใจ'}</span>
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-slate-600 font-bold hover:text-indigo-600 transition-colors"
          >
            <MessageSquare size={22} />
            <span>{commentsCount > 0 ? commentsCount : 'คอมเมนต์'}</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="flex items-center gap-1.5 text-slate-600 font-bold hover:text-indigo-600 transition-colors ml-auto"
          >
            <Share size={20} />
            <span>รีโพสต์</span>
          </button>
        </div>

        {solution.description && (
          <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">
            <span className="font-bold mr-2">{solution.uploader_name}</span>
            {solution.description}
          </p>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-slate-50 px-4 py-4 space-y-4">
          
          {/* Comments List */}
          {solution.comments && solution.comments.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {solution.comments.map((comment: any) => (
                <div key={comment.id} className="text-sm flex gap-2">
                  <span className="font-bold text-slate-800 whitespace-nowrap">{comment.author_name}:</span>
                  <span className="text-slate-700 break-words">{comment.content}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-xs text-slate-400 py-2">ยังไม่มีคอมเมนต์ เริ่มคุยกันเลย!</div>
          )}

          {/* Comment Form */}
          <form onSubmit={handleComment} className="flex gap-2 items-end mt-2 pt-2 border-t border-slate-200/60">
            {!authorName && (
              <input 
                type="text" 
                value={authorName} 
                onChange={e => setAuthorName(e.target.value)} 
                placeholder="ชื่อคุณ"
                className="w-24 text-sm border-0 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm h-10"
              />
            )}
            <input 
              type="text" 
              value={commentText} 
              onChange={e => setCommentText(e.target.value)}
              placeholder="เพิ่มคอมเมนต์..."
              className="flex-1 text-sm border-0 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm h-10"
            />
            <button 
              type="submit" 
              disabled={isCommenting || !commentText.trim()}
              className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm shrink-0"
            >
              <Send size={16} className={isCommenting ? 'opacity-50' : ''} />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
