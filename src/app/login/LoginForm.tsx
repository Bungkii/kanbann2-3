'use client';

import React, { useState, useTransition, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  login,
  getStudentSecurityQuestionAction,
  verifyAndResetWithSecurityAnswerAction,
} from './actions';
import SubmitButton from '@/components/SubmitButton';
import toast from 'react-hot-toast';
import {
  KeyRound,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  HelpCircle,
  RotateCcw,
  X,
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Sparkles,
  Heart,
  ArrowRight,
  BookOpen,
  Search,
  Check,
  Award,
} from 'lucide-react';
import { STUDENTS, Student } from '@/data/students';
import { formatStudentFullName, getStudentAvatar } from '@/app/parent/components/StudentCard';

interface LoginFormProps {
  initialMessage?: string;
}

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  SuperAdmin: { label: 'ยศ: ผู้ดูแลระบบสูงสุด (SuperAdmin)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  Admin: { label: 'ยศ: แอดมินห้อง (Admin)', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  Leader: { label: 'ยศ: หัวหน้าห้อง (Leader)', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  Finance: { label: 'ยศ: เหรัญญิก (Finance)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  Student: { label: 'ยศ: นักเรียน (Student)', color: 'bg-pink-50 text-pink-700 border-pink-200' },
};

// Known roles map for instant visual recognition
const KNOWN_ROLES: Record<string, string> = {
  '30260': 'SuperAdmin', // บุ้งกี๋
  '30314': 'Admin',      // พริม
  '30388': 'Admin',      // อัยย์
  '30419': 'Admin',      // ดินปืน
  '30320': 'Leader',     // ออสติน
  '30456': 'Finance',    // ตาล
};

