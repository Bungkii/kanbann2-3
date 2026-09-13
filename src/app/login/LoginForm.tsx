'use client';

import React, { useState, useTransition, useRef } from 'react';
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
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  KeyRound,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface LoginFormProps {
  initialMessage?: string;
}

const FAQ_ITEMS = [
  {
    q: 'เข้าสู่ระบบด้วยอะไร?',
    a: 'นักเรียนเข้าสู่ระบบด้วยเลขประจำตัวนักเรียน 5 หลัก (เช่น 30233, 30260) ในช่องเลขประจำตัวนักเรียน',
  },
  {
    q: 'รหัสผ่านเริ่มต้นสำหรับใช้งานครั้งแรกคืออะไร?',
    a: (
      <span>
        รหัสผ่านเริ่มต้นคือ{' '}
        <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">
          bBb@เลขประจำตัว
        </code>{' '}
        (ตัวอย่าง: หากเลขประจำตัวคือ 30233 รหัสผ่านเริ่มต้นคือ{' '}
        <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">
          bBb@30233
        </code>
        )
      </span>
    ),
  },
  {
    q: 'ลืมรหัสผ่าน หรือจำรหัสผ่านไม่ได้ทำอย่างไร?',
    a: (
      <span>
        สามารถกดปุ่ม <strong>"ลืมรหัสผ่าน?"</strong> เพื่อตอบคำถามความปลอดภัยสำหรับตั้งรหัสผ่านใหม่
        หรือติดต่อขอรีเซ็ตรหัสผ่านกับ Admin (ผู้ดูแลระบบ) หรือหัวหน้าห้อง
      </span>
    ),
  },
  {
    q: 'เข้าสู่ระบบครั้งแรกต้องทำอะไรบ้าง?',
    a: 'เมื่อเข้าสู่ระบบครั้งแรก ระบบจะนำไปที่หน้าตั้งรหัสผ่านใหม่และเลือกคำถามความปลอดภัย 1 ข้อ สำหรับใช้กู้คืนรหัสผ่านด้วยตนเองในอนาคต',
  },
  {
    q: 'ผู้ปกครองต้องเข้าสู่ระบบที่ไหน?',
    a: 'ผู้ปกครองสามารถเข้าดูการบ้าน ตารางเรียน และสรุปเนื้อหาวิชาได้โดยตรงผ่าน kanbann.bungkii.app หรือเปิดหน้าคู่มือผู้ปกครอง โดยไม่ต้องล็อกอินด้วยรหัสผ่านนักเรียน',
  },
];

