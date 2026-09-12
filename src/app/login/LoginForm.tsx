'use client';

import React, { useState, useTransition, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  login,
  getStudentSecurityQuestionAction,
  verifyAndResetWithSecurityAnswerAction,
} from './actions';
import SubmitButton from '@/components/SubmitButton';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  ChevronDown,
  HelpCircle,
  RotateCcw,
  X,
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { STUDENTS } from '@/data/students';
import { formatStudentFullName, getStudentAvatar } from '@/app/parent/components/StudentCard';

interface LoginFormProps {
  initialMessage?: string;
}

export default function LoginForm({ initialMessage }: LoginFormProps) {
  const router = useRouter();

  // Student authentication state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recentStudentId, setRecentStudentId] = useState<string | null>(null);

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

      setForgotStudentName(res.studentName || cleanId);
      setSecurityQuestion(res.question || null);
      setForgotStep('answer');
    });
  };

  const handleVerifyAnswerAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityAnswer.trim()) {
      setForgotError('กรุณาระบุคำตอบความปลอดภัย');
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
            'คำตอบความปลอดภัยไม่ถูกต้อง! หากจำคำตอบไม่ได้ ต้องติดต่อขอรีเซ็ตรหัสผ่านกับผู้ดูแลระบบ'
        );
      }
    });
  };

  return (
    <>
      {/* Error Alert */}
      {initialMessage && (
        <div className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{initialMessage}</p>
        </div>
      )}

      {/* Student Login Form - 100% เลขประจำตัวนักเรียน 5 หลัก */}
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
              placeholder="เช่น 30000"
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

        {/* Live Student Profile Preview Card (แสดงข้อมูลนักเรียน ไม่บอกยศตามคำสั่ง) */}
        {detectedStudent && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50/80 via-rose-50/50 to-white border border-pink-200 shadow-2xs animate-in fade-in zoom-in-95 duration-200">
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
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
            >
              ลืมรหัสผ่าน?
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
                if (typeof e.getModifierState === 'function') {
                  setCapsLockActive(e.getModifierState('CapsLock'));
                }
              }}
              onKeyUp={(e) => {
                if (typeof e.getModifierState === 'function') {
                  setCapsLockActive(e.getModifierState('CapsLock'));
                }
              }}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full rounded-2xl px-4 py-3 pr-11 bg-rose-50/20 border border-pink-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 text-slate-800 text-sm placeholder:text-slate-400 transition-all shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Caps Lock Warning */}
          {capsLockActive && (
            <div className="mt-1.5 flex items-center gap-1.5 text-amber-700 text-xs bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 animate-in fade-in duration-150">
              <Lock size={12} className="shrink-0" />
              <span>ตรวจพบปุ่ม Caps Lock กำลังเปิดอยู่</span>
            </div>
          )}
        </div>

        {/* Accordion: Quick Help for Initial Password */}
        <div className="pt-1">
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
                <span className="font-mono font-bold text-slate-800">30000</span>)
              </p>
              <p className="leading-relaxed">
                • <strong>Password:</strong> รหัสผ่านเริ่มต้นคือ{' '}
                <span className="font-mono font-bold text-rose-700">bBb@ตามด้วยเลขประจำตัว</span> (เช่น{' '}
                <span className="font-mono font-bold text-slate-800">bBb@30000</span>)
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
                    placeholder="เช่น 30000"
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
