'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { updateTaskStatus, deleteTask } from '@/app/kanban/actions';
import KanbanColumn from './KanbanColumn';
import TaskCard, { getUrgency } from './TaskCard';
import toast from 'react-hot-toast';

import { updateTaskDetails } from '@/app/kanban/actions';
import { createClient } from '@/utils/supabase/client';

export type Task = {
  id: string;
  subject: string;
  due_date: string;
  details: string;
  image_url: string | null;
  teacher_name: string | null;
  status: string;
};

const COLUMNS = [
  { id: 'todo', title: 'ต้องทำ (Todo)' },
  { id: 'in_progress', title: 'กำลังทำ (In Progress)' },
  { id: 'done', title: 'เสร็จแล้ว (Done)' },
];

export default function KanbanBoard({ initialTasks, isAuthenticated = false }: { initialTasks: Task[], isAuthenticated?: boolean }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setViewMode('list');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let localStatuses: Record<string, string> = {};
    try {
      const saved = localStorage.getItem('personalTaskStatus');
      if (saved) {
        localStatuses = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse personal status', e);
    }

    const mergedTasks = initialTasks.map(task => {
      if (localStatuses[task.id]) {
        return { ...task, status: localStatuses[task.id] };
      }
      return task;
    });

    setTasks(mergedTasks);
  }, [initialTasks]);

  const updateLocalStatus = (taskId: string, newStatus: string) => {
    setTasks((prevTasks) => {
      const newTasks = prevTasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      );

      try {
        const saved = localStorage.getItem('personalTaskStatus');
        const localStatuses = saved ? JSON.parse(saved) : {};
        localStatuses[taskId] = newStatus;
        localStorage.setItem('personalTaskStatus', JSON.stringify(localStatuses));
      } catch (e) {
        console.error('Failed to save personal status', e);
      }

      return newTasks;
    });

    toast.success(newStatus === 'done' ? 'งานเส้จแล้วจ่า' : 'อัปเดตสถานะแล้ว');
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    let newStatus = overId;

    if (!isOverColumn) {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    const taskToMove = tasks.find((t) => t.id === taskId);
    if (taskToMove && taskToMove.status !== newStatus) {
      updateLocalStatus(taskId, newStatus);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('🚨 คำเตือน: คุณกำลังจะลบงานนี้\n(งานนี้จะถูกซ่อนจากหน้าจอของคุณเท่านั้น ไม่กระทบกับคนอื่น) แน่ใจหรือไม่?')) {
      updateLocalStatus(taskId, 'deleted');
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTask) return;
    
    setIsSubmitting(true);
    const toastId = toast.loading('กำลังบันทึกข้อมูล...');

    try {
      const formData = new FormData(e.currentTarget);
      const subject = formData.get('subject') as string;
      const due_date = formData.get('due_date') as string;
      const details = formData.get('details') as string;
      const teacher_name = formData.get('teacher_name') as string;
      const imageFile = formData.get('image') as File | null;

      let image_url = selectedTask.image_url;

      if (imageFile && imageFile.size > 0) {
        toast.loading('กำลังอัปโหลดรูปภาพใหม่...', { id: toastId });
        const supabase = createClient();
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('homework-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('homework-images')
          .getPublicUrl(fileName);
        
        image_url = publicUrl;
      }

      toast.loading('กำลังบันทึกลงระบบ...', { id: toastId });
      const updatedData = {
        subject,
        due_date: new Date(due_date).toISOString(),
        details,
        teacher_name: teacher_name || null,
        image_url
      };

      const res = await updateTaskDetails(selectedTask.id, updatedData);
      if (res.error) throw new Error(res.error);

      // Update local state
      const updatedTask = { ...selectedTask, ...updatedData };
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      setSelectedTask(updatedTask);
      setIsEditing(false);
      toast.success('อัปเดตงานสำเร็จ!', { id: toastId });
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(`เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถอัปเดตงานได้'}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTaskStatus = (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateLocalStatus(task.id, newStatus);
  };

  const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'deleted'), [tasks]);

  // Sort tasks by urgency
  const sortedTasks = useMemo(() => {
    return [...activeTasks].sort((a, b) => {
      const urgencyMap: Record<string, number> = { critical: 0, warning: 1, chill: 2 };
      const aUrgency = getUrgency(a)?.level || 'chill';
      const bUrgency = getUrgency(b)?.level || 'chill';
      if (a.status === 'done') return 1;
      if (b.status === 'done') return -1;

      const aScore = urgencyMap[aUrgency];
      const bScore = urgencyMap[bUrgency];
      if (aScore !== bScore) return aScore - bScore;

      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [activeTasks]);

  const tasksByColumn = COLUMNS.map((col) => ({
    ...col,
    tasks: sortedTasks.filter((t) => t.status === col.id),
  }));

  // Stats for Dashboard
  const totalTasks = activeTasks.length;
  const doneTasks = activeTasks.filter(t => t.status === 'done').length;
  const overdueTasks = activeTasks.filter(t => getUrgency(t)?.level === 'critical').length;
  const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-xl font-bold text-slate-800">สรุปภาพรวมงาน</h2>
        <div className="bg-slate-200 p-1 rounded-xl flex">
          <button
            onClick={() => setViewMode('board')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            แบบกระดาน
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            แบบติ๊ก
          </button>
        </div>
      </div>

      {/* Dashboard Overview */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-slate-500 font-medium mb-2">การบ้านทั้งหมด</span>
          <div className="text-4xl font-extrabold text-slate-800">{totalTasks}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-[0_0_20px_rgba(239,68,68,0.05)] flex flex-col justify-between relative overflow-hidden">
          <span className="text-red-500 font-bold mb-2 z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            เกินกำหนดแล้ว
          </span>
          <div className="text-4xl font-extrabold text-red-600 z-10">{overdueTasks}</div>
          <div className="absolute right-[-20px] bottom-[-20px] text-red-100 opacity-30 select-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-emerald-500 font-medium mb-2">เคลียร์แล้ว</span>
          <div className="text-4xl font-extrabold text-emerald-600">{doneTasks}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center gap-2">
          <div className="flex justify-between items-end mb-1">
            <span className="text-indigo-600 font-bold">ความคืบหน้า</span>
            <span className="text-2xl font-bold text-indigo-700">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
            <div className="bg-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden" style={{ width: `${progress}%` }}>
              <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', animation: 'shimmer 2s infinite' }}></div>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'board' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto w-full pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-6 items-start h-full min-w-max">
              {tasksByColumn.map((col) => (
                <KanbanColumn key={col.id} column={col} onDeleteTask={handleDeleteTask} onTaskClick={setSelectedTask} />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="space-y-3">
            {sortedTasks.map(task => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${task.status === 'done' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
                  }`}
              >
                <div className="pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTaskStatus(task);
                    }}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-500'
                      }`}
                  >
                    {task.status === 'done' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    )}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold text-lg mb-1 truncate ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                    {task.subject}
                  </h4>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-2">{task.details}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                      กำหนด: {new Date(task.due_date).toLocaleDateString('th-TH')}
                    </span>
                    {task.teacher_name && (
                      <span className="text-slate-400">
                        คนสั่ง: {task.teacher_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {sortedTasks.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                ไม่มีงานในระบบ
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-slate-800 pr-4">
                  {isEditing ? 'แก้ไขงาน' : selectedTask.subject}
                </h3>
                <button 
                  onClick={() => {
                    setSelectedTask(null);
                    setIsEditing(false);
                    setImagePreview(null);
                  }} 
                  className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อวิชา</label>
                    <input required name="subject" defaultValue={selectedTask.subject} className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">กำหนดส่ง</label>
                      <input required type="date" name="due_date" defaultValue={selectedTask.due_date ? new Date(selectedTask.due_date).toISOString().split('T')[0] : ''} className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">คนสั่ง</label>
                      <input name="teacher_name" defaultValue={selectedTask.teacher_name || ''} className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">รายละเอียด</label>
                    <textarea required name="details" defaultValue={selectedTask.details} rows={3} className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">เปลี่ยนรูปภาพ (ถ้ามี)</label>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      name="image" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setImagePreview(reader.result as string);
                          reader.readAsDataURL(file);
                        } else {
                          setImagePreview(null);
                        }
                      }}
                      className="hidden" 
                    />
                    <div 
                      className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {(imagePreview || selectedTask.image_url) ? (
                        <img src={imagePreview || selectedTask.image_url!} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                      ) : (
                        <span className="text-slate-500 text-sm">คลิกเพื่ออัปโหลดรูปภาพใหม่</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">ยกเลิก</button>
                    <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center gap-2">
                      {isSubmitting && <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                      บันทึกการแก้ไข
                    </button>
                  </div>
                </form>
              ) : (
                <>

              {selectedTask.image_url && (
                <div className="mb-6 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={selectedTask.image_url} alt="Task attachment" className="w-full object-contain max-h-64" />
                </div>
              )}

              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mb-6">
                <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                  รายละเอียดงาน
                </h4>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedTask.details}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-slate-500 block mb-1 font-medium text-xs uppercase tracking-wider">กำหนดส่ง</span>
                  <span className="font-bold text-slate-800 text-base">{new Date(selectedTask.due_date).toLocaleDateString('th-TH', { dateStyle: 'long' })}</span>
                </div>
                {selectedTask.teacher_name && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center">
                    <span className="text-slate-500 block mb-1 font-medium text-xs uppercase tracking-wider">คุณครูผู้สอน</span>
                    <span className="font-bold text-slate-800 text-base">{selectedTask.teacher_name}</span>
                  </div>
                )}
              </div>
              </>
              )}
            </div>
            
            {!isEditing && (
              <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-between gap-3 shrink-0">
                {isAuthenticated ? (
                  <button onClick={() => {
                    setIsEditing(true);
                    setImagePreview(null);
                  }} className="px-5 py-2.5 bg-white border border-indigo-200 text-indigo-700 font-medium rounded-xl hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    แก้ไข
                  </button>
                ) : <div />}
                
                <div className="flex gap-3">
                  <button onClick={() => {
                    navigator.clipboard.writeText(`วิชา: ${selectedTask.subject}\nรายละเอียด: ${selectedTask.details}`);
                    toast.success('คัดลอกรายละเอียดแล้ว');
                  }} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                    คัดลอกงาน
                  </button>
                  <button onClick={() => setSelectedTask(null)} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
