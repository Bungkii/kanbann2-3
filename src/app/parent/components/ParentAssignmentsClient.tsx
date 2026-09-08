'use client';

import React, { useState, useMemo } from 'react';
import { format, isBefore, isToday, isTomorrow, differenceInDays, startOfDay } from 'date-fns';
import { Users, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export type Task = {
  id: string;
  subject: string;
  due_date: string;
  details: string;
  image_url: string | null;
  teacher_name: string | null;
  submission_method: string | null;
  status: string;
  work_type?: string | null;
  group_size?: number | null;
  max_score?: number | null;
};

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

const COLUMNS = [
  { id: 'todo', title: 'ต้องทำ (Todo)' },
  { id: 'in_progress', title: 'กำลังทำ (In Progress)' },
  { id: 'done', title: 'เสร็จแล้ว (Done)' },
];

export default function ParentAssignmentsClient({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'category'>('board');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'deleted'), [tasks]);

  const uniqueSubjects = useMemo(() => {
    const subjects = [...new Set(activeTasks.map(t => t.subject))];
    return subjects.sort();
  }, [activeTasks]);

  const categoryGroups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = filterSubject === 'all'
      ? activeTasks
      : activeTasks.filter(t => t.subject === filterSubject);

    const overdue: Task[] = [];
    const urgent: Task[] = [];
    const far: Task[] = [];
    const done: Task[] = [];

    filtered.forEach(task => {
      if (task.status === 'done') {
        done.push(task);
        return;
      }
      const due = new Date(task.due_date);
      due.setHours(0, 0, 0, 0);
      if (isBefore(due, today)) {
        overdue.push(task);
      } else if (differenceInDays(due, today) <= 7) {
        urgent.push(task);
      } else {
        far.push(task);
      }
    });

    return { overdue, urgent, far, done };
  }, [activeTasks, filterSubject]);

  const totalTasks = activeTasks.length;
  const doneTasks = activeTasks.filter(t => t.status === 'done').length;
  const overdueTasks = activeTasks.filter(t => {
    if (t.status === 'done') return false;
    const due = new Date(t.due_date);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(due, today);
  }).length;

  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const tasksByColumn = useMemo(() => {
    return COLUMNS.map(col => ({
      ...col,
      tasks: activeTasks.filter(task => task.status === col.id),
    }));
  }, [activeTasks]);

  const sortedTasks = useMemo(() => {
    return [...activeTasks].sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [activeTasks]);

  return (
    <div className="flex flex-col h-full">
      {/* Top Header & View Switcher identical to Student Kanban */}
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-xl font-bold text-slate-800">สรุปภาพรวมงาน</h2>
        <div className="bg-slate-200 p-1 rounded-xl flex gap-0.5">
          <button
            onClick={() => setViewMode('board')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'board' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            กระดาน
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ติ๊ก
          </button>
          <button
            onClick={() => setViewMode('category')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'category' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            หมวดหมู่
          </button>
        </div>
      </div>

      {/* Dashboard Overview Cards (Exact student code & styling) */}
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. KANBAN BOARD VIEW (Identical to Student Kanban)           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewMode === 'board' ? (
        <div className="overflow-x-auto w-full pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-6 items-start h-full min-w-max">
            {tasksByColumn.map((col) => (
              <div
                key={col.id}
                className="bg-slate-100/50 rounded-2xl w-80 flex flex-col max-h-full flex-shrink-0 border border-slate-200"
              >
                <div className="p-4 border-b border-slate-200/60 flex items-center justify-between bg-slate-100/80 rounded-t-2xl">
                  <h3 className="font-bold text-slate-700">{col.title}</h3>
                  <span className="bg-white text-slate-500 text-xs font-medium px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
                    {col.tasks.length}
                  </span>
                </div>

                <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 min-h-[150px]">
                  {col.tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 text-slate-400 border-2 border-dashed border-slate-200/60 rounded-xl bg-slate-50/50 mt-1">
                      <span className="text-sm font-medium">ไม่มีงานในคอลัมน์นี้</span>
                    </div>
                  ) : (
                    col.tasks.map((task) => (
                      <StudentTaskCard
                        key={task.id}
                        task={task}
                        onClick={setSelectedTask}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === 'category' ? (
        /* ───────────────────────────────────────────────────────────── */
        /* 2. CATEGORY VIEW (Identical to Student Category)              */
        /* ───────────────────────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Subject filter */}
          <div className="flex flex-wrap gap-2 pb-2">
            <button
              onClick={() => setFilterSubject('all')}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                filterSubject === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทุกวิชา
            </button>
            {uniqueSubjects.map(subject => (
              <button
                key={subject}
                onClick={() => setFilterSubject(subject)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  filterSubject === subject ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>

          {/* Overdue section */}
          {categoryGroups.overdue.length > 0 && (
            <CategorySection
              title="🚨 เลยกำหนดแล้ว"
              tasks={categoryGroups.overdue}
              color="red"
              onTaskClick={setSelectedTask}
            />
          )}

          {/* Urgent section */}
          <CategorySection
            title="⚡ ส่งเร็วๆ นี้ (7 วันหน้า)"
            tasks={categoryGroups.urgent}
            color="amber"
            onTaskClick={setSelectedTask}
            emptyText="ไม่มีงานที่ต้องส่งใน 7 วันนี้ 🎉"
          />

          {/* Far section */}
          <CategorySection
            title="📅 อีกยาวไกล (มากกว่า 7 วัน)"
            tasks={categoryGroups.far}
            color="slate"
            onTaskClick={setSelectedTask}
            emptyText="ไม่มีงานระยะยาว"
          />

          {/* Done section */}
          {categoryGroups.done.length > 0 && (
            <CategorySection
              title="✅ เสร็จแล้ว"
              tasks={categoryGroups.done}
              color="emerald"
              onTaskClick={setSelectedTask}
            />
          )}
        </div>
      ) : (
        /* ───────────────────────────────────────────────────────────── */
        /* 3. LIST VIEW (Identical to Student List View)                 */
        /* ───────────────────────────────────────────────────────────── */
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="space-y-3">
            {sortedTasks.map(task => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  task.status === 'done' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
                }`}
              >
                <div className="pt-1">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                    }`}
                  >
                    {task.status === 'done' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    )}
                  </div>
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TASK MODAL (Identical to Student Kanban Task Modal)           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setSelectedTask(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 relative"
            >
              <div className="p-6 overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-slate-800 pr-4">
                    {selectedTask.subject}
                  </h3>
                  <button 
                    onClick={() => setSelectedTask(null)} 
                    className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {selectedTask.image_url && (
                    <div 
                      onClick={() => window.open(selectedTask.image_url!, '_blank')}
                      className="w-full h-48 rounded-xl overflow-hidden border border-slate-100 relative group cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedTask.image_url} alt={selectedTask.subject} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                          ดูรูปขนาดเต็ม
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">รายละเอียด</span>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedTask.details}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-xs font-semibold text-slate-400 block mb-1">กำหนดส่ง</span>
                      <span className="font-bold text-slate-800 text-base">{new Date(selectedTask.due_date).toLocaleDateString('th-TH', { dateStyle: 'short' })}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-xs font-semibold text-slate-400 block mb-1">คนสั่ง</span>
                      <span className="font-medium text-slate-700">{selectedTask.teacher_name || '-'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-xs font-semibold text-slate-400 block mb-1">ประเภทงาน</span>
                      <span className="font-medium text-slate-700">
                        {selectedTask.work_type === 'group' 
                          ? `งานกลุ่ม ${selectedTask.group_size ? `(${selectedTask.group_size} คน)` : ''}`
                          : 'งานเดี่ยว'}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-xs font-semibold text-slate-400 block mb-1">คะแนนเต็ม</span>
                      <span className="font-medium text-slate-700">{selectedTask.max_score != null ? `${selectedTask.max_score} คะแนน` : '-'}</span>
                    </div>
                  </div>

                  {selectedTask.submission_method && (
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-xs font-semibold text-slate-400 block mb-1">วิธีการส่งงาน</span>
                      <span className="font-medium text-slate-700">{selectedTask.submission_method}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`วิชา: ${selectedTask.subject}\nรายละเอียด: ${selectedTask.details}`);
                    toast.success('คัดลอกรายละเอียดแล้ว');
                  }} 
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                  คัดลอกงาน
                </button>
                <button 
                  onClick={() => setSelectedTask(null)} 
                  className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Student TaskCard Component (100% Identical to TaskCard.tsx) ──────────────
function StudentTaskCard({ task, onClick }: { task: Task; onClick: (task: Task) => void }) {
  const dueDate = new Date(task.due_date);
  const urgency = getUrgency(task);

  const handleCopyHomework = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `วิชา: ${task.subject}\nรายละเอียด: ${task.details}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success('คัดลอกลงคลิปบอร์ดแล้ว');
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.image_url) {
      window.open(task.image_url, '_blank');
    }
  };

  return (
    <div
      onClick={() => onClick(task)}
      className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer ${
        urgency?.level === 'critical' ? 'border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : ''
      }`}
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
          className="w-full h-32 rounded-lg mb-3 overflow-hidden border border-slate-100 group relative cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={task.image_url} alt={task.subject} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-800 line-clamp-2 leading-tight">{task.subject}</h4>
          {(task.work_type === 'group' || task.max_score != null) && (
            <div className="flex items-center gap-2 mt-1.5 text-xs font-medium">
              {task.work_type === 'group' && (
                <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                  <Users size={12} /> กลุ่ม {task.group_size ? `(${task.group_size})` : ''}
                </span>
              )}
              {task.max_score != null && (
                <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                  <Trophy size={12} /> {task.max_score}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={handleCopyHomework}
            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md transition-colors"
            title="ลอกการบ้าน"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
          </button>
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

// ─── Student CategorySection Component (100% Identical to KanbanBoard.tsx) ────
type CategorySectionProps = {
  title: string;
  tasks: Task[];
  color: 'red' | 'amber' | 'slate' | 'emerald';
  onTaskClick: (task: Task) => void;
  emptyText?: string;
};

const COLOR_MAP = {
  red:     { section: 'border-red-200 bg-red-50',     badge: 'bg-red-100 text-red-700',     header: 'text-red-700' },
  amber:   { section: 'border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-700', header: 'text-amber-700' },
  slate:   { section: 'border-slate-200 bg-slate-50', badge: 'bg-slate-100 text-slate-600', header: 'text-slate-600' },
  emerald: { section: 'border-emerald-100 bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-700', header: 'text-emerald-700' },
};

function CategorySection({ title, tasks, color, onTaskClick, emptyText }: CategorySectionProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const c = COLOR_MAP[color];

  return (
    <div className={`rounded-2xl border ${c.section} overflow-hidden`}>
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:brightness-95 transition"
      >
        <span className={`font-bold text-sm ${c.header} flex items-center gap-2`}>
          {title}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
            {tasks.length}
          </span>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="16" height="16"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform ${collapsed ? '-rotate-90' : ''} text-slate-400`}
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {tasks.length === 0 && emptyText ? (
                <p className="text-center text-slate-400 text-sm py-4">{emptyText}</p>
              ) : (
                tasks.map(task => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className={`flex items-start gap-3 bg-white rounded-xl border px-4 py-3 cursor-pointer shadow-sm transition-all hover:border-indigo-300 ${
                      task.status === 'done' ? 'opacity-50' : ''
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        task.status === 'done'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {task.status === 'done' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {task.subject}
                      </p>
                      {task.details && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{task.details}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                          {new Date(task.due_date).toLocaleDateString('th-TH', { dateStyle: 'short' })}
                        </span>
                        {task.submission_method && (
                          <span className="text-xs bg-orange-50 text-orange-600 font-medium px-2 py-0.5 rounded-md">
                            {task.submission_method}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
