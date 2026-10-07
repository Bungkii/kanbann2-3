"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, User, UserCheck, ShieldCheck, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { submitFormResponse } from "./actions";

export default function SingleFormResponder({
  form,
  currentStudent,
}: {
  form: any;
  currentStudent: any;
}) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = form.questions || [];

  const handleTextChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleRadioChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleCheckboxToggle = (qId: string, opt: string) => {
    setAnswers((prev) => {
      const currentList = Array.isArray(prev[qId]) ? prev[qId] : [];
      if (currentList.includes(opt)) {
        return { ...prev, [qId]: currentList.filter((x: string) => x !== opt) };
      } else {
        return { ...prev, [qId]: [...currentList, opt] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required questions
    for (const q of questions) {
      if (q.required) {
        const val = answers[q.id];
        if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === "string" && !val.trim())) {
          toast.error(`กรุณาตอบคำถาม: "${q.title}"`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const res = await submitFormResponse(form.id, answers, isAnonymous);
      if (res.success) {
        setIsSubmitted(true);
        toast.success("บันทึกคำตอบเรียบร้อยแล้ว ขอบคุณครับ!");
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการส่งคำตอบ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!form.is_active) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center text-xl">
            🔒
          </div>
          <h2 className="text-xl font-bold text-slate-800">แบบสอบถามนี้ปิดรับคำตอบแล้ว</h2>
          <p className="text-xs text-slate-500">
            ผู้สร้างได้ทำการปิดรับการตอบกลับสำหรับแบบสอบถามนี้แล้ว ขออภัยในความไม่สะดวกครับ
          </p>
          <Link
            href="/form"
            className="inline-block px-6 py-2.5 rounded-xl bg-slate-800 text-white font-medium text-xs hover:bg-slate-900 transition-colors"
          >
            ดูแบบสอบถามอื่นๆ
          </Link>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">ส่งคำตอบเรียบร้อยแล้ว</h2>
          <p className="text-xs text-slate-500">
            ระบบได้บันทึกคำตอบของคุณสำหรับ &quot;{form.title}&quot; เข้าสู่ฐานข้อมูลเรียบร้อยแล้ว
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/form"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors"
            >
              กลับหน้ารายการแบบสอบถาม
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl w-full mx-auto space-y-5">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/form"
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft size={14} />
            กลับไปหน้ารวมแบบสอบถาม
          </Link>
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
            ห้อง ม.2/3 Form
          </span>
        </div>

        {/* Form Card Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs border-t-4 border-t-indigo-600 space-y-2">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {form.title}
          </h1>
          {form.description && (
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
              {form.description}
            </p>
          )}

          {/* User Info Bar */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <UserCheck size={15} className="text-indigo-600" />
              <span>
                ผู้ตอบ:{" "}
                <strong className="text-slate-700">
                  {currentStudent
                    ? `${currentStudent.first_name} ${currentStudent.last_name} (${currentStudent.student_no})`
                    : "ผู้ใช้งานทั่วไป"}
                </strong>
              </span>
            </div>
            {form.allow_anonymous && (
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>ไม่ประสงค์ออกนาม</span>
              </label>
            )}
          </div>
        </div>

        {/* Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((q: any, idx: number) => {
            return (
              <div
                key={q.id || idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-indigo-600 mt-0.5 shrink-0">
                    ข้อที่ {idx + 1}.
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-slate-800">
                      {q.title}
                    </span>
                    {q.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                  </div>
                </div>

                {/* Question Inputs according to type */}
                {q.type === "short_answer" && (
                  <input
                    type="text"
                    value={answers[q.id] || ""}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    placeholder="พิมพ์คำตอบของคุณ..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}

                {q.type === "paragraph" && (
                  <textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    placeholder="พิมพ์คำตอบหรือข้อเสนอแนะของคุณ..."
                    rows={3}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}

                {q.type === "radio" && (
                  <div className="space-y-2 pt-1 pl-1">
                    {(q.options || []).map((opt: string, optIdx: number) => (
                      <label
                        key={optIdx}
                        className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => handleRadioChange(q.id, opt)}
                          className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "checkbox" && (
                  <div className="space-y-2 pt-1 pl-1">
                    {(q.options || []).map((opt: string, optIdx: number) => {
                      const isChecked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
                      return (
                        <label
                          key={optIdx}
                          className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxToggle(q.id, opt)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send size={15} />
              <span>{isSubmitting ? "กำลังส่งคำตอบ..." : "ส่งคำตอบแบบสอบถาม"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
