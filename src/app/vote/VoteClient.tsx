'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Vote,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Mic,
  AlertTriangle,
  Lock,
  ChevronLeft,
  FileText,
  UserCheck,
  ShieldCheck,
  RefreshCw,
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
    // If user already logged in to Primjaa web session, auto-lock immediately
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
    toast.success(`ยินดีต้อนรับ ${previewStudent.full_name || previewStudent.first_name} ผูกเครื่องแล้ว!`, {
      icon: '🔒',
    });
  };

  // 4. Polling Loop: Sync with /api/parliament (and python port 5000 if active)
  useEffect(() => {
    if (!currentStudent) return;

    let isMounted = true;
    const fetchState = async () => {
      try {
        // Try local Flask server first if available, else standard next.js route
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
              duration: 6000,
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
      // Try Flask then Next API
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
      toast.success('แสดงตนยืนยันองค์ประชุมเรียบร้อยแล้ว!', { icon: '✅' });
    } catch {
      toast.error('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
    }
  };

  // 6. Actions: Vote Choice (APPROVE, DISAPPROVE, ABSTAIN)
  const handleVote = async (choice: 'APPROVE' | 'DISAPPROVE' | 'ABSTAIN') => {
    if (!currentStudent || !isSystemOpen) return;
    try {
      setMyVote(choice);
      // Try Flask then Next API
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
      toast.success(`ลงมติ "${label}" บันทึกแล้ว!`, { icon: '🗳️' });
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
      toast.success(nextState ? 'เข้าคิวขออภิปรายแล้ว!' : 'ยกเลิกคิวขออภิปรายแล้ว');
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 py-10 relative font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Back Navigation to Primjaa Home */}
      <Link
        href="/"
        className="absolute left-6 top-6 sm:left-8 sm:top-8 py-2 px-4 rounded-xl no-underline text-slate-700 bg-slate-200 hover:bg-slate-300 flex items-center gap-1.5 text-sm font-medium transition-all shadow-2xs group cursor-pointer"
      >
        <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
        <span>หน้าแรกพริมจ๋า</span>
      </Link>

      <div className="w-full max-w-md my-auto">
        {/* Primjaa Logo Brand Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shadow-2xs mb-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>ห้อง ม.2/3 • ระบบพริมจ๋า VOTE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            ระบบลงมติ & แสดงตน
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            การประชุมสภาห้องเรียน ม.2/3 ชุดที่ ๑
          </p>
        </div>

        {/* ─── SCREEN 1: LOGIN & STUDENT ID BINDING ─── */}
        {!isLocked || !currentStudent ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col animate-in fade-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 text-center mb-1">
              เข้าสู่ระบบแสดงตน
            </h2>
            <p className="text-xs text-slate-500 text-center mb-6">
              กรุณาระบุเลขประจำตัวนักเรียน 5 หลัก เพื่อผูกอุปกรณ์นี้กับสิทธิ์ของท่าน
            </p>

            <form onSubmit={handleConfirmLogin}>
              <label className="text-sm font-semibold mb-1.5 text-slate-700 block" htmlFor="voter-id">
                เลขประจำตัวนักเรียน (5 หลัก)
              </label>
              <input
                id="voter-id"
                type="text"
                value={studentIdInput}
                onChange={handleIdChange}
                placeholder="เช่น 30233 หรือ 30260"
                maxLength={5}
                inputMode="numeric"
                pattern="[0-9]*"
                required
                autoFocus
                className="w-full rounded-2xl px-4 py-3 bg-white border border-slate-300 text-center font-mono text-xl font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all placeholder:text-slate-400 placeholder:text-sm placeholder:font-sans placeholder:tracking-normal mb-4"
              />

              {/* Student Found Preview Card */}
              {previewStudent && (
                <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 mb-4 flex items-center gap-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {String(previewStudent.student_no).padStart(2, '0')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-rose-950 truncate">
                      {previewStudent.full_name || `${previewStudent.first_name} ${previewStudent.last_name}`}
                    </p>
                    <p className="text-xs text-rose-700">
                      เลขที่ {previewStudent.student_no} • {previewStudent.nickname ? `ชื่อเล่น ${previewStudent.nickname}` : 'ห้อง ม.2/3'}
                    </p>
                  </div>
                </div>
              )}

              {inputError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl text-center mb-4 animate-in fade-in">
                  ไม่พบเลขประจำตัวนักเรียนนี้ในฐานข้อมูลห้อง ม.2/3
                </div>
              )}

              <button
                type="submit"
                disabled={!previewStudent}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl py-3.5 px-4 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck size={18} />
                <span>ยืนยันตัวตนเข้าระบบ</span>
              </button>
            </form>

            <div className="mt-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
              <Lock size={14} className="shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>มาตรการป้องกันการสวมสิทธิ์:</strong> เมื่อผูกบัญชีแล้ว เครื่องนี้จะไม่สามารถล็อกเอาท์ได้ เพื่อให้เป็นไปตามระเบียบการออกเสียงของสภาห้องเรียน
              </span>
            </div>
          </div>
        ) : (
          /* ─── SCREEN 2: ACTIVE VOTER CLIENT (LOCKED IN LOCAL STORAGE) ─── */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Bound Voter Identity Card */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {String(currentStudent.student_no).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {currentStudent.full_name || `${currentStudent.first_name} ${currentStudent.last_name}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    ID: {currentStudent.student_id} • เลขที่ {currentStudent.student_no} ({currentStudent.nickname || '-'})
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600">
                <ShieldCheck size={12} className="text-indigo-600" />
                <span>ผูกเครื่องแล้ว</span>
              </div>
            </div>

            {/* 3-Click Quorum Reset Alert Banner */}
            {recheckCounter > 0 && !hasCheckedQuorum && (
              <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl p-4 shadow-lg flex items-center gap-3 animate-bounce">
                <AlertTriangle size={24} className="shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-sm">ประธานสั่งตรวจสอบองค์ประชุมใหม่!</p>
                  <p className="opacity-90">กรุณากดปุ่มสีเขียวด้านล่างเพื่อยืนยันว่าท่านยังอยู่ในห้องประชุม</p>
                </div>
              </div>
            )}

            {/* Current Agenda & System Status */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase">
                  วาระการประชุมปัจจุบัน
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isSystemOpen
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {isSystemOpen ? '🟢 เปิดระบบ' : '🔴 ปิดระบบ'}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-snug">{agenda}</p>
            </div>

            {/* Central Countdown Timer Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-5 text-center shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 font-medium mb-1">
                <Clock size={14} className="text-rose-400" />
                <span>เวลาคงเหลือในการลงมติ / ประชุม</span>
              </div>
              <div
                className={`font-mono text-5xl font-extrabold tracking-wider my-1 ${
                  remainingSeconds < 0 ? 'text-red-400 animate-pulse' : 'text-white'
                }`}
              >
                {timerStr}
              </div>
              <p className="text-[11px] text-slate-400">
                {timerStatus === 'RUNNING'
                  ? '⏱️ ระบบกำลังนับถอยหลัง'
                  : timerStatus === 'PAUSED'
                  ? '⏸️ หยุดเวลาชั่วคราว (Paused)'
                  : '⏹️ ตัวจับเวลายังไม่เริ่มนับ'}
              </p>
            </div>

            {/* ─── MODE A: QUORUM (แสดงตน) ─── */}
            {(controlMode === 'QUORUM' || displayMode === 'QUORUM') && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md">
                <button
                  type="button"
                  onClick={handleCheckQuorum}
                  disabled={!isSystemOpen}
                  className={`w-full rounded-2xl p-6 text-white font-bold flex flex-col items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
                    hasCheckedQuorum
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-700 ring-4 ring-emerald-200'
                      : 'bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
                  }`}
                >
                  <CheckCircle2 size={36} />
                  <span className="text-xl">
                    {hasCheckedQuorum ? 'ท่านได้แสดงตนเรียบร้อยแล้ว' : 'กดเพื่อแสดงตน (ยืนยันองค์ประชุม)'}
                  </span>
                  <span className="text-xs font-normal opacity-90">
                    {hasCheckedQuorum ? 'สถานะ: อยู่ในห้องประชุมสภา' : 'แตะปุ่มสีเขียวนี้เพื่อบันทึกว่าท่านอยู่ในห้อง'}
                  </span>
                </button>
              </div>
            )}

            {/* ─── MODE B: VOTE (3 BIG BUTTONS) ─── */}
            {controlMode === 'VOTE' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>🗳️ เลือกการลงมติของท่าน:</span>
                  <span className="text-indigo-600">
                    {myVote === 'APPROVE'
                      ? '✓ เลือก: เห็นด้วย'
                      : myVote === 'DISAPPROVE'
                      ? '✓ เลือก: ไม่เห็นด้วย'
                      : myVote === 'ABSTAIN'
                      ? '✓ เลือก: งดออกเสียง'
                      : 'ยังไม่ได้ลงมติ'}
                  </span>
                </div>

                {/* 🟢 APPROVE (เห็นด้วย) */}
                <button
                  type="button"
                  onClick={() => handleVote('APPROVE')}
                  disabled={!isSystemOpen}
                  className={`w-full rounded-2xl p-4.5 text-white font-bold flex items-center justify-between shadow-sm transition-all active:scale-98 cursor-pointer ${
                    myVote === 'APPROVE'
                      ? 'bg-emerald-600 ring-4 ring-emerald-200 scale-101'
                      : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:brightness-105'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-lg font-bold">เห็นด้วย</div>
                    <div className="text-xs opacity-85 font-normal">เห็นชอบ / รับหลักการ (Approve)</div>
                  </div>
                  <span className="text-2xl">🟢</span>
                </button>

                {/* 🔴 DISAPPROVE (ไม่เห็นด้วย) */}
                <button
                  type="button"
                  onClick={() => handleVote('DISAPPROVE')}
                  disabled={!isSystemOpen}
                  className={`w-full rounded-2xl p-4.5 text-white font-bold flex items-center justify-between shadow-sm transition-all active:scale-98 cursor-pointer ${
                    myVote === 'DISAPPROVE'
                      ? 'bg-red-600 ring-4 ring-red-200 scale-101'
                      : 'bg-gradient-to-r from-red-500 to-rose-600 hover:brightness-105'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-lg font-bold">ไม่เห็นด้วย</div>
                    <div className="text-xs opacity-85 font-normal">ไม่เห็นชอบ / ปฏิเสธ (Disapprove)</div>
                  </div>
                  <span className="text-2xl">🔴</span>
                </button>

                {/* 🟡 ABSTAIN (งดออกเสียง) */}
                <button
                  type="button"
                  onClick={() => handleVote('ABSTAIN')}
                  disabled={!isSystemOpen}
                  className={`w-full rounded-2xl p-4.5 text-white font-bold flex items-center justify-between shadow-sm transition-all active:scale-98 cursor-pointer ${
                    myVote === 'ABSTAIN'
                      ? 'bg-amber-600 ring-4 ring-amber-200 scale-101'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-105'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-lg font-bold">งดออกเสียง</div>
                    <div className="text-xs opacity-85 font-normal">ไม่ออกเสียงในญัตตินี้ (Abstain)</div>
                  </div>
                  <span className="text-2xl">🟡</span>
                </button>
              </div>
            )}

            {/* ─── DRAFT MOTION VIEW (MIRRORED LIVE FROM ADMIN) ─── */}
            {(displayMode === 'MOTION' || motionText.trim().length > 0) && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                  <FileText size={16} className="text-amber-500" />
                  <span>ร่างมติ / ร่างข้อบัญญัติที่กำลังพิจารณา:</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
                  {motionText || '- ไม่มีร่างมติในขณะนี้ -'}
                </div>
              </div>
            )}

            {/* ─── SPEAKER DEBATE QUEUE ─── */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mic size={14} className="text-indigo-600" />
                  <span>การขออภิปรายในที่ประชุม</span>
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {currentSpeaker ? `กำลังพูด: ${currentSpeaker}` : 'ผู้พูด: ว่าง'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleSpeakerQueue}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all border-2 border-dashed flex items-center justify-center gap-2 cursor-pointer ${
                  isInSpeakerQueue
                    ? 'bg-amber-50 border-amber-400 text-amber-800'
                    : 'bg-white border-amber-300 text-amber-600 hover:bg-amber-50'
                }`}
              >
                <span>{isInSpeakerQueue ? '✓ ท่านอยู่ในคิวขออภิปรายแล้ว (รอเรียกคิว)' : '🙋‍♂️ ขอยกมืออภิปราย (กดเพื่อต่อคิวพูด)'}</span>
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-6 text-xs text-slate-400">
          พริมจ๋า ม.2/3 • ซิงค์ตรงกับจอ Smart Parliament
        </div>
      </div>
    </div>
  );
}