export default function LoginForm({ initialMessage }: LoginFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'student' | 'parent'>('student');

  // Student mode state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recentStudentId, setRecentStudentId] = useState<string | null>(null);

  // Parent mode state
  const [parentSearch, setParentSearch] = useState('');
  const [selectedChild, setSelectedChild] = useState<Student | null>(null);

  // Forgot password modal state
  const [forgotStep, setForgotStep] = useState<'id' | 'answer'>('id');
  const [forgotStudentId, setForgotStudentId] = useState('');
  const [forgotStudentName, setForgotStudentName] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isChecking, startCheckingTransition] = useTransition();
  const [isResetting, startResetTransition] = useTransition();

  // Load recent student ID on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('last_student_id');
      if (saved) setRecentStudentId(saved);

      const parentSaved = localStorage.getItem('parent_selected_student');
      if (parentSaved) {
        const parsed = JSON.parse(parentSaved);
        if (parsed?.student_id) {
          const match = STUDENTS.find((s) => s.student_id === parsed.student_id);
          if (match) setSelectedChild(match);
        }
      }
    } catch {}
  }, []);

  // Live Student Detection as user types 5 digits
  const detectedStudent = useMemo(() => {
    const clean = username.trim();
    if (clean.length >= 4) {
      return STUDENTS.find((s) => s.student_id === clean) || null;
    }
    return null;
  }, [username]);

  // Filter children for parent tab
  const filteredChildren = useMemo(() => {
    const q = parentSearch.trim().toLowerCase();
    if (!q) return STUDENTS.slice(0, 6);
    return STUDENTS.filter((s) => {
      return (
        s.student_id.includes(q) ||
        s.student_no.toString() === q ||
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        s.nickname.toLowerCase().includes(q) ||
        s.full_name.toLowerCase().includes(q)
      );
    }).slice(0, 6);
  }, [parentSearch]);

  const handleSelectRecent = (id: string) => {
    setUsername(id);
    const match = STUDENTS.find((s) => s.student_id === id);
    if (match) {
      toast.success(`เลือก ${match.first_name} (${match.nickname}) แล้ว`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (username.trim()) {
      try {
        localStorage.setItem('last_student_id', username.trim());
      } catch {}
    }
  };

  const handleParentLogin = () => {
    if (selectedChild) {
      try {
        localStorage.setItem('parent_selected_student', JSON.stringify(selectedChild));
      } catch {}
      toast.success(`เข้าสู่ระบบในฐานะผู้ปกครองน้อง${selectedChild.nickname} สำเร็จ!`);
    }
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname.includes('primjaa') || !window.location.hostname.includes('kanbann'))
    ) {
      window.location.href = 'https://kanbann.bungkii.app';
    } else {
      router.push('/');
    }
  };

  const handleOpenForgotModal = () => {
    setForgotStep('id');
    setForgotStudentId(username.trim());
    setForgotStudentName('');
    setSecurityQuestion(null);
    setSecurityAnswer('');
    setNewResetPassword('');
    setForgotError(null);
    setShowForgotModal(true);
  };

  const handleCheckStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = forgotStudentId.trim();
    if (!cleanId) {
      setForgotError('กรุณากรอกเลขประจำตัวนักเรียน');
      return;
    }

    setForgotError(null);
    startCheckingTransition(async () => {
      const res = await getStudentSecurityQuestionAction(cleanId);
      if (!res.exists) {
        setForgotError(res.error || `ไม่พบเลขประจำตัวนักเรียน ${cleanId} ในระบบ`);
        return;
      }

      setForgotStudentName(res.studentName || '');

      if (!res.question) {
        setForgotError(
          'นักเรียนคนนี้ยังไม่ได้ตั้งคำถามความปลอดภัย กรุณาติดต่อขอรีเซ็ตรหัสผ่านกับ ผู้ดูแลระบบ'
        );
        return;
      }

      setSecurityQuestion(res.question);
      setForgotStep('answer');
    });
  };

  const handleVerifyAnswerAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityAnswer.trim()) {
      setForgotError('กรุณากรอกคำตอบสำหรับคำถามความปลอดภัย');
      return;
    }

    if (newResetPassword && newResetPassword.trim().length < 4) {
      setForgotError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    setForgotError(null);
    startResetTransition(async () => {
      const res = await verifyAndResetWithSecurityAnswerAction(
        forgotStudentId,
        securityAnswer,
        newResetPassword
      );

      if (res.success) {
        toast.success('รีเซ็ตรหัสผ่านสำเร็จเรียบร้อยแล้ว!', { duration: 5000 });
        setUsername(forgotStudentId.trim());
        setPassword(res.newPassword || `bBb@${forgotStudentId.trim()}`);
        setShowForgotModal(false);
      } else {
        setForgotError(
          res.error ||
            'คำตอบความปลอดภัยไม่ถูกต้อง! หากจำคำตอบไม่ได้ ต้องติดต่อขอรีเซ็ตรหัสผ่านกับ ผู้ดูแลระบบ'
        );
      }
    });
  };

  return (
    <>
      {/* Dual Mode Switcher Tabs (นักเรียน vs ผู้ปกครอง) */}
      <div className="flex bg-pink-100/60 p-1 rounded-2xl mb-6 border border-pink-200/60">
        <button
          type="button"
          onClick={() => setActiveTab('student')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'student'
              ? 'bg-white text-rose-600 shadow-sm'
              : 'text-slate-600 hover:text-rose-600'
          }`}
        >
          <User size={15} className={activeTab === 'student' ? 'text-rose-500' : ''} />
          <span>นักเรียน ม.2/3</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('parent')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'parent'
              ? 'bg-white text-rose-600 shadow-sm'
              : 'text-slate-600 hover:text-rose-600'
          }`}
        >
          <Heart size={15} className={activeTab === 'parent' ? 'text-rose-500 fill-rose-500' : ''} />
          <span>ผู้ปกครอง</span>
          <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full hidden sm:inline">
            ด่วน
          </span>
        </button>
      </div>

      {/* Error Alert */}
      {initialMessage && (
        <div className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{initialMessage}</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: นักเรียน ม.2/3 (Student Login - 100% เลขประจำตัว)     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'student' && (
        <form className="flex flex-col gap-4 text-slate-700" action={login} onSubmit={handleFormSubmit}>
          {/* Quick Remembered Account Pill */}
          {recentStudentId && recentStudentId !== username && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-pink-50/70 border border-pink-200/70 text-xs">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Sparkles size={13} className="text-rose-500" />
                <span>เคยเข้าสู่ระบบล่าสุด: <strong>{recentStudentId}</strong></span>
              </span>
              <button
                type="button"
                onClick={() => handleSelectRecent(recentStudentId)}
                className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
              >
                กรอกด่วน ↗
              </button>
            </div>
          )}

          {/* Username (เลขประจำตัว 5 หลักเท่านั้น - ไม่มีอีเมล) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="username">
                เลขประจำตัวนักเรียน
              </label>
              <span className="text-[11px] text-slate-400 font-medium">เฉพาะตัวเลข 5 หลัก</span>
            </div>

            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="เช่น 30260"
                required
                autoComplete="username"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                enterKeyHint="next"
                className="w-full rounded-2xl px-4 py-3 bg-rose-50/20 border border-pink-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 text-slate-800 font-mono text-base sm:text-lg tracking-wider placeholder:tracking-normal placeholder:text-slate-400 transition-all shadow-2xs"
              />
              {detectedStudent && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
                  <CheckCircle2 size={16} />
                </div>
              )}
            </div>
          </div>

          {/* Live Student Profile Preview Card (เมื่อพิมพ์ครบ 5 หลัก) */}
          {detectedStudent && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50/80 via-rose-50/50 to-white border border-pink-200 shadow-2xs animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-pink-200 shadow-2xs p-1 flex items-center justify-center shrink-0">
                    <img
                      src={getStudentAvatar(detectedStudent)}
                      alt={detectedStudent.nickname}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-800 truncate">
                        {formatStudentFullName(detectedStudent)}
                      </h4>
                      <span className="text-xs text-rose-600 font-bold">({detectedStudent.nickname})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      เลขที่ {detectedStudent.student_no} · เลขประจำตัว {detectedStudent.student_id}
                    </p>
                  </div>
                </div>

                {/* Role / Rank Badge (บอกยศตามคำสั่ง) */}
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      ROLE_BADGES[KNOWN_ROLES[detectedStudent.student_id] || 'Student']?.color ||
                      ROLE_BADGES['Student'].color
                    }`}
                  >
                    {ROLE_BADGES[KNOWN_ROLES[detectedStudent.student_id] || 'Student']?.label || 'ยศ: นักเรียน'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Password Field with Show/Hide Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                รหัสผ่าน
              </label>
              <button
                type="button"
                onClick={handleOpenForgotModal}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>ลืมรหัสผ่าน?</span>
              </button>
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.getModifierState && e.getModifierState('CapsLock')) {
                    setCapsLockActive(true);
                  } else {
                    setCapsLockActive(false);
                  }
                }}
                onKeyUp={(e) => {
                  if (e.getModifierState && e.getModifierState('CapsLock')) {
                    setCapsLockActive(true);
                  } else {
                    setCapsLockActive(false);
                  }
                }}
                placeholder="รหัสผ่านของคุณ"
                required
                autoComplete="current-password"
                enterKeyHint="done"
                className="w-full rounded-2xl px-4 py-3 bg-rose-50/20 border border-pink-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 text-slate-800 transition-all text-base placeholder:text-slate-400 pr-11 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Caps Lock Alert */}
            {capsLockActive && (
              <p className="text-amber-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={13} />
                <span>ปุ่ม Caps Lock เปิดอยู่</span>
              </p>
            )}
          </div>

          {/* Interactive "วิธีการเข้าสู่ระบบ" Accordion */}
          <div className="my-0.5">
            <button
              type="button"
              onClick={() => setShowInstructions((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-pink-50/60 border border-pink-200 text-rose-900 text-xs font-bold hover:bg-pink-100/60 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <HelpCircle size={15} className="text-rose-500 shrink-0" />
                <span>วิธีการเข้าสู่ระบบ &amp; รหัสเริ่มต้น</span>
              </div>
              <ChevronDown
                size={15}
                className={`text-rose-600 transition-transform duration-200 ${
                  showInstructions ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showInstructions && (
              <div className="mt-2 p-4 bg-pink-50/40 border border-pink-200/80 rounded-2xl text-xs text-slate-700 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="leading-relaxed">
                  • <strong>Username:</strong> เลขประจำตัวนักเรียน 5 หลัก (เช่น{' '}
                  <span className="font-mono font-bold text-slate-800">30260</span>)
                </p>
                <p className="leading-relaxed">
                  • <strong>Password:</strong> รหัสผ่านเริ่มต้นคือ{' '}
                  <span className="font-mono font-bold text-rose-700">bBb@ตามด้วยเลขประจำตัว</span> (เช่น{' '}
                  <span className="font-mono font-bold text-slate-800">bBb@30260</span>)
                </p>
                <p className="text-slate-500 text-[11px] pt-1">
                  * หากลืมรหัสผ่าน สามารถกดปุ่ม &quot;ลืมรหัสผ่าน?&quot; เพื่อตอบคำถามความปลอดภัย หรือใช้รหัสฉุกเฉิน 30000
                </p>
              </div>
            )}
          </div>

          <div className="mt-2">
            <SubmitButton pendingText="กำลังตรวจสอบข้อมูล...">
              เข้าสู่ระบบ (Sign In)
            </SubmitButton>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: พอร์ทัลผู้ปกครอง (Parent Quick Access - ไม่ต้องจำรหัส)   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'parent' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-rose-50/80 border border-pink-200 text-xs text-rose-950 space-y-1">
            <p className="font-bold text-rose-800 flex items-center gap-1.5">
              <Heart size={14} className="text-rose-500 fill-rose-500" />
              <span>พอร์ทัลสำหรับผู้ปกครอง ม.2/3</span>
            </p>
            <p className="text-slate-600 leading-relaxed">
              ผู้ปกครองสามารถเข้าใช้งานได้ทันทีโดยไม่ต้องจำรหัสผ่าน เพียงค้นหาหรือเลือกลูกของคุณ
            </p>
          </div>

          {/* Child Search Box */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              ค้นหาและเลือกลูกของคุณ
            </label>
            <div className="relative">
              <input
                type="text"
                value={parentSearch}
                onChange={(e) => setParentSearch(e.target.value)}
                placeholder="พิมพ์ชื่อจริง, ชื่อเล่น หรือเลขประจำตัว"
                className="w-full rounded-2xl px-4 py-3 pl-10 bg-rose-50/20 border border-pink-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 text-slate-800 text-sm placeholder:text-slate-400 transition-all shadow-2xs"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400" />
            </div>
          </div>

          {/* Selected Child Pill or Quick List */}
          {selectedChild ? (
            <div className="p-3.5 rounded-2xl bg-white border-2 border-rose-300 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-pink-200 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={getStudentAvatar(selectedChild)}
                    alt={selectedChild.nickname}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-800 truncate">
                    {formatStudentFullName(selectedChild)} ({selectedChild.nickname})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    เลขที่ {selectedChild.student_no} · เลขประจำตัว {selectedChild.student_id}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200 shrink-0">
                เลือกแล้ว ✓
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500">เลือกจากรายชื่อนักเรียน:</span>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredChildren.map((student) => (
                  <button
                    key={student.student_id}
                    type="button"
                    onClick={() => setSelectedChild(student)}
                    className="p-2.5 rounded-xl border border-pink-100 bg-white hover:border-pink-300 hover:bg-rose-50/40 text-left transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pink-50 shrink-0 flex items-center justify-center overflow-hidden">
                      <img src={getStudentAvatar(student)} alt={student.nickname} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-800 truncate">{student.nickname}</p>
                      <p className="text-[10px] text-slate-400">เลขที่ {student.student_no}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Direct Enter Button */}
          <button
            type="button"
            onClick={handleParentLogin}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-[0_4px_16px_rgba(244,63,94,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>เข้าสู่พอร์ทัลผู้ปกครอง</span>
            <ArrowRight size={16} />
          </button>

          {/* Quick link to Parent Manual */}
          <a
            href="https://kanbann.bungkii.app/manual"
            className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-rose-50/50 text-rose-700 font-semibold text-xs border border-pink-200 shadow-2xs transition-all flex items-center justify-center gap-2"
            title="เปิดอ่านคู่มือการใช้งานสำหรับผู้ปกครอง (kanbann.bungkii.app/manual)"
          >
            <BookOpen size={14} className="text-rose-500" />
            <span>เปิดอ่านคู่มือการใช้งานสำหรับผู้ปกครอง 📖</span>
          </a>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-pink-100 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div className="w-13 h-13 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-pink-100 shadow-xs">
                <RotateCcw size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">ลืมรหัสผ่าน</h3>
              <p className="text-xs text-slate-500 mt-1">
                {forgotStep === 'id'
                  ? 'ใส่เลขประจำตัวนักเรียน 5 หลัก เพื่อตรวจสอบคำถามความปลอดภัย'
                  : 'ตอบคำถามความปลอดภัยเพื่อรีเซ็ตรหัสผ่าน'}
              </p>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <p>{forgotError}</p>
              </div>
            )}

            {forgotStep === 'id' ? (
              <form onSubmit={handleCheckStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เลขประจำตัวนักเรียน</label>
                  <input
                    type="text"
                    value={forgotStudentId}
                    onChange={(e) => setForgotStudentId(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="เช่น 30260"
                    required
                    maxLength={5}
                    className="w-full rounded-xl px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-800 font-mono text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isChecking}
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isChecking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบคำถามความปลอดภัย'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAnswerAndReset} className="space-y-4">
                <div className="p-3 bg-pink-50/60 rounded-xl border border-pink-200 text-xs text-slate-700">
                  <p className="font-bold text-rose-800">นักเรียน: {forgotStudentName}</p>
                  <p className="mt-1">
                    คำถามความปลอดภัย: <strong>{securityQuestion}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">คำตอบของคุณ</label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="ระบุคำตอบที่เคยตั้งไว้"
                    required
                    className="w-full rounded-xl px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสผ่านใหม่ (หากเว้นว่างจะรีเซ็ตเป็นค่าเริ่มต้น)
                  </label>
                  <input
                    type="password"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="อย่างน้อย 4 ตัวอักษร"
                    className="w-full rounded-xl px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-800 text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('id')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-2 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isResetting ? 'กำลังรีเซ็ต...' : 'ยืนยันและรีเซ็ตรหัสผ่าน'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
