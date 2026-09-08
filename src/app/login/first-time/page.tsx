import { redirect } from 'next/navigation';
import { getCurrentStudentSession } from '@/utils/studentAuth';
import { SECURITY_QUESTIONS } from '@/utils/studentTypes';
import { saveFirstTimePassword, skipFirstTimePassword } from '../actions';
import SubmitButton from '@/components/SubmitButton';
import { ShieldAlert, Key, CheckCircle, ArrowRight, HelpCircle } from 'lucide-react';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function FirstTimeLoginPage(props: Props) {
  const session = await getCurrentStudentSession();
  if (!session) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const error = searchParams?.error as string | undefined;

  const avatar = session.prefix === 'ด.ญ.' ? '/asset/student-girl.webp' : '/asset/student-boy.webp';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
        {/* Student Profile Pill */}
        <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-6">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-xs flex items-center justify-center shrink-0 p-1.5 overflow-hidden">
            <img
              src={avatar}
              alt={session.nickname}
              className={`w-full h-full object-contain ${session.prefix === 'ด.ช.' ? 'scale-115' : ''}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-800 tracking-tight truncate">
              {session.full_name}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold text-slate-700">ชื่อเล่น {session.nickname}</span>
              <span>·</span>
              <span>เลขที่ {session.student_no}</span>
              <span>·</span>
              <span>เลขประจำตัว {session.student_id}</span>
            </p>
          </div>
        </div>

        {/* Security Notice Box */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 text-amber-700 p-2 rounded-xl shrink-0 mt-0.5">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900 mb-1">
                เข้าสู่ระบบครั้งแรก — ตั้งรหัสผ่านและคำถามความปลอดภัย
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                กรุณาตั้งรหัสผ่านใหม่และเลือกคำถามความปลอดภัย 1 ข้อ สำหรับใช้กู้คืนรหัสผ่านด้วยตนเองหากลืมรหัสในอนาคต (หากตอบผิดจะต้องขอรีเซ็ตกับ Admin)
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm leading-relaxed">
            {error}
          </div>
        )}

        {/* Setup Form */}
        <form className="flex flex-col gap-4 text-slate-700" action={saveFirstTimePassword}>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="newPassword">
              รหัสผ่านใหม่ (New Password)
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="ตั้งรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร"
              required
              minLength={4}
              className="w-full rounded-2xl px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition-all text-base placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="confirmPassword">
              ยืนยันรหัสผ่านใหม่ (Confirm Password)
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="กรอกรหัสผ่านใหม่อีกครั้งให้ตรงกัน"
              required
              minLength={4}
              className="w-full rounded-2xl px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition-all text-base placeholder:text-slate-400"
            />
          </div>

          {/* Security Question Section */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="securityQuestion">
                คำถามความปลอดภัย (เลือก 1 อย่าง)
              </label>
              <div className="relative">
                <select
                  id="securityQuestion"
                  name="securityQuestion"
                  required
                  defaultValue={SECURITY_QUESTIONS[0]}
                  className="w-full rounded-2xl px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition-all text-sm appearance-none pr-10 cursor-pointer"
                >
                  {SECURITY_QUESTIONS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                  ▼
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="securityAnswer">
                คำตอบสำหรับคำถามความปลอดภัย
              </label>
              <input
                id="securityAnswer"
                name="securityAnswer"
                type="text"
                required
                placeholder="พิมพ์คำตอบของคุณ (เช่น สีฟ้า, กะเพราไก่)"
                className="w-full rounded-2xl px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition-all text-base placeholder:text-slate-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                💡 คำตอบนี้ใช้สำหรับตอบตอนกด &quot;ลืมรหัสผ่าน&quot; เพื่อรีเซ็ตรหัสผ่านด้วยตนเอง
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <SubmitButton pendingText="กำลังบันทึกข้อมูล...">
              บันทึกรหัสผ่านและคำถามความปลอดภัย
            </SubmitButton>

            {/* Skip Button ("ข้ามได้") */}
            <button
              type="submit"
              formAction={skipFirstTimePassword}
              formNoValidate
              className="w-full py-3 px-4 rounded-2xl font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all text-sm flex items-center justify-center gap-1.5"
            >
              <span>ข้ามไปก่อน (ใช้รหัสผ่านเดิม)</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
