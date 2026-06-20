'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isBefore, isToday, isTomorrow, differenceInDays, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';
import type { Task } from './KanbanBoard';

export function getUrgency(task: Task) {
  if (task.status === 'done') return null;
  const due = startOfDay(new Date(task.due_date));
  const today = startOfDay(new Date());

  if (isBefore(due, today) || isToday(due)) {
    return { level: 'critical', text: 'เกินกำหนดแล้ว!', color: 'text-red-700 bg-red-100 border-red-200' };
  } else if (isTomorrow(due) || differenceInDays(due, today) <= 2) {
    return { level: 'warning', text: 'พริมเริ่มมอง...', color: 'text-amber-700 bg-amber-100 border-amber-200' };
  } else {
    return { level: 'chill', text: 'พริมยังชิล', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' };
  }
}

export default function TaskCard({ task, isOverlay, onDelete }: { task: Task; isOverlay?: boolean; onDelete?: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-indigo-50/50 border-2 border-indigo-200 border-dashed rounded-xl p-4 h-[120px] opacity-40"
      />
    );
  }

  const dueDate = new Date(task.due_date);
  const urgency = getUrgency(task);

  const handleCopyHomework = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `วิชา: ${task.subject}\nรายละเอียด: ${task.details}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success('โหมดลอกการบ้าน: คัดลอกลงคลิปบอร์ดแล้ว! 🤫');
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.image_url) {
      window.open(task.image_url, '_blank');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(task.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow
        ${isOverlay ? 'rotate-2 scale-105 shadow-xl' : ''}
        ${urgency?.level === 'critical' ? 'border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : ''}
      `}
    >
      {urgency && (
        <div className="mb-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${urgency.color}`}>
            {urgency.text}
          </span>
        </div>
      )}

      {task.image_url && (
        <div
          onClick={handleImageClick}
          className="w-full h-32 rounded-lg mb-3 overflow-hidden border border-slate-100 group relative"
        >
          <img src={task.image_url} alt={task.subject} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-2 gap-2">
        <h4 className="font-bold text-slate-800 line-clamp-2 leading-tight flex-1">{task.subject}</h4>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={handleCopyHomework}
            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md transition-colors"
            title="ลอกการบ้าน (คัดลอก)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
          </button>
          {!isOverlay && onDelete && (
            <button
              onClick={handleDelete}
              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
              title="ลบงานนี้"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-3 line-clamp-2">{task.details}</p>

      <div className="flex items-center justify-between text-xs mt-auto pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          <span className={`font-medium ${urgency?.level === 'critical' ? 'text-red-600' : 'text-slate-500'}`}>
            {format(dueDate, 'MMM d, yyyy')}
          </span>
        </div>

        {task.teacher_name && (
          <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            <span className="truncate max-w-[80px]">{task.teacher_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
