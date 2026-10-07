"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Star,
  Send,
  CheckCircle2,
  ThumbsUp,
  UserCheck,
  Calendar,
  Clock,
  Upload,
  AlertCircle,
  Phone,
  HeartHandshake,
  X,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { submitFormResponse } from "./actions";
import { normalizeDateInput } from "./excelParser";

export default function SingleFormResponder({
  form,
  currentStudent,
}: {
  form: any;
  currentStudent: any;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

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

  const handleStarRating = (qId: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required questions
    for (const q of questions) {
      if (q.required) {
        const val = answers[q.id];
        if (
          val === undefined ||
          val === null ||
          (Array.isArray(val) && val.length === 0) ||
          (typeof val === "string" && !val.trim()) ||
          (typeof val === "number" && val === 0)
        ) {
          toast.error(`กรุณาตอบคำถาม: "${q.title}"`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const res = await submitFormResponse(form.id, answers, isAnonymous);
      if (res.success) {
        setShowModal(true);
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการส่งข้อมูล");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    router.push("/form");
  };

  if (!form.is_active) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-lg border border-slate-200 text-center flex flex-col items-center">
          <div className="bg-rose-100 text-rose-500 p-4 rounded-full mb-6">
            <AlertCircle size={48} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">แบบสอบถามปิดรับแล้ว</h1>
          <p className="text-slate-500 mb-8 text-sm">
            ขณะนี้แบบสอบถาม &quot;{form.title}&quot; ได้ปิดรับการตอบกลับแล้ว ขออภัยในความไม่สะดวกครับ
          </p>
          <Link
            href="/form"
            className="bg-slate-800 text-white font-bold py-3 px-8 rounded-full hover:bg-slate-900 transition-colors text-sm"
          >
            กลับหน้ารายการแบบสอบถาม
          </Link>
        </div>
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-4xl mx-auto">
        {/* Top Header - Pink Brand Style (Exact Evaluate Boss) */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-sans border-b-4 border-pink-500 pb-2 inline-block">
              {form.title}
            </h1>
            {form.description && (
              <p className="text-xs sm:text-sm text-slate-500 mt-2 whitespace-pre-wrap">
                {form.description}
              </p>
            )}
          </div>
          <Link href="/form" className="text-pink-600 hover:underline text-sm font-semibold shrink-0">
            ดูแบบสอบถามอื่น
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Respondent Profile Bar & Anonymous Choice */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center border-2 border-pink-100 overflow-hidden text-pink-600 font-bold">
                {currentStudent ? String(currentStudent.student_no).padStart(2, "0") : "👤"}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {currentStudent
                    ? `${currentStudent.first_name} ${currentStudent.last_name}`
                    : "ผู้ใช้งานทั่วไป"}
                </p>
                <p className="text-xs text-slate-500">
                  {currentStudent
                    ? `เลขประจำตัว: ${currentStudent.student_id} • เลขที่ ${currentStudent.student_no}`
                    : "ห้องเรียน ม.2/3"}
                </p>
              </div>
            </div>

            {form.allow_anonymous && (
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4 cursor-pointer"
                />
                <span>ไม่ประสงค์ออกนาม (Anonymous)</span>
              </label>
            )}
          </div>

          {/* Questions Container */}
          <div className="space-y-6">
            {questions.map((q: any, idx: number) => {
              const currentVal = answers[q.id];

              return (
                <div
                  key={q.id || idx}
                  className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4 relative"
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-800">
                          {q.title}
                          {q.required && <span className="text-rose-500 ml-1.5">*</span>}
                        </h3>
                        {q.points ? (
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mt-1 inline-block">
                            คะแนน: {q.points} แต้ม
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Question Response Types */}
                  <div className="pt-2">
                    {/* 1. Short answer */}
                    {q.type === "short_answer" && (
                      <input
                        type="text"
                        value={currentVal || ""}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder="คำตอบของคุณ..."
                        className="w-full rounded-xl border border-slate-300 shadow-2xs focus:border-pink-500 focus:ring-pink-500 px-4 py-3 text-slate-800 bg-slate-50 text-sm"
                      />
                    )}

                    {/* 2. Paragraph */}
                    {q.type === "paragraph" && (
                      <textarea
                        rows={4}
                        value={currentVal || ""}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder="พิมพ์คำตอบของคุณที่นี่..."
                        className="w-full rounded-xl border border-slate-300 shadow-2xs focus:border-pink-500 focus:ring-pink-500 p-4 text-slate-800 bg-slate-50 resize-none text-sm"
                      />
                    )}

                    {/* 3. Multiple Choice (Radio) */}
                    {q.type === "multiple_choice" && (
                      <div className="space-y-2.5">
                        {(q.options || []).map((opt: string, optIdx: number) => {
                          const isSelected = currentVal === opt;
                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-pink-50/60 border-pink-400 text-pink-900 font-semibold shadow-2xs"
                                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                value={opt}
                                checked={isSelected}
                                onChange={() => handleRadioChange(q.id, opt)}
                                className="text-pink-600 focus:ring-pink-500 w-4 h-4"
                              />
                              <span className="text-sm">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* 4. Checkboxes */}
                    {q.type === "checkboxes" && (
                      <div className="space-y-2.5">
                        {(q.options || []).map((opt: string, optIdx: number) => {
                          const isChecked = Array.isArray(currentVal) && currentVal.includes(opt);
                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? "bg-pink-50/60 border-pink-400 text-pink-900 font-semibold shadow-2xs"
                                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxToggle(q.id, opt)}
                                className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                              />
                              <span className="text-sm">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* 5. Dropdown */}
                    {q.type === "dropdown" && (
                      <select
                        value={currentVal || ""}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        className="w-full rounded-xl border border-slate-300 shadow-2xs focus:border-pink-500 focus:ring-pink-500 px-4 py-3 text-slate-800 bg-slate-50 text-sm cursor-pointer"
                      >
                        <option value="">-- กรุณาเลือกคำตอบ --</option>
                        {(q.options || []).map((opt: string, optIdx: number) => (
                          <option key={optIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* 6. Linear Scale & Rating (Star) */}
                    {(q.type === "rating" || q.type === "linear_scale") && (
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-bold text-slate-700 mb-3">
                          {currentVal ? `คะแนนที่เลือก: ${currentVal} ดาว` : "แตะที่ดาวเพื่อเลือกคะแนน"}
                        </span>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <motion.button
                              key={star}
                              type="button"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleStarRating(q.id, star)}
                              className={`focus:outline-none transition-colors ${
                                (currentVal || 0) >= star ? "text-yellow-400" : "text-slate-300"
                              }`}
                            >
                              <Star className={`w-8 h-8 sm:w-10 sm:h-10 ${(currentVal || 0) >= star ? "fill-current" : ""}`} />
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 7. Date (DD/MM/YYYY with automatic CE/BE conversion) */}
                    {q.type === "date" && (
                      <div className="space-y-1.5">
                        <div className="relative">
                          <input
                            type="text"
                            value={currentVal || ""}
                            onChange={(e) => handleTextChange(q.id, e.target.value)}
                            onBlur={(e) => handleTextChange(q.id, normalizeDateInput(e.target.value))}
                            placeholder="เช่น 07/10/2026 หรือ 07/10/2569 (DD/MM/YYYY)"
                            className="w-full rounded-xl border border-slate-300 shadow-2xs focus:border-pink-500 focus:ring-pink-500 px-4 py-3 pl-11 text-slate-800 bg-slate-50 text-sm font-mono"
                          />
                          <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        </div>
                        <p className="text-[11px] text-slate-400 pl-1">
                          * กรอกเป็น วัน/เดือน/ปี (พ.ศ. หรือ ค.ศ. ก็ได้ ระบบจะแปลงให้อัตโนมัติ)
                        </p>
                      </div>
                    )}

                    {/* 8. Time */}
                    {q.type === "time" && (
                      <div className="relative">
                        <input
                          type="time"
                          value={currentVal || ""}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                          className="w-full rounded-xl border border-slate-300 shadow-2xs focus:border-pink-500 focus:ring-pink-500 px-4 py-3 pl-11 text-slate-800 bg-slate-50 text-sm"
                        />
                        <Clock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      </div>
                    )}

                    {/* 9. File upload notice */}
                    {q.type === "file_upload" && (
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                        <p className="text-xs text-slate-500 font-medium">
                          แนบลิงก์ไฟล์หรือส่งไฟล์ผ่านช่องทางห้องเรียน
                        </p>
                        <input
                          type="text"
                          value={currentVal || ""}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                          placeholder="วาง URL หรือลิงก์ไฟล์งานของคุณที่นี่..."
                          className="w-full mt-2 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button (Exact Pink Evaluate Boss Style) */}
          <div className="flex justify-end pt-4">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-colors cursor-pointer ${
                isSubmitting ? "bg-slate-400" : "bg-pink-600 hover:bg-pink-700"
              }`}
            >
              {isSubmitting ? (
                "กำลังส่ง..."
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  ส่งคำตอบแบบสอบถาม
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Success Modal (Exact Evaluate Boss Experience) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border-4 border-pink-100 my-auto text-center space-y-5"
            >
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-pink-500" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">
                  ส่งคำตอบเรียบร้อยแล้ว!
                </h2>
                <p className="text-slate-600 font-medium text-sm">
                  ระบบได้บันทึกคำตอบของคุณเข้าสู่ฐานข้อมูลห้อง ม.2/3 เรียบร้อยแล้ว ขอบคุณสำหรับความร่วมมือครับ
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full py-3.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  ตกลง / กลับหน้ารวมแบบสอบถาม
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
