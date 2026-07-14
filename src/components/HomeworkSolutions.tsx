'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getSolutions, addSolution, toggleLikeSolution, addComment } from '@/app/kanban/solution-actions';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { Heart, MessageSquare, Send, Image as ImageIcon, X, ChevronDown, ChevronUp, Share } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { motion, AnimatePresence } from 'framer-motion';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore nickname from local storage if available
  useEffect(() => {
    const savedName = localStorage.getItem('kb_nickname');
    if (savedName) setUploaderName(savedName);
  }, []);

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
    if (imageFiles.length === 0) {
      toast.error('กรุณาเลือกรูปภาพแนวทางอย่างน้อย 1 รูป');
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

      const publicUrls = await Promise.all(uploadPromises);

      toast.loading('กำลังบันทึกข้อมูล...', { id: toastId });

      const res = await addSolution(taskId, uploaderName.trim(), description, publicUrls, 'share');
      if (!res.success) throw new Error(res.error);

      toast.success('แชร์แนวทางสำเร็จ!', { id: toastId });

      // Reset form
      setShowAddForm(false);
      setDescription('');
      setImageFiles([]);
      setImagePreviews([]);

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
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />

            {/* Sidebar/Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
            >
              <form onSubmit={handleAddSubmit} className="flex flex-col h-full">

                {/* Sticky Header */}
                <div className="flex-none p-5 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">แชร์แนวทางของคุณ</h3>
                    <p className="text-xs text-slate-500 mt-1">แบ่งปันงานนี้ให้เพื่อนๆ ลอก</p>
                  </div>
                  <button type="button" onClick={() => setShowAddForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">

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

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อผู้แชร์ (นามแฝงได้) <span className="text-red-500">*</span></label>
                    <input required type="text" value={uploaderName} onChange={e => setUploaderName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="เช่น ด.ช.สมชาย" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">คำอธิบายเพิ่มเติม (ตัวเลือก)</label>
                    <div className="bg-white rounded-xl overflow-hidden border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                      <ReactQuill
                        theme="snow"
                        value={description}
                        onChange={setDescription}
                        placeholder="เช่น ข้อ 3 ผมไม่แน่ใจนะ, ลายมืออาจจะอ่านยากนิดนึง..."
                        className="h-40 mb-12"
                      />
                    </div>
                  </div>

                </div>

                {/* Sticky Footer */}
                <div className="flex-none p-5 border-t border-slate-100 bg-white z-10 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
                  <button type="submit" disabled={isSubmitting || imageFiles.length === 0} className={`w-full py-3 text-sm font-bold text-white rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:scale-100 active:scale-[0.98] bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200`}>
                    {isSubmitting ? 'กำลังบันทึกข้อมูล...' : '✨ อัปโหลดแบ่งปัน'}
                  </button>
                </div>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
  const [commentImageFile, setCommentImageFile] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('kb_nickname');
    if (savedName) setAuthorName(savedName);
  }, []);

  const hasLiked = (solution.liked_by || []).includes(deviceId);
  const likesCount = (solution.liked_by || []).length;
  const commentsCount = (solution.comments || []).length;

  const [optimisticLikeCount, setOptimisticLikeCount] = useState(likesCount);
  const [optimisticHasLiked, setOptimisticHasLiked] = useState(hasLiked);

  useEffect(() => {
    setOptimisticLikeCount(likesCount);
    setOptimisticHasLiked(hasLiked);
  }, [likesCount, hasLiked]);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic UI update
    setOptimisticHasLiked(!optimisticHasLiked);
    setOptimisticLikeCount((prev: number) => optimisticHasLiked ? prev - 1 : prev + 1);

    const res = await toggleLikeSolution(solution.id, deviceId);
    if (res.success) {
      onUpdate();
    } else {
      toast.error('ไม่สามารถถูกใจได้: ' + (res.error || 'Unknown Error'));
      setOptimisticHasLiked(hasLiked);
      setOptimisticLikeCount(likesCount);
    }
    setIsLiking(false);
  };

  const handleCommentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCommentImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCommentImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCommentImage = () => {
    setCommentImageFile(null);
    setCommentImagePreview(null);
    if (commentFileInputRef.current) commentFileInputRef.current.value = '';
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !commentImageFile) return;

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

  const images = solution.image_urls && solution.image_urls.length > 0
    ? solution.image_urls
    : (solution.image_url ? [solution.image_url] : []);

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

      {/* Images */}
      {!isRequest && images.length > 0 && (
        <div className="bg-slate-900 relative border-b border-slate-200">
          <div className="flex overflow-x-auto snap-x snap-mandatory flex-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {images.map((url: string, idx: number) => (
              <div key={idx} className="w-full shrink-0 snap-center relative">
                <img src={url} alt={`Homework Solution ${idx + 1}`} className="w-full h-auto max-h-[500px] object-contain" />
                {images.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm shadow-sm">
                    {idx + 1} / {images.length}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-b border-slate-50">
        <div className="flex gap-4">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 font-bold transition-colors ${optimisticHasLiked ? 'text-pink-600' : 'text-slate-600 hover:text-pink-500'}`}
          >
            <Heart size={22} className={optimisticHasLiked ? 'fill-pink-600' : ''} />
            <span>{optimisticLikeCount > 0 ? optimisticLikeCount : 'ถูกใจ'}</span>
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
          <div className="text-sm text-slate-700 mt-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
            <div className="font-bold text-indigo-700 mb-1">{solution.uploader_name}</div>
            <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: solution.description }} />
          </div>
        )}
      </div>

      {/* Comments Section (Chat UI) */}
      {showComments && (
        <div className="bg-slate-50 px-4 py-4 rounded-b-2xl">

          {/* Chat Bubbles List */}
          {solution.comments && solution.comments.length > 0 ? (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 hide-scrollbar">
              {solution.comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-2 items-end">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-100 mb-4">
                    <img 
                      src={`https://api.dicebear.com/10.x/dylan/svg?seed=${encodeURIComponent(comment.author_name)}`} 
                      alt={comment.author_name}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex flex-col gap-1 max-w-[85%]">
                    <span className="text-xs font-bold text-slate-500 ml-1">{comment.author_name}</span>
                    <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 text-sm text-slate-700">
                      {comment.image_urls && comment.image_urls.length > 0 && (
                        <div className="mb-2">
                          {comment.image_urls.map((img: string, idx: number) => (
                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                              <img src={img} alt="attachment" className="rounded-xl max-h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      )}
                      <span className="break-words">{comment.content}</span>
                    </div>
                    <button 
                      onClick={() => setCommentText((prev) => prev ? `${prev} @${comment.author_name} ` : `@${comment.author_name} `)}
                      className="text-[10px] text-slate-400 font-bold ml-1 hover:text-indigo-600 self-start transition-colors"
                    >
                      ตอบกลับ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-xs text-slate-400 py-4 bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">ยังไม่มีแชท เริ่มคุยกันเลย!</div>
          )}

          {/* Comment Image Preview */}
          {commentImagePreview && (
            <div className="relative inline-block mt-4 mb-2">
              <img src={commentImagePreview} alt="preview" className="h-20 w-auto rounded-xl object-cover border-2 border-indigo-100 shadow-sm" />
              <button 
                type="button" 
                onClick={handleRemoveCommentImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Comment Form */}
          <form onSubmit={handleComment} className="flex gap-2 items-end mt-3 pt-3 border-t border-slate-200/60">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={commentFileInputRef} 
              onChange={handleCommentImageChange} 
            />
            <button 
              type="button"
              onClick={() => commentFileInputRef.current?.click()}
              className="w-10 h-10 flex items-center justify-center text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors shrink-0 shadow-sm"
              title="แนบรูปภาพ"
            >
              <ImageIcon size={20} />
            </button>

            {!authorName && (
              <input
                type="text"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="ชื่อคุณ"
                className="w-20 text-sm border-0 bg-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm h-10"
              />
            )}
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="พิมพ์ข้อความแชท..."
              className="flex-1 text-sm border-0 bg-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm h-10"
            />
            <button
              type="submit"
              disabled={isCommenting || (!commentText.trim() && !commentImageFile)}
              className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm shrink-0"
            >
              <Send size={16} className={isCommenting ? 'opacity-50' : ''} />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
