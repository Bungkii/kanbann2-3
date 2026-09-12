'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { format, isBefore, isToday, isTomorrow, differenceInDays, startOfDay } from 'date-fns';
import {
  Users,
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  BookOpen,
  Filter,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import TaskFilterWidget, { TaskFilterState } from '@/components/TaskFilterWidget';
import TaskImageCarousel from '@/components/TaskImageCarousel';
import { useParentStudent } from './ParentStudentContext';
import { Student } from '@/data/students';

export type Task = {
  id: string;
  subject: string;
  due_date: string;
  details: string;
  image_url: string | null;
  image_urls?: string[] | null;
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
    return { level: 'warning', text: 'ใกล้ถึงกำหนด', color: 'text-amber-700 bg-amber-100 border-amber-200' };
  } else {
    return { level: 'chill', text: 'ยังมีเวลา', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' };
  }
}

const COLUMNS = [
  { id: 'todo', title: 'ต้องทำ (Todo)' },
  { id: 'in_progress', title: 'กำลังทำ (In Progress)' },
  { id: 'done', title: 'เสร็จแล้ว (Done)' },
];

export default function ParentAssignmentsClient({ initialTasks }: { initialTasks: Task[] }) {
  const { selectedStudent, setIsSearchOpen } = useParentStudent();
  const [tasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'category'>('board');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [childFilter, setChildFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [studentCompletions, setStudentCompletions] = useState<Record<string, 'todo' | 'in_progress' | 'done'>>({});

  const [filterState, setFilterState] = useState<TaskFilterState>({
    period: 'year',
    date: new Date().toISOString().split('T')[0],
    sort: 'count',
  });

  // Fetch completions for the selected child
  const fetchCompletions = useCallback(async (silent = false) => {
    if (!selectedStudent?.student_id) return;
    try {
      if (!silent) setIsRefreshing(true);
      const res = await fetch(`/api/student-task-completion?studentId=${selectedStudent.student_id}`);
      const data = await res.json();
      if (data.success && data.completions) {
        setStudentCompletions((prev) => {
          if (silent) {
            // Check if any new task was completed in real time
            Object.keys(data.completions).forEach((tId) => {
              if (data.completions[tId] === 'done' && prev[tId] !== 'done') {
                const matchedTask = tasks.find((t) => t.id === tId);
                const taskName = matchedTask ? matchedTask.subject : 'การบ้าน';
                toast.success(
                  `น้อง${selectedStudent.nickname || selectedStudent.first_name} เพิ่งทำงานวิชา "${taskName}" เสร็จแล้ว! 🎉`,
                  {
                    duration: 6000,
                    style: {
                      borderRadius: '16px',
                      background: '#FFF1F2',
                      color: '#9F1239',
                      border: '1px solid #FECDD3',
                      fontWeight: 'bold',
                    },
                  }
                );
              }
            });
          }
          return data.completions;
        });
      }
    } catch (e) {
      console.warn('Failed to fetch student completions:', e);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, [selectedStudent?.student_id, tasks]);

  // Initial load & Polling for live updates
  useEffect(() => {
    if (selectedStudent?.student_id) {
      fetchCompletions(false);
      const interval = setInterval(() => {
        fetchCompletions(true);
      }, 4000);
      return () => clearInterval(interval);
    } else {
      setStudentCompletions({});
    }
  }, [selectedStudent?.student_id, fetchCompletions]);

  // Apply child completion status on top of base classroom tasks
  const activeTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'deleted')
      .map((t) => {
        if (!selectedStudent) return t;
        const childStatus = studentCompletions[t.id];
        if (childStatus) {
          return { ...t, status: childStatus };
        }
        return t;
      });
  }, [tasks, selectedStudent, studentCompletions]);

  const uniqueSubjects = useMemo(() => {
    const subjects = [...new Set(activeTasks.map((t) => t.subject))];
    return subjects.sort();
  }, [activeTasks]);

  // Filter tasks based on TaskFilterWidget & Child Filter
  const filteredActiveTasks = useMemo(() => {
    let result = [...activeTasks];

    // Child status filter (all | pending | done)
    if (selectedStudent && childFilter === 'pending') {
      result = result.filter((t) => t.status !== 'done');
    } else if (selectedStudent && childFilter === 'done') {
      result = result.filter((t) => t.status === 'done');
    }

    if (filterState.period === 'daily') {
      result = result.filter((t) => t.due_date && t.due_date.startsWith(filterState.date));
    } else if (filterState.period === 'monthly') {
      const targetMonth = filterState.date.substring(0, 7);
      result = result.filter((t) => t.due_date && t.due_date.startsWith(targetMonth));
    }

    if (filterState.sort === 'name') {
      result.sort((a, b) => a.subject.localeCompare(b.subject, 'th'));
    } else if (filterState.sort === 'latest') {
      result.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
    } else if (filterState.sort === 'count') {
      result.sort((a, b) => {
        const scoreA = a.max_score || 0;
        const scoreB = b.max_score || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    }

    return result;
  }, [activeTasks, filterState, childFilter, selectedStudent]);

  const categoryGroups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered =
      filterSubject === 'all'
        ? filteredActiveTasks
        : filteredActiveTasks.filter((t) => t.subject === filterSubject);

    const overdue: Task[] = [];
    const urgent: Task[] = [];
    const far: Task[] = [];
    const done: Task[] = [];

    filtered.forEach((task) => {
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
  }, [filteredActiveTasks, filterSubject]);

  const tasksByColumn = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      tasks: filteredActiveTasks.filter((task) => task.status === col.id),
    }));
  }, [filteredActiveTasks]);

  const sortedTasks = useMemo(() => {
    return filteredActiveTasks;
  }, [filteredActiveTasks]);

  // Overall & Child Statistics
  const totalTasks = activeTasks.length;
  const doneTasks = activeTasks.filter((t) => t.status === 'done').length;
  const pendingTasks = totalTasks - doneTasks;
  const overdueTasks = activeTasks.filter((t) => {
    if (t.status === 'done') return false;
    const due = new Date(t.due_date);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(due, today);
  }).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Child Status Banner (White & Pink Aesthetic) */}
      {selectedStudent ? (
        <div className="mb-6 rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-rose-50/90 via-pink-50/60 to-white border border-pink-200/80 shadow-[0_4px_24px_rgba(244,63,94,0.06)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white border border-pink-200 shadow-xs p-1.5 flex items-center justify-center shrink-0">
                <img
                  src={selectedStudent.prefix === 'ด.ญ.' ? '/asset/student-girl.webp' : '/asset/student-boy.webp'}
                  alt={selectedStudent.nickname}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    น้อง{selectedStudent.first_name} {selectedStudent.last_name} ({selectedStudent.nickname})
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white text-rose-600 border border-pink-200 shadow-2xs">
                    เลขที่ {selectedStudent.student_no}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ซิงค์สดอัตโนมัติ
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  ทำเสร็จแล้ว <strong className="text-emerald-600">{doneTasks}</strong> จากทั้งหมด {totalTasks} งาน ({progress}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => fetchCompletions(false)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-rose-50/60 text-rose-700 text-xs font-semibold border border-pink-200 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                title="รีเฟรชข้อมูลสถานะงานล่าสุด"
              >
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                <span>{isRefreshing ? 'กำลังอัปเดต...' : 'รีเฟรช'}</span>
              </button>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <span>เปลี่ยนนักเรียน</span>
              </button>
            </div>
          </div>

          {/* Child Progress Bar */}
          <div className="mt-4 pt-3 border-t border-pink-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="w-full sm:flex-1">
              <div className="w-full bg-pink-100/60 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 to-pink-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex items-center gap-1.5 shrink-0 text-xs">
              <button
                onClick={() => setChildFilter('all')}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  childFilter === 'all'
                    ? 'bg-rose-500 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-pink-100 hover:bg-pink-50'
                }`}
              >
                ทั้งหมด ({totalTasks})
              </button>
              <button
                onClick={() => setChildFilter('pending')}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  childFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-pink-100 hover:bg-pink-50'
                }`}
              >
                ยังไม่ทำ ({pendingTasks})
              </button>
              <button
                onClick={() => setChildFilter('done')}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  childFilter === 'done'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-pink-100 hover:bg-pink-50'
                }`}
              >
                เสร็จแล้ว ({doneTasks})
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Prompt when no student is selected */
        <div className="mb-6 rounded-3xl p-5 bg-gradient-to-r from-rose-50 via-pink-50 to-white border border-pink-200/70 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                ต้องการดูว่าลูกของคุณทำงานชิ้นไหนเสร็จแล้วบ้าง?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                แตะเพื่อเลือกลูกหลานของคุณ ระบบจะแสดงสถานะการส่งงานของลูกแบบสดๆ ทันที
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            🔍 เลือกลูกของคุณ
          </button>
        </div>
      )}

      {/* Top Header & View Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">กระดานการบ้านและชิ้นงาน</h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
              ม.2/3
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {selectedStudent
              ? `กำลังติดตามการบ้านของน้อง${selectedStudent.nickname} และความคืบหน้ารวม`
              : 'ติดตามสถานะงาน กำหนดส่ง และการบ้านทั้งหมดของห้องเรียน'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto justify-end">
          <TaskFilterWidget filterState={filterState} onChange={setFilterState} />

          <div className="bg-slate-200/70 p-1 rounded-xl flex gap-0.5 border border-slate-200/60 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'board' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              กระดาน
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ติ๊ก
            </button>
            <button
              onClick={() => setViewMode('category')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'category' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              หมวดหมู่
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Overview Cards */}
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
          <span className="text-emerald-600 font-medium mb-2">
            {selectedStudent ? `น้อง${selectedStudent.nickname} เคลียร์แล้ว` : 'เคลียร์แล้ว'}
          </span>
          <div className="text-4xl font-extrabold text-emerald-600">{doneTasks}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center gap-2">
          <div className="flex justify-between items-end mb-1">
            <span className="text-rose-600 font-bold">
              {selectedStudent ? `ความคืบหน้าน้อง${selectedStudent.nickname}` : 'ความคืบหน้า'}
            </span>
            <span className="text-2xl font-bold text-rose-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-rose-500 to-pink-500 h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div
                className="absolute inset-0 bg-white/20 w-full h-full"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', animation: 'shimmer 2s infinite' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. KANBAN BOARD VIEW                                          */}
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
                        selectedStudent={selectedStudent}
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
        /* 2. CATEGORY VIEW                                              */
        /* ───────────────────────────────────────────────────────────── */
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 pb-2">
            <button
              onClick={() => setFilterSubject('all')}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                filterSubject === 'all' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทุกวิชา
            </button>
            {uniqueSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setFilterSubject(subject)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  filterSubject === subject ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>

          {categoryGroups.overdue.length > 0 && (
            <CategorySection
              title="🚨 เลยกำหนดแล้ว"
              tasks={categoryGroups.overdue}
              color="red"
              onTaskClick={setSelectedTask}
            />
          )}

          <CategorySection
            title="⚡ ส่งเร็วๆ นี้ (7 วันหน้า)"
            tasks={categoryGroups.urgent}
            color="amber"
            onTaskClick={setSelectedTask}
            emptyText="ไม่มีงานที่ต้องส่งใน 7 วันนี้ 🎉"
          />

          <CategorySection
            title="📅 อีกยาวไกล (มากกว่า 7 วัน)"
            tasks={categoryGroups.far}
            color="slate"
            onTaskClick={setSelectedTask}
            emptyText="ไม่มีงานระยะยาว"
          />

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
        /* 3. LIST VIEW                                                  */
        /* ───────────────────────────────────────────────────────────── */
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="space-y-3">
            {sortedTasks.map((task) => {
              const isDone = task.status === 'done';
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    isDone ? 'bg-emerald-50/20 border-emerald-200/60' : 'bg-white border-slate-200 shadow-sm hover:border-pink-300'
                  }`}
                >
                  <div className="pt-1">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isDone && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`font-bold text-lg mb-1 truncate ${isDone ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {task.subject}
                      </h4>
                      {selectedStudent && (
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                            isDone ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isDone ? `น้อง${selectedStudent.nickname} ทำเสร็จแล้ว` : 'ยังไม่เสร็จ'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">{task.details}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                        กำหนด: {new Date(task.due_date).toLocaleDateString('th-TH')}
                      </span>
                      {task.teacher_name && (
                        <span className="text-slate-400">คนสั่ง: {task.teacher_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {sortedTasks.length === 0 && (
              <div className="text-center py-12 text-slate-500">ไม่มีงานในระบบ</div>
            )}
          </div>
        </div>
      )}

      {/* Task Modal */}
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
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 pr-4">{selectedTask.subject}</h3>
                    {selectedStudent && (
                      <span
                        className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          selectedTask.status === 'done'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {selectedTask.status === 'done' ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>น้อง{selectedStudent.nickname} ทำงานนี้เสร็จแล้ว 🎉</span>
                          </>
                        ) : (
                          <>
                            <Clock size={13} />
                            <span>น้อง{selectedStudent.nickname} ยังทำงานนี้ไม่เสร็จ</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {((selectedTask.image_urls && selectedTask.image_urls.length > 0) || selectedTask.image_url) && (
                    <div className="mb-4">
                      <TaskImageCarousel
                        images={
                          selectedTask.image_urls && selectedTask.image_urls.length > 0
                            ? selectedTask.image_urls
                            : [selectedTask.image_url!]
                        }
                        alt={selectedTask.subject}
                      />
                    </div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      รายละเอียด
                    </span>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selectedTask.details}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-xs font-semibold text-slate-400 block mb-1">กำหนดส่ง</span>
                      <span className="font-bold text-slate-800 text-base">
                        {new Date(selectedTask.due_date).toLocaleDateString('th-TH', { dateStyle: 'short' })}
                      </span>
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
                      <span className="font-bold text-slate-800 text-base">
                        {selectedTask.max_score ? `${selectedTask.max_score} คะแนน` : '-'}
                      </span>
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

              <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-colors shadow-sm"
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

// ─── Student TaskCard Component with Child Status Badge ──────────────────────
function StudentTaskCard({
  task,
  onClick,
  selectedStudent,
}: {
  task: Task;
  onClick: (task: Task) => void;
  selectedStudent: Student | null;
}) {
  const dueDate = new Date(task.due_date);
  const urgency = getUrgency(task);
  const isDone = task.status === 'done';

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
      className={`bg-white rounded-xl p-4 shadow-sm border transition-all cursor-pointer ${
        isDone
          ? 'border-emerald-200/80 bg-emerald-50/10'
          : urgency?.level === 'critical'
          ? 'border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
          : 'border-slate-200 hover:shadow-md'
      }`}
    >
      {/* Urgency Badge */}
      {urgency && (
        <div className="mb-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${urgency.color}`}>
            {urgency.text}
          </span>
        </div>
      )}

      {/* Image Preview */}
      {((task.image_urls && task.image_urls.length > 0) || task.image_url) && (
        <div
          onClick={handleImageClick}
          className="w-full h-32 rounded-lg mb-3 overflow-hidden border border-slate-100 group relative cursor-pointer"
        >
          <img
            src={(task.image_urls && task.image_urls[0]) || task.image_url!}
            alt={task.subject}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          {task.image_urls && task.image_urls.length > 1 && (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 shadow-sm z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              {task.image_urls.length} รูป
            </span>
          )}
        </div>
      )}

      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-slate-800 line-clamp-2 leading-tight ${isDone ? 'line-through text-slate-500' : ''}`}>
            {task.subject}
          </h4>
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

      {/* Child Status Indicator Badge */}
      {selectedStudent && (
        <div className="mb-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
          {isDone ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>น้อง{selectedStudent.nickname} ทำเสร็จแล้ว ✅</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
              <Clock size={11} className="text-rose-500" />
              <span>น้อง{selectedStudent.nickname} ยังไม่เสร็จ</span>
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs mt-auto pt-2 border-t border-slate-100">
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

// ─── CategorySection Component ────────────────────────────────────────────────
type CategorySectionProps = {
  title: string;
  tasks: Task[];
  color: 'red' | 'amber' | 'slate' | 'emerald';
  onTaskClick: (task: Task) => void;
  emptyText?: string;
};

const COLOR_MAP = {
  red: { section: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-700', header: 'text-red-700' },
  amber: { section: 'border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-700', header: 'text-amber-700' },
  slate: { section: 'border-slate-200 bg-slate-50', badge: 'bg-slate-100 text-slate-600', header: 'text-slate-600' },
  emerald: { section: 'border-emerald-100 bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-700', header: 'text-emerald-700' },
};

function CategorySection({ title, tasks, color, onTaskClick, emptyText }: CategorySectionProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const c = COLOR_MAP[color];

  return (
    <div className={`rounded-2xl border ${c.section} overflow-hidden`}>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:brightness-95 transition"
      >
        <span className={`font-bold text-sm ${c.header} flex items-center gap-2`}>
          {title}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
            {tasks.length}
          </span>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${collapsed ? '-rotate-90' : ''} text-slate-400`}
        >
          <path d="m6 9 6 6 6-6" />
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
                tasks.map((task) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className={`flex items-start gap-3 bg-white rounded-xl border px-4 py-3 cursor-pointer shadow-sm transition-all hover:border-pink-300 ${
                      task.status === 'done' ? 'opacity-60' : ''
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                      }`}
                    >
                      {task.status === 'done' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
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
