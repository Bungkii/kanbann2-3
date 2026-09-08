'use client';

import React, { useState, useTransition } from 'react';
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
  HelpCircle as QuestionIcon,
  ArrowRight,
  User,
} from 'lucide-react';

interface LoginFormProps {
  initialMessage?: string;
}

export default function LoginForm({ initialMessage }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

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

  // Step 1: Check security question for student ID
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

  // Step 2: Verify security answer and reset password
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
        toast.success('รีเซ็ตรหัสผ่านสำเร็จเรียบร้อยแล้ว!', { icon: '🎉', duration: 5000 });
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
      {/* Error Alert */}
      {initialMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200/80 text-rose-800 rounded-2xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{initialMessage}</p>
        </div>
      )}

      {/* Login Form */}
      <form className="flex flex-col gap-4 text-slate-700" action={login}>
        {/* Username Field */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="username">
            เลขประจำตัวนักเรียน
          </label>
          <div className="relative">
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="เช่น 30000"
              required
              autoComplete="username"
              inputMode="numeric"
              pattern="[0-9]*"
              enterKeyHint="next"
              className="w-full rounded-2xl px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition-all text-base placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
              รหัสผ่าน
            </label>
            <button
              type="button"
              onClick={handleOpenForgotModal}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold hover:underline transition-colors flex items-center gap-1"
            >
              <RotateCcw size={12} />
              <span>ลืมรหัสผ่าน?</span>
            </button>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่านของคุณ"
              required
              autoComplete="current-password"
              enterKeyHint="done"
              className="w-full rounded-2xl px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition-all text-base placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Interactive "วิธีการเข้าสู่ระบบ" Accordion */}
        <div className="my-1">
          <button
            type="button"
            onClick={() => setShowInstructions((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs font-bold hover:bg-amber-100/70 transition-all"
          >
            <div className="flex items-center gap-2">
              <HelpCircle size={15} className="text-amber-600 shrink-0" />
              <span>วิธีการเข้าสู่ระบบ</span>
            </div>
            <ChevronDown
              size={15}
              className={`text-amber-700 transition-transform duration-200 ${showInstructions ? 'rotate-180' : ''
                }`}
            />
          </button>

          {showInstructions && (
            <div className="mt-2 p-4 bg-amber-50/40 border border-amber-200/60 rounded-2xl text-xs text-slate-700 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="leading-relaxed">
                • <strong>Username:</strong> เลขประจำตัวนักเรียน 5 หลัก (เช่น <span className="font-mono font-bold text-slate-800">30000</span>)
              </p>
              <p className="leading-relaxed">
                • <strong>Password:</strong> รหัสผ่านในช่องอะนะ (รหัสเริ่มต้นคือ <span className="font-mono font-bold text-indigo-700">bBb@เลขประจำตัว</span> เช่น <span className="font-mono font-bold text-slate-800">bBb@30000</span>)
              </p>
              <p className="text-slate-500 text-[11px] pt-1">
                * หากลืมรหัสผ่าน สามารถกดปุ่ม &quot;ลืมรหัสผ่าน?&quot; เพื่อตอบคำถามความปลอดภัย หากตอบผิดจะต้องขอรีเซ็ตกับ Admin
              </p>
            </div>
          )}
        </div>

        <div className="mt-2">
          <SubmitButton pendingText="กำลังตรวจสอบข้อมูล...">เข้าสู่ระบบ (Sign In)</SubmitButton>
        </div>
      </form>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div className="w-13 h-13 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-100 shadow-xs">
                <RotateCcw size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                ลืมรหัสผ่าน
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {forgotStep === 'id'
                  ? 'ใส่เลขประจำตัวของคุณ เพื่อตรวจสอบคำถามความปลอดภัย'
                  : 'ตอบคำถามความปลอดภัยเพื่อรีเซ็ตรหัสผ่าน (หากตอบผิดต้องขอรีเซ็ตกับ Admin)'}
              </p>
            </div>

            {/* Error in modal */}
            {forgotError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs leading-relaxed animate-in fade-in duration-200 flex items-start gap-2">
                <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <p>{forgotError}</p>
              </div>
            )}

            {forgotStep === 'id' ? (
              /* Step 1: Input Student ID */
              <form onSubmit={handleCheckStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    เลขประจำตัวนักเรียน (เช่น 30000)
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotStudentId}
                    onChange={(e) => setForgotStudentId(e.target.value)}
                    placeholder="เช่น 30000"
                    className="w-full rounded-2xl px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-sm"
                  />
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                  💡 ระบบจะค้นหาคำถามความปลอดภัยที่คุณเคยตั้งไว้ตอนเข้าใช้งานครั้งแรก
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isChecking}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isChecking ? 'กำลังตรวจสอบ...' : 'ถัดไป'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Security Question & Answer */
              <form onSubmit={handleVerifyAnswerAndReset} className="space-y-4">
                <div className="bg-indigo-50/70 border border-indigo-200/70 rounded-2xl p-3.5 text-xs text-indigo-950">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-600 truncate">{forgotStudentName}</span>
                    <button
                      type="button"
                      onClick={() => setForgotStep('id')}
                      className="text-[11px] text-indigo-600 hover:underline font-bold"
                    >
                      เปลี่ยนเลขประจำตัว
                    </button>
                  </div>
                  <div className="text-sm font-bold text-indigo-900 mt-1">
                    คำถาม: &quot;{securityQuestion}&quot;
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    คำตอบความปลอดภัยของคุณ
                  </label>
                  <input
                    type="text"
                    required
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="พิมพ์คำตอบที่คุณเคยตั้งไว้"
                    className="w-full rounded-2xl px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    รหัสผ่านใหม่ที่ต้องการตั้ง (เว้นว่างเพื่อใช้ bBb@เลขประจำตัว)
                  </label>
                  <input
                    type="password"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="รหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร"
                    className="w-full rounded-2xl px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-sm"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('id')}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50"
                  >
                    {isResetting ? 'กำลังตรวจสอบ...' : 'ยืนยันรีเซ็ตรหัสผ่าน'}
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