export default function LoginForm({ initialMessage }: LoginFormProps) {
  const router = useRouter();
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Modals state
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showLoginGuide, setShowLoginGuide] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'id' | 'answer'>('id');
  const [forgotStudentId, setForgotStudentId] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isChecking, startCheckingTransition] = useTransition();
  const [isResetting, startResetTransition] = useTransition();

  // Handle username/student ID input
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/\D/g, '').slice(0, 5);
    setUsername(cleanValue);
    if (cleanValue.length === 5 && passwordInputRef.current && !password) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 150);
    }
  };

  const handleOpenForgotModal = () => {
    setForgotStep('id');
    setForgotStudentId(username.trim());
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
            'คำตอบความปลอดภัยไม่ถูกต้อง! หากจำคำตอบไม่ได้ กรุณาติดต่อขอรีเซ็ตรหัสผ่านกับ Admin (ผู้ดูแลระบบ)'
        );
      }
    });
  };

  return (
    <>
      <form className="animate-in flex flex-col w-full justify-center text-slate-700" action={login}>
        <h1 className="text-3xl font-bold mb-6 text-center text-slate-800 tracking-tight">
          เข้าสู่ระบบ
        </h1>

        {/* Username / Student ID Field */}
        <label className="text-sm font-semibold mb-1 text-slate-700" htmlFor="username">
          เลขประจำตัวนักเรียน (Student ID)
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={handleUsernameChange}
          placeholder="เช่น 30233 หรือเลขประจำตัว 5 หลัก"
          required
          autoFocus
          autoComplete="username"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={5}
          className="rounded-xl px-4 py-2.5 bg-white border border-slate-300 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all text-slate-900 placeholder:text-slate-400"
        />

        {/* Password Field with Forgot Password Link */}
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-semibold text-slate-700" htmlFor="password">
            รหัสผ่าน (Password)
          </label>
          <button
            type="button"
            onClick={handleOpenForgotModal}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
          >
            ลืมรหัสผ่าน?
          </button>
        </div>

        <div className="relative mb-2">
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
            className="w-full rounded-xl px-4 py-2.5 pr-11 bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Caps Lock Alert */}
        {capsLockActive && (
          <div className="mb-2 flex items-center gap-1.5 text-amber-700 text-xs bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <Lock size={12} className="shrink-0" />
            <span>ตรวจพบปุ่ม Caps Lock กำลังเปิดอยู่</span>
          </div>
        )}

        {/* Toggleable Quick Login Instructions (ซ่อนไว้ก่อน ให้กดเปิดปิดดู) */}
        <div className="mt-1 mb-2 rounded-2xl border border-pink-100/90 bg-rose-50/30 overflow-hidden transition-all text-xs">
          <button
            type="button"
            onClick={() => setShowLoginGuide((prev) => !prev)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 transition-all font-medium cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-rose-100/70 text-rose-600 flex items-center justify-center shrink-0">
                <HelpCircle size={13} />
              </div>
              <span className="font-bold text-rose-950">ข้อมูลการเข้าใช้งานระบบ:</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-[11px] font-semibold">
              <span>{showLoginGuide ? 'ซ่อน' : 'กดเปิดดู'}</span>
              <ChevronDown
                size={15}
                className={`transition-transform duration-200 ${
                  showLoginGuide ? 'rotate-180 text-rose-600' : ''
                }`}
              />
            </div>
          </button>

          {showLoginGuide && (
            <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-pink-100/70 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <div className="bg-white p-2.5 rounded-xl border border-pink-100 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">เลขประจำตัว (Username)</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">5 หลัก (เช่น 30000)</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-pink-100 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">รหัสผ่านเริ่มต้น (Default Pass)</span>
                  <span className="font-mono font-bold text-rose-600 text-xs">bBb@เลขประจำตัว</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
                <Zap size={13} className="text-amber-500 shrink-0" />
                <span>
                  หากลืมรหัสผ่าน สามารถกดปุ่ม{' '}
                  <strong className="text-rose-600">"ลืมรหัสผ่าน?"</strong>{' '}
                  หรือติดต่อขอรีเซ็ตกับ Admin ได้ครับ
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <SubmitButton pendingText="กำลังเข้าสู่ระบบ...">
          เข้าสู่ระบบ (Sign In)
        </SubmitButton>

        {/* Error Message */}
        {initialMessage && (
          <p className="mt-4 p-3.5 bg-red-100 text-red-900 text-center rounded-xl text-sm font-medium animate-in fade-in duration-150">
            {initialMessage}
          </p>
        )}

        {/* Replaced signup button with Frequently Asked Questions (FAQ) */}
        <p className="text-sm text-center mt-6 text-slate-600">
          มีข้อสงสัยการเข้าใช้งาน?{' '}
          <button
            type="button"
            onClick={() => setShowFaqModal(true)}
            className="underline hover:text-indigo-800 text-indigo-600 font-semibold transition-colors cursor-pointer"
          >
            คำถามที่พบบ่อย
          </button>
        </p>
      </form>

      {/* Frequently Asked Questions (FAQ) Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowFaqModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">คำถามที่พบบ่อย (FAQ)</h3>
                <p className="text-xs text-slate-500">ข้อมูลการเข้าใช้งานระบบห้องเรียน ม.2/3</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 overflow-hidden transition-all text-left"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full text-left px-3.5 py-3 bg-slate-50/70 hover:bg-slate-100 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {item.q}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-500 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-indigo-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-3.5 py-3 bg-white text-xs sm:text-sm text-slate-600 border-t border-slate-100 leading-relaxed">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowFaqModal(false);
                  handleOpenForgotModal();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                กู้คืนรหัสผ่าน
              </button>
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                เข้าใจแล้ว ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal (Clean Slate & Indigo Theme, No Student Name Revealed) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-2.5 border border-indigo-100">
                <RotateCcw size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">กู้คืนรหัสผ่าน</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {forgotStep === 'id'
                  ? 'กรอกเลขประจำตัวนักเรียน 5 หลัก เพื่อตรวจสอบคำถามความปลอดภัย'
                  : 'ตอบคำถามความปลอดภัยเพื่อตั้งรหัสผ่านใหม่'}
              </p>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
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
                    placeholder="เช่น 30233"
                    required
                    maxLength={5}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoFocus
                    className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-mono text-base font-bold tracking-wider"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <Sparkles size={12} className="text-indigo-600" />
                    <span>คำแนะนำ:</span>
                  </p>
                  <p>
                    หากจำคำตอบความปลอดภัยไม่ได้ สามารถติดต่อขอรีเซ็ตรหัสผ่านกับ Admin (ผู้ดูแลระบบ) หรือหัวหน้าห้องได้ครับ
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isChecking}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isChecking ? 'กำลังค้นหาข้อมูล...' : 'ค้นหาคำถามความปลอดภัย ➔'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAnswerAndReset} className="space-y-4">
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-slate-700">
                  <p className="font-bold text-indigo-900">เลขประจำตัว: {forgotStudentId}</p>
                  <p className="mt-1 text-slate-600">
                    คำถามความปลอดภัย:{' '}
                    <strong className="text-slate-800">
                      {securityQuestion || 'ยังไม่ได้ตั้งคำถาม (กรุณาติดต่อ Admin เพื่อรีเซ็ต)'}
                    </strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    คำตอบความปลอดภัยของคุณ
                  </label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="ระบุคำตอบที่เคยตั้งไว้"
                    required
                    autoFocus
                    className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
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
                    className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
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
                    className="flex-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60 cursor-pointer"
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
