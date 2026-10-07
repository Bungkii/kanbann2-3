'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Clock,
  Mic,
  AlertTriangle,
  Lock,
  ChevronLeft,
  FileText,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import studentsData from '@/data/students.json';
import toast from 'react-hot-toast';

interface Student {
  student_id: string;
  student_no: number;
  prefix?: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  full_name?: string;
}

const STORAGE_KEY = 'prim_voter_identity_locked';

interface VoteClientProps {
  initialStudent?: Student | null;
}

export default function VoteClient({ initialStudent }: VoteClientProps) {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(initialStudent || null);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [inputError, setInputError] = useState(false);
  const [isLocked, setIsLocked] = useState(!!initialStudent);

  // Live state from server / Flask / Supabase
  const [agenda, setAgenda] = useState('ระเบียบวาระที่ ๑ เรื่องที่ประธานแจ้งให้ที่ประชุมทราบ');
  const [controlMode, setControlMode] = useState<'QUORUM' | 'VOTE'>('QUORUM');
  const [displayMode, setDisplayMode] = useState('QUORUM');
  const [isSystemOpen, setIsSystemOpen] = useState(true);
  const [timerStatus, setTimerStatus] = useState('STOPPED');
  const [timerStr, setTimerStr] = useState('15:00');
  const [remainingSeconds, setRemainingSeconds] = useState(900);
  const [hasCheckedQuorum, setHasCheckedQuorum] = useState(false);
  const [myVote, setMyVote] = useState<string>('NONE');
  const [currentSpeaker, setCurrentSpeaker] = useState('');
  const [isInSpeakerQueue, setIsInSpeakerQueue] = useState(false);
  const [motionText, setMotionText] = useState('');
  const [recheckCounter, setRecheckCounter] = useState(0);
  const lastRecheckSeen = useRef(0);

  // 1. Check LocalStorage and initialStudent on Mount
  useEffect(() => {
    if (initialStudent && initialStudent.student_id) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialStudent));
      setCurrentStudent(initialStudent);
      setIsLocked(true);
      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.student_id) {
          setCurrentStudent(parsed);
          setIsLocked(true);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [initialStudent]);

  // 2. Student ID Search & Match
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
    setStudentIdInput(val);

    if (val.length === 5) {
      const match = (studentsData as Student[]).find((s) => s.student_id === val);
      if (match) {
        setPreviewStudent(match);
        setInputError(false);
      } else {
        setPreviewStudent(null);
        setInputError(true);
      }
    } else {
      setPreviewStudent(null);
      setInputError(false);
    }
  };

  // 3. Confirm Identity (Lock permanently to LocalStorage)
  const handleConfirmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewStudent) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(previewStudent));
    setCurrentStudent(previewStudent);
    setIsLocked(true);
    toast.success(`ยินดีต้อนรับ ${previewStudent.full_name || previewStudent.first_name} ผูกเครื่องแล้ว!`);
  };

  // 4. Polling Loop: Sync with /api/parliament (and python port 5000 if active)
  useEffect(() => {
    if (!currentStudent) return;

    let isMounted = true;
    const fetchState = async () => {
      try {
        let res: Response | null = null;
        try {
          res = await fetch(
            `http://localhost:5000/api/state?student_id=${currentStudent.student_id}&student_no=${currentStudent.student_no}`,
            { cache: 'no-store' }
          );
        } catch {
          res = await fetch(
            `/api/parliament?student_id=${currentStudent.student_id}&student_no=${currentStudent.student_no}`,
            { cache: 'no-store' }
          );
        }

        if (res && res.ok && isMounted) {
          const data = await res.json();
          if (data.agenda) setAgenda(data.agenda);
          if (data.control_mode) setControlMode(data.control_mode);
          if (data.display_mode) setDisplayMode(data.display_mode);
          if (typeof data.is_system_open === 'boolean') setIsSystemOpen(data.is_system_open);
          if (data.timer_status) setTimerStatus(data.timer_status);
          if (data.timer_str) setTimerStr(data.timer_str);
          if (typeof data.remaining_seconds === 'number') setRemainingSeconds(data.remaining_seconds);
          if (typeof data.has_checked_quorum === 'boolean') setHasCheckedQuorum(data.has_checked_quorum);
          if (data.my_vote) setMyVote(data.my_vote);
          if (data.current_speaker !== undefined) setCurrentSpeaker(data.current_speaker);
          if (typeof data.is_in_speaker_queue === 'boolean') setIsInSpeakerQueue(data.is_in_speaker_queue);
          if (data.motion_text !== undefined) setMotionText(data.motion_text);

          // 3-Click Recheck Quorum Trigger
          if (data.recheck_quorum_counter && data.recheck_quorum_counter > lastRecheckSeen.current) {
            lastRecheckSeen.current = data.recheck_quorum_counter;
            setRecheckCounter(data.recheck_quorum_counter);
            setHasCheckedQuorum(false);
            toast.error('⚠️ ประธานสั่งตรวจสอบองค์ประชุมใหม่ กรุณากดแสดงตน!', {
              duration: 5000,
            });
          }
        }
      } catch {
        // silent sync retry
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentStudent]);

  // 5. Actions: Quorum Click
  const handleCheckQuorum = async () => {
    if (!currentStudent || !isSystemOpen) return;
    try {
      setHasCheckedQuorum(true);
      try {
        await fetch('http://localhost:5000/api/student/quorum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: currentStudent.student_id,
            student_no: currentStudent.student_no,
            student_name: currentStudent.full_name || currentStudent.first_name,
            status: true,
          }),
        });
      } catch {
        await fetch('/api/parliament', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'quorum',
            student_id: currentStudent.student_id,
            student_no: currentStudent.student_no,
            student_name: currentStudent.full_name || currentStudent.first_name,
            status: true,
          }),
        });
      }
      toast.success('แสดงตนยืนยันองค์ประชุมเรียบร้อยแล้ว');
    } catch {
      toast.error('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
    }
  };

  // 6. Actions: Vote Choice (APPROVE, DISAPPROVE, ABSTAIN)
  const handleVote = async (choice: 'APPROVE' | 'DISAPPROVE' | 'ABSTAIN') => {
    if (!currentStudent || !isSystemOpen) return;
    try {
      setMyVote(choice);
      try {
        await fetch('http://localhost:5000/api/student/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: currentStudent.student_id,
            student_no: currentStudent.student_no,
            student_name: currentStudent.full_name || currentStudent.first_name,
            choice,
          }),
        });
      } catch {
        await fetch('/api/parliament', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'vote',
            student_id: currentStudent.student_id,
            student_no: currentStudent.student_no,
            student_name: currentStudent.full_name || currentStudent.first_name,
            choice,
          }),
        });
      }

      const label = choice === 'APPROVE' ? 'เห็นด้วย' : choice === 'DISAPPROVE' ? 'ไม่เห็นด้วย' : 'งดออกเสียง';
      toast.success(`บันทึก: ${label}`);
    } catch {
      toast.error('เกิดข้อผิดพลาดในการลงมติ กรุณาลองใหม่');
    }
  };

  // 7. Actions: Speaker Queue
  const handleToggleSpeakerQueue = async () => {
    if (!currentStudent) return;
    try {
      const nextState = !isInSpeakerQueue;
      setIsInSpeakerQueue(nextState);
      try {
        await fetch('http://localhost:5000/api/student/speaker_queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: currentStudent.student_id,
            student_name: currentStudent.full_name || currentStudent.first_name,
          }),
        });
      } catch {
        await fetch('/api/parliament', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'speaker_queue',
            student_id: currentStudent.student_id,
          }),
        });
      }
      toast.success(nextState ? 'เข้าคิวขออภิปรายแล้ว' : 'ยกเลิกคิวขออภิปรายแล้ว');
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative font-sans selection:bg-indigo-500 selection:text-white">
      {/* Back button matching exact Primjaa login page */}
      <Link
        href="/"
        className="absolute left-6 top-6 sm:left-8 sm:top-8 py-2 px-4 rounded-lg no-underline text-slate-700 bg-slate-200 hover:bg-slate-300 flex items-center gap-1.5 text-sm font-medium transition-all shadow-2xs group cursor-pointer"
      >
        <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
        <span>Back</span>
      </Link>

      <div className="w-full max-w-md my-auto">
        {/* ─── SCREEN 1: LOGIN & STUDENT ID BINDING (Exact LoginForm Layout) ─── */}
        {!isLocked || !currentStudent ? (
          <form
            onSubmit={handleConfirmLogin}
            className="animate-in flex flex-col w-full justify-center text-slate-700"
          >
            <h1 className="text-3xl font-bold mb-6 text-center text-slate-800 tracking-tight">
              เข้าสู่ระบบลงมติ
            </h1>

            {/* Username / Student ID Field */}
            <label className="text-sm font-semibold mb-1 text-slate-700" htmlFor="voter-id">
              เลขประจำตัวนักเรียน (Student ID)
            </label>
            <input
              id="voter-id"
              name="voter-id"
              type="text"
              value={studentIdInput}
              onChange={handleIdChange}
              placeholder="เช่น 30233 หรือเลขประจำตัว 5 หลัก"
              required
              autoFocus
              autoComplete="username"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              className="rounded-xl px-4 py-2.5 bg-white border border-slate-300 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all text-slate-900 placeholder:text-slate-400 font-mono text-center text-lg font-bold"
            />

            {/* Student Match Preview Card (Exact Primjaa Style) */}
            {previewStudent && (
              <div className="mb-3 rounded-2xl border border-pink-100 bg-rose-50/40 p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center shrink-0">
                  {String(previewStudent.student_no).padStart(2, '0')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {previewStudent.full_name || `${previewStudent.first_name} ${previewStudent.last_name}`}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    เลขที่ {previewStudent.student_no} • {previewStudent.nickname ? `ชื่อเล่น ${previewStudent.nickname}` : 'ห้อง ม.2/3'}
                  </p>
                </div>
              </div>
            )}

            {inputError && (
              <p className="mb-3 p-3 bg-red-100 text-red-900 text-center rounded-xl text-xs font-medium">
                ไม่พบเลขประจำตัวนักเรียนนี้ในฐานข้อมูลห้อง ม.2/3
              </p>
            )}

            {/* Submit Button (Exact SubmitButton layout) */}
            <button
              type="submit"
              disabled={!previewStudent}
              className="bg-indigo-600 text-white rounded-xl px-4 py-3 mt-1 mb-2 hover:bg-indigo-700 font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full cursor-pointer"
            >
              <UserCheck size={18} />
              <span>ยืนยันตัวตนเข้าระบบ</span>
            </button>

            <div className="mt-3 p-3 rounded-xl border border-slate-200 bg-white text-slate-500 text-xs flex items-center gap-2">
              <Lock size={14} className="shrink-0 text-slate-400" />
              <span>ผูกบัญชีถาวรกับอุปกรณ์นี้ ไม่สามารถล็อกเอาท์ได้</span>
            </div>
          </form>
        ) : (
          /* ─── SCREEN 2: ACTIVE PARLIAMENT VOTER CLIENT ─── */
          <div className="animate-in flex flex-col w-full justify-center text-slate-700 space-y-4">
            {/* Header: Exact Primjaa Typography */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                ระบบลงมติห้อง ม.2/3
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                การประชุมสภาห้องเรียน ม.2/3
              </p>
            </div>

            {/* Voter Profile Bar */}
            <div className="bg-white rounded-xl px-4 py-3 border border-slate-300 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {String(currentStudent.student_no).padStart(2, '0')}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {currentStudent.full_name || `${currentStudent.first_name} ${currentStudent.last_name}`}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ID: {currentStudent.student_id} • เลขที่ {currentStudent.student_no}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                <ShieldCheck size={12} className="text-indigo-600" />
                ผูกเครื่องแล้ว
              </span>
            </div>

            {/* 3-Click Recheck Quorum Alert */}
            {recheckCounter > 0 && !hasCheckedQuorum && (
              <div className="p-3.5 bg-red-100 text-red-900 rounded-xl text-xs font-medium flex items-center gap-2 animate-bounce">
                <AlertTriangle size={16} className="shrink-0 text-red-600" />
                <span>ประธานสั่งตรวจสอบองค์ประชุมใหม่ กรุณากดแสดงตนด้านล่าง</span>
              </div>
            )}

            {/* Agenda Banner */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-300 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-indigo-600 uppercase">
                  วาระปัจจุบัน
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    isSystemOpen
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {isSystemOpen ? 'เปิดระบบ' : 'ปิดระบบ'}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-800 leading-snug">{agenda}</p>
            </div>

            {/* Timer Box (Clean Primjaa Palette) */}
            <div className="bg-slate-800 text-white rounded-2xl p-4 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1 text-xs text-slate-300 mb-1">
                <Clock size={13} className="text-slate-400" />
                <span>เวลาคงเหลือ</span>
              </div>
              <div className="font-mono text-4xl font-bold tracking-wider my-0.5 text-white">
                {timerStr}
              </div>
              <p className="text-[11px] text-slate-400">
                {timerStatus === 'RUNNING'
                  ? 'กำลังนับถอยหลัง'
                  : timerStatus === 'PAUSED'
                  ? 'หยุดเวลาชั่วคราว'
                  : 'ยังไม่ได้เริ่มนับ'}
              </p>
            </div>

            {/* ─── STRICT MODE A: QUORUM (แสดงตน) ─── */}
            {(controlMode === 'QUORUM' || displayMode === 'QUORUM') && (
              <div className="bg-white rounded-xl p-4 border border-slate-300 shadow-2xs">
                <button
                  type="button"
                  onClick={handleCheckQuorum}
                  disabled={!isSystemOpen}
                  className={`w-full rounded-xl py-4 px-4 font-semibold text-sm flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    hasCheckedQuorum
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                  }`}
                >
                  <span className="text-base font-bold">
                    {hasCheckedQuorum ? '✓ ท่านแสดงตนแล้ว' : 'กดเพื่อแสดงตน (ยืนยันองค์ประชุม)'}
                  </span>
                  <span className="text-[11px] opacity-90 font-normal">
                    {hasCheckedQuorum ? 'สถานะ: อยู่ในห้องประชุม' : 'แตะเพื่อบันทึกสถานะการเข้าประชุม'}
                  </span>
                </button>
              </div>
            )}

            {/* ─── STRICT MODE B: VOTE (3 BUTTONS) ─── */}
            {controlMode === 'VOTE' && (
              <div className="bg-white rounded-xl p-4 border border-slate-300 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>การลงมติ:</span>
                  <span className="text-indigo-600 font-bold">
                    {myVote === 'APPROVE'
                      ? 'เห็นด้วย'
                      : myVote === 'DISAPPROVE'
                      ? 'ไม่เห็นด้วย'
                      : myVote === 'ABSTAIN'
                      ? 'งดออกเสียง'
                      : 'ยังไม่ได้ลงคะแนน'}
                  </span>
                </div>

                {/* เห็นด้วย (Green) */}
                <button
                  type="button"
                  onClick={() => handleVote('APPROVE')}
                  disabled={!isSystemOpen}
                  className={`w-full rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-between transition-all cursor-pointer ${
                    myVote === 'APPROVE'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  <span>เห็นด้วย (Approve)</span>
                  <span className="text-lg">🟢</span>
                </button>

                {/* ไม่เห็นด้วย (Red) */}
                <button
                  type="button"
                  onClick={() => handleVote('DISAPPROVE')}
                  disabled={!isSystemOpen}
                  className={`w-full rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-between transition-all cursor-pointer ${
                    myVote === 'DISAPPROVE'
                      ? 'bg-rose-600 text-white ring-2 ring-rose-300'
                      : 'bg-rose-500 hover:bg-rose-600 text-white'
                  }`}
                >
                  <span>ไม่เห็นด้วย (Disapprove)</span>
                  <span className="text-lg">🔴</span>
                </button>

                {/* งดออกเสียง (Yellow) */}
                <button
                  type="button"
                  onClick={() => handleVote('ABSTAIN')}
                  disabled={!isSystemOpen}
                  className={`w-full rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-between transition-all cursor-pointer ${
                    myVote === 'ABSTAIN'
                      ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                      : 'bg-amber-400 hover:bg-amber-500 text-slate-900'
                  }`}
                >
                  <span>งดออกเสียง (Abstain)</span>
                  <span className="text-lg">🟡</span>
                </button>
              </div>
            )}

            {/* ─── DRAFT MOTION VIEW (MIRRORED LIVE FROM ADMIN) ─── */}
            {(displayMode === 'MOTION' || motionText.trim().length > 0) && (
              <div className="bg-white rounded-xl p-4 border border-slate-300 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                  <FileText size={14} className="text-slate-500" />
                  <span>ร่างมติที่กำลังพิจารณา:</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {motionText || '- ไม่มีร่างมติในขณะนี้ -'}
                </div>
              </div>
            )}

            {/* ─── SPEAKER DEBATE QUEUE ─── */}
            <div className="bg-white rounded-xl p-4 border border-slate-300 shadow-2xs">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mic size={14} className="text-indigo-600" />
                  <span>ขออภิปราย</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {currentSpeaker ? `กำลังพูด: ${currentSpeaker}` : 'ว่าง'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleSpeakerQueue}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                  isInSpeakerQueue
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{isInSpeakerQueue ? '✓ อยู่ในคิวขออภิปรายแล้ว' : 'ขอยกมืออภิปราย (ต่อคิว)'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
