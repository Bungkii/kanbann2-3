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

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

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
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      );

      toast.promise(
        updateTaskStatus(taskId, newStatus),
        {
          loading: 'กำลังย้ายการบ้าน...',
          success: 'อัปเดตสถานะสำเร็จ',
          error: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
        }
      );
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
      {/* Dashboard Overview */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-slate-500 font-medium mb-2">การบ้านทั้งหมด</span>
          <div className="text-4xl font-extrabold text-slate-800">{totalTasks}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-[0_0_20px_rgba(239,68,68,0.05)] flex flex-col justify-between relative overflow-hidden">
          <span className="text-red-500 font-bold mb-2 z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            เกินกำหนดแล้ว! (งานด่วน)
          </span>
          <div className="text-4xl font-extrabold text-red-600 z-10">{overdueTasks}</div>
          <div className="absolute right-[-20px] bottom-[-20px] text-red-100 text-8xl opacity-30 select-none">🚨</div>
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto w-full pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-6 items-start h-full min-w-max">
            {tasksByColumn.map((col) => (
              <KanbanColumn key={col.id} column={col} onDeleteTask={handleDeleteTask} />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
