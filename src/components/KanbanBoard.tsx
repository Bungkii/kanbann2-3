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

export default function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

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
    
    toast.success(newStatus === 'done' ? 'เคลียร์งานส่วนตัวสำเร็จ!' : 'อัปเดตสถานะส่วนตัวแล้ว');
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
    if (confirm('🚨 คำเตือน: คุณกำลังจะลบงานนี้\nแน่ใจหรือไม่? (ระวังลบผิดของเพื่อนนะ!)')) {
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));

      toast.promise(
        deleteTask(taskId),
        {
          loading: 'กำลังลบงาน...',
          success: 'ลบงานสำเร็จ!',
          error: 'ลบงานไม่สำเร็จ กรุณาลองใหม่',
        }
      );
    }
  };

  const handleToggleTaskStatus = (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateLocalStatus(task.id, newStatus);
  };

  // Sort tasks by urgency
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
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
  }, [tasks]);

  const tasksByColumn = COLUMNS.map((col) => ({
    ...col,
    tasks: sortedTasks.filter((t) => t.status === col.id),
  }));

  // Stats for Dashboard
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const overdueTasks = tasks.filter(t => getUrgency(t)?.level === 'critical').length;
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
            แบบติ๊ก (Todo List)
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
            เกินกำหนดแล้ว (งานด่วน)
          </span>
          <div className="text-4xl font-extrabold text-red-600 z-10">{overdueTasks}</div>
          <div className="absolute right-[-20px] bottom-[-20px] text-red-100 opacity-30 select-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
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
                        มิส: {task.teacher_name}
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
                <h3 className="text-2xl font-bold text-slate-800 pr-4">{selectedTask.subject}</h3>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              
              {selectedTask.image_url && (
                <div className="mb-6 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={selectedTask.image_url} alt="Task attachment" className="w-full object-contain max-h-64" />
                </div>
              )}
              
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mb-6">
                <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
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
            </div>
            <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end gap-3 shrink-0">
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
        </div>
      )}
    </div>
  );
}
