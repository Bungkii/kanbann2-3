'use client';

import React, { useState, useTransition, useMemo, useEffect, useRef } from 'react';
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
  HelpCircle,
  RotateCcw,
  X,
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  User,
  KeyRound,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { STUDENTS } from '@/data/students';
import { formatStudentFullName, getStudentAvatar } from '@/app/parent/components/StudentCard';

interface LoginFormProps {
  initialMessage?: string;
}

export default function LoginForm({ initialMessage }: LoginFormProps) {
  const router = useRouter();
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Student authentication state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
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
    if (clean.length === 5) {
      return STUDENTS.find((s) => s.student_id === clean) || null;
    }
    return null;
  }, [username]);

  // Check if 5 digits are entered but not found in the class list
  const isUnknownStudentId = useMemo(() => {
    const clean = username.trim();
    return clean.length === 5 && !detectedStudent;
  }, [username, detectedStudent]);

  // Auto-focus password input when 5 digits are entered and matched
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/\D/g, '').slice(0, 5);
    setUsername(cleanValue);
    if (cleanValue.length === 5) {
      const matched = STUDENTS.find((s) => s.student_id === cleanValue);
      if (matched && passwordInputRef.current && !password) {
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 150);
      }
    }
  };

  const handleSelectRecent = (id: string) => {
    setUsername(id);
    const match = STUDENTS.find((s) => s.student_id === id);
    if (match) {
      toast.success(`เลือก ${match.first_name} (${match.nickname}) เรียบร้อยแล้ว`);
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
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
    if (!cleanId || cleanId.length !== 5) {
      setForgotError('กรุณากรอกเลขประจำตัวนักเรียน 5 หลัก');
      return;
    }

    setForgotError(null);
    startCheckingTransition(async () => {
      const res = await getStudentSecurityQuestionAction(cleanId);
      if (!res.exists) {
        setForgotError(res.error || `ไม่พบเลขประจำตัวนักเรียน ${cleanId} ในระบบห้อง ม.2/3`);
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
            'คำตอบความปลอดภัยไม่ถูกต้อง! หากจำคำตอบไม่ได้ สามารถพิมพ์ 30000 ในช่องรหัสผ่านหน้าหลักเพื่อเข้าสู่ระบบฉุกเฉินได้ครับ'
        );
      }
    });
  };

  const recentStudentObj = useMemo(() => {
    if (!recentStudentId) return null;
    return STUDENTS.find((s) => s.student_id === recentStudentId) || null;
  }, [recentStudentId]);

  return (
    <>
      {/* Error Alert */}
      {initialMessage && (
        <div className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">
            {initialMessage}
          </div>
        </div>
      )}

      {/* Student Login Form - 100% เลขประจำตัวนักเรียน 5 หลัก */}
      <form className="flex flex-col gap-4 text-slate-700" action={login} onSubmit={handleFormSubmit}>
        {/* Quick Remembered Account Pill */}
        {recentStudentId && recentStudentId !== username && recentStudentObj && (
          <button
            type="button"
            onClick={() => handleSelectRecent(recentStudentId)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50/70 to-pink-50 border border-pink-200/80 hover:border-pink-300 transition-all text-xs group cursor-pointer text-left shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-full bg-white border border-pink-200 p-0.5 shrink-0 overflow-hidden">
                <img
                  src={getStudentAvatar(recentStudentObj)}
                  alt={recentStudentObj.nickname}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-slate-600 truncate">
                เคยเข้าสู่ระบบล่าสุด:{' '}
                <strong className="text-slate-900 font-bold">
                  {recentStudentObj.nickname} ({recentStudentId})
                </strong>
              </span>
            </div>
            <span className="text-rose-600 font-bold group-hover:underline shrink-0 text-[11px] ml-2">
              คลิกเพื่อกรอก ↗
            </span>
          </button>
        )}

        {/* 1. Username Field (เลขประจำตัว 5 หลัก) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-bold text-slate-800" htmlFor="username">
              เลขประจำตัวนักเรียน
            </label>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-pink-200/60">
              ตัวเลข 5 หลัก
            </span>
          </div>

          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <User size={18} className={username ? 'text-rose-500' : 'text-slate-400'} />
            </div>

            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="เช่น 30000"
              required
              autoFocus
              autoComplete="username"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              enterKeyHint="next"
              className="w-full rounded-2xl pl-11 pr-10 py-3.5 bg-rose-50/20 border-2 border-pink-100 hover:border-pink-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-400/20 focus:border-rose-400 text-slate-900 font-mono text-lg font-bold tracking-widest placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 transition-all shadow-2xs"
            />

            {detectedStudent && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 flex items-center">
                <CheckCircle2 size={18} className="fill-emerald-100" />
              </div>
            )}
          </div>
        </div>

        {/* Live Student Profile Preview Card (เมื่อตรวจพบนักเรียนถูกต้อง) */}
        {detectedStudent && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/60 via-pink-50/40 to-white border border-emerald-200/80 shadow-2xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white border-2 border-emerald-200 shadow-2xs p-1 flex items-center justify-center shrink-0">
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
                    <span className="text-xs text-rose-600 font-extrabold bg-rose-50 px-1.5 py-0.2 rounded-md">
                      น้อง{detectedStudent.nickname}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    เลขที่ {detectedStudent.student_no} · ม.2/3 · รหัสประจำตัว {detectedStudent.student_id}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full shrink-0 border border-emerald-300">
                พบข้อมูล ✓
              </span>
            </div>
          </div>
        )}

        {/* Unknown Student Warning if 5 digits are not in database */}
        {isUnknownStudentId && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle size={15} className="text-amber-600 shrink-0" />
            <span>ไม่พบเลขประจำตัว <strong>{username}</strong> ในรายชื่อนักเรียนห้อง ม.2/3 กรุณาตรวจสอบตัวเลขอีกครั้งครับ</span>
          </div>
        )}

        {/* 2. Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-bold text-slate-800" htmlFor="password">
              รหัสผ่าน
            </label>
            <button
              type="button"
              onClick={handleOpenForgotModal}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
            >
              ลืมรหัสผ่าน?
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <KeyRound size={18} className={password ? 'text-rose-500' : 'text-slate-400'} />
            </div>

            <input
              ref={passwordInputRef}
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
              className="w-full rounded-2xl pl-11 pr-11 py-3.5 bg-rose-50/20 border-2 border-pink-100 hover:border-pink-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-400/20 focus:border-rose-400 text-slate-900 text-sm font-medium placeholder:text-slate-400 transition-all shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Caps Lock Warning */}
          {capsLockActive && (
            <div className="mt-1.5 flex items-center gap-1.5 text-amber-700 text-xs bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 animate-in fade-in duration-150">
              <Lock size={12} className="shrink-0" />
              <span>ตรวจพบปุ่ม Caps Lock กำลังเปิดอยู่ (ตัวพิมพ์ใหญ่)</span>
            </div>
          )}
        </div>

        {/* 3. User-Friendly Quick Login Instructions (ชัดเจน ไม่ต้องค้นหา) */}
        <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-pink-100 space-y-2 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-bold text-rose-900 mb-1">
            <HelpCircle size={14} className="text-rose-500 shrink-0" />
            <span>ข้อมูลการเข้าใช้งานระบบ:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-white/80 p-2.5 rounded-xl border border-pink-100/70 flex flex-col justify-between">
              <span className="text-[11px] text-slate-500 font-medium">เลขประจำตัว (Username)</span>
              <span className="font-mono font-bold text-slate-800 text-xs">5 หลัก (เช่น 30000)</span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-pink-100/70 flex flex-col justify-between">
              <span className="text-[11px] text-slate-500 font-medium">รหัสผ่านเริ่มต้น (Default Pass)</span>
              <span className="font-mono font-bold text-rose-700 text-xs">bBb@30000</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
            <Zap size={12} className="text-amber-500 shrink-0" />
            <span>หากลืมรหัสผ่าน ให้ใส่ <strong className="text-slate-800 font-mono">30000</strong> ในช่องรหัสผ่าน เพื่อตั้งรหัสใหม่ได้ทันที</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-1">
          <SubmitButton pendingText="กำลังเข้าสู่ระบบ...">
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
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">กู้คืนรหัสผ่าน</h3>
              <p className="text-xs text-slate-500 mt-1">
                {forgotStep === 'id'
                  ? 'กรอกเลขประจำตัวนักเรียน 5 หลัก เพื่อตรวจสอบคำถามความปลอดภัย'
                  : 'ตอบคำถามความปลอดภัยเพื่อตั้งรหัสผ่านใหม่'}
              </p>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">{forgotError}</p>
              </div>
            )}

            {forgotStep === 'id' ? (
              <form onSubmit={handleCheckStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เลขประจำตัวนักเรียน (5 หลัก)
                  </label>
                  <input
                    type="text"
                    value={forgotStudentId}
                    onChange={(e) => setForgotStudentId(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="เช่น 30000"
                    required
                    maxLength={5}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoFocus
                    className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-800 font-mono text-base font-bold tracking-wider"
                  />
                </div>

                <div className="p-3 rounded-xl bg-pink-50/50 border border-pink-100 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-rose-800 flex items-center gap-1">
                    <Sparkles size={12} />
                    <span>คำแนะนำด่วน:</span>
                  </p>
                  <p>หากจำคำตอบไม่ได้ สามารถนำรหัสฉุกเฉิน <strong className="font-mono text-slate-900">30000</strong> ไปกรอกในช่องรหัสผ่านของหน้าหลักเพื่อรีเซ็ตได้ทันที</p>
                </div>

                <button
                  type="submit"
                  disabled={isChecking}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isChecking ? 'กำลังค้นหาข้อมูล...' : 'ค้นหาคำถามความปลอดภัย ➔'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAnswerAndReset} className="space-y-4">
                <div className="p-3 bg-pink-50/60 rounded-xl border border-pink-200 text-xs text-slate-700">
                  <p className="font-bold text-rose-800">นักเรียน: {forgotStudentName}</p>
                  <p className="mt-1">
                    คำถามความปลอดภัย: <strong>{securityQuestion || 'ยังไม่ได้ตั้งคำถาม (ใช้รหัสฉุกเฉิน 30000 ได้)'}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">คำตอบความปลอดภัยของคุณ</label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="ระบุคำตอบที่เคยตั้งไว้"
                    required
                    autoFocus
                    className="w-full rounded-xl px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสผ่านใหม่ (หากเว้นว่างจะรีเซ็ตเป็นค่าเริ่มต้น bBb@{forgotStudentId})
                  </label>
                  <input
                    type="password"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="ตั้งรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร"
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
                    className="flex-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60 cursor-pointer"
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
