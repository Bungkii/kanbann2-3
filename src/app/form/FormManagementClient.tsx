"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Copy, Share2, HelpCircle, BarChart3, Lock, ShieldCheck, ArrowLeft, Settings, Send } from "lucide-react";
import toast from "react-hot-toast";
import { createForm, toggleFormStatus, deleteForm } from "./actions";
import Link from "next/link";

interface Question {
  id: string;
  title: string;
  type: "short_answer" | "paragraph" | "radio" | "checkbox" | "rating";
  required: boolean;
  options: string[];
}

export default function FormManagementClient({
  forms,
  currentUser,
}: {
  forms: any[];
  currentUser: { isRanked: boolean; role: string; name: string };
}) {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "q_1",
      title: "ความคิดเห็นหรือข้อเสนอแนะของคุณ",
      type: "paragraph",
      required: true,
      options: [],
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Question
  const addQuestion = (type: Question["type"] = "short_answer") => {
    const newQ: Question = {
      id: `q_${Date.now()}`,
      title: "",
      type,
      required: false,
      options: type === "radio" || type === "checkbox" ? ["ตัวเลือกที่ 1", "ตัวเลือกที่ 2"] : [],
    };
    setQuestions([...questions, newQ]);
  };

  // Remove Question
  const removeQuestion = (id: string) => {
    if (questions.length <= 1) {
      toast.error("แบบสอบถามต้องมีอย่างน้อย 1 คำถาม");
      return;
    }
    setQuestions(questions.filter((q) => q.id !== id));
  };

  // Update Question Field
  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          const updated = { ...q, [field]: value };
          if (field === "type") {
            if ((value === "radio" || value === "checkbox") && q.options.length === 0) {
              updated.options = ["ตัวเลือกที่ 1", "ตัวเลือกที่ 2"];
            }
          }
          return updated;
        }
        return q;
      })
    );
  };

  // Add Option to choice question
  const addOption = (qId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            options: [...q.options, `ตัวเลือกที่ ${q.options.length + 1}`],
          };
        }
        return q;
      })
    );
  };

  // Remove Option
  const removeOption = (qId: string, optIdx: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            options: q.options.filter((_, i) => i !== optIdx),
          };
        }
        return q;
      })
    );
  };

  // Update Option Text
  const updateOptionText = (qId: string, optIdx: number, text: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const newOpts = [...q.options];
          newOpts[optIdx] = text;
          return { ...q, options: newOpts };
        }
        return q;
      })
    );
  };

  // Handle Form Creation
  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("กรุณาระบุชื่อแบบสอบถาม");
      return;
    }

    const invalidQ = questions.find((q) => !q.title.trim());
    if (invalidQ) {
      toast.error("กรุณาระบุข้อความคำถามให้ครบทุกข้อ");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createForm({
        title,
        description,
        allow_anonymous: allowAnonymous,
        questions,
      });

      if (res.success && res.form) {
        toast.success("สร้างแบบสอบถามสำเร็จ!");
        setTitle("");
        setDescription("");
        setQuestions([
          {
            id: "q_1",
            title: "ความคิดเห็นหรือข้อเสนอแนะของคุณ",
            type: "paragraph",
            required: true,
            options: [],
          },
        ]);
        setActiveTab("list");
      } else {
        toast.error(res.error || "ไม่สามารถสร้างแบบสอบถามได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy URL
  const copyFormUrl = (formId: string) => {
    const url = `${window.location.origin}/form?id=${formId}`;
    navigator.clipboard.writeText(url);
    toast.success("คัดลอกลิงก์แบบสอบถามแล้ว!");
  };

  return (
    <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>📋 ระบบแบบสอบถาม ม.2/3</span>
            </h1>
            <p className="text-xs text-slate-500">
              สร้างและตอบแบบสอบถามสำหรับห้องเรียน ม.2/3
            </p>
          </div>
        </div>

        {currentUser.isRanked && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <ShieldCheck size={14} />
              ยศ: {currentUser.role}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      {currentUser.isRanked && (
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl max-w-sm">
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "list"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            รายการแบบสอบถาม ({forms.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "create"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Plus size={14} />
            สร้างแบบสอบถามใหม่
          </button>
        </div>
      )}

      {/* TAB 1: LIST VIEW */}
      {activeTab === "list" && (
        <div className="space-y-4">
          {forms.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-700">ยังไม่มีแบบสอบถามในระบบ</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {currentUser.isRanked
                  ? "คุณสามารถกดปุ่ม 'สร้างแบบสอบถามใหม่' ด้านบน เพื่อเริ่มต้นตั้งคำถามได้ทันที"
                  : "กรุณารอหัวหน้าหรือผู้มียศสร้างแบบสอบถามและแชร์ลิงก์ให้ครับ"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forms.map((item) => {
                const responseCount = item.form_responses?.[0]?.count ?? 0;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            item.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {item.is_active ? "เปิดรับคำตอบ" : "ปิดรับแล้ว"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          สร้างโดย: {item.creator_name || "ผู้มียศ"} ({item.creator_role || "Staff"})
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 line-clamp-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span>❓ {item.questions?.length || 0} ข้อ</span>
                        <span>👥 ตอบแล้ว {responseCount} คน</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/form?id=${item.id}`}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <Send size={13} />
                        เปิดตอบฟอร์ม
                      </Link>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => copyFormUrl(item.id)}
                          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
                          title="คัดลอกลิงก์"
                        >
                          <Copy size={15} />
                        </button>
                        {currentUser.isRanked && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`คุณต้องการลบแบบสอบถาม "${item.title}" ใช่หรือไม่?`)) {
                                await deleteForm(item.id);
                                toast.success("ลบแบบสอบถามเรียบร้อย");
                              }
                            }}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors border border-rose-200"
                            title="ลบฟอร์ม"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE FORM (Ranked Only) */}
      {activeTab === "create" && currentUser.isRanked && (
        <form onSubmit={handleCreateForm} className="space-y-6">
          {/* Form Header Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อหัวข้อแบบสอบถาม <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น แบบสอบถามความคิดเห็นทัศนศึกษา ม.2/3"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รายละเอียดคำชี้แจง (ถ้ามี)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุคำอธิบายหรือวัตถุประสงค์ของการทำแบบสอบถามนี้..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="allow_anonymous"
                checked={allowAnonymous}
                onChange={(e) => setAllowAnonymous(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <label htmlFor="allow_anonymous" className="text-xs font-medium text-slate-700 cursor-pointer">
                อนุญาตให้ผู้ตอบเลือก &quot;ไม่ระบุตัวตน&quot; ได้
              </label>
            </div>
          </div>

          {/* Questions Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">
                รายการคำถาม ({questions.length} ข้อ)
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => addQuestion("short_answer")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  + ข้อความสั้น
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("radio")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  + ปรนัย (เลือก 1 ข้อ)
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("checkbox")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  + เลือกได้หลายข้อ
                </button>
              </div>
            </div>

            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 relative"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={q.title}
                    onChange={(e) => updateQuestion(q.id, "title", e.target.value)}
                    placeholder={`คำถามข้อที่ ${idx + 1}...`}
                    required
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(q.id, "type", e.target.value as Question["type"])}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium bg-slate-50 text-slate-700"
                  >
                    <option value="short_answer">ตอบสั้น (1 บรรทัด)</option>
                    <option value="paragraph">ตอบยาว (ย่อหน้า)</option>
                    <option value="radio">ตัวเลือก (เลือกได้ข้อเดียว)</option>
                    <option value="checkbox">ตัวเลือก (เลือกได้หลายข้อ)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Options for radio / checkbox */}
                {(q.type === "radio" || q.type === "checkbox") && (
                  <div className="pl-9 space-y-2">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs">
                          {q.type === "radio" ? "⚪" : "⬜"}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOptionText(q.id, optIdx, e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        {q.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOption(q.id, optIdx)}
                            className="text-slate-400 hover:text-rose-500 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(q.id)}
                      className="text-xs text-indigo-600 hover:underline font-medium mt-1 inline-block"
                    >
                      + เพิ่มตัวเลือก
                    </button>
                  </div>
                )}

                {/* Question Settings Bar */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(q.id, "required", e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>จำเป็นต้องตอบ</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className="px-5 py-2.5 rounded-xl border border-slate-300 font-medium text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? "กำลังบันทึก..." : "เผยแพร่แบบสอบถาม"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
