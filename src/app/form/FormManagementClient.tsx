"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  Plus,
  Trash2,
  CheckCircle2,
  Copy,
  Send,
  HelpCircle,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  CheckSquare,
  CircleDot,
  FileText,
  AlignLeft,
  ChevronDown,
  Upload,
  Check,
  Share2,
  Edit3,
  Globe,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { createForm, updateForm, deleteForm } from "./actions";
import { parseExcelOrCsvForm, normalizeDateInput } from "./excelParser";
import Link from "next/link";

export const GOOGLE_FORM_TYPES = [
  { value: "short_answer", label: "Short answer (ตอบสั้น)", icon: FileText },
  { value: "paragraph", label: "Paragraph (ย่อหน้า)", icon: AlignLeft },
  { value: "multiple_choice", label: "Multiple choice (เลือก 1 ข้อ)", icon: CircleDot },
  { value: "checkboxes", label: "Checkboxes (เลือกได้หลายข้อ)", icon: CheckSquare },
  { value: "dropdown", label: "Dropdown (เมนูเลื่อน)", icon: ChevronDown },
  { value: "file_upload", label: "File upload (อัปโหลดไฟล์)", icon: Upload },
  { value: "linear_scale", label: "Linear scale (ระดับคะแนน 1-5)", icon: Star },
  { value: "rating", label: "Rating (ดาว)", icon: Star },
  { value: "date", label: "Date (วันที่ DD/MM/YYYY)", icon: Calendar },
  { value: "time", label: "Time (เวลา)", icon: Clock },
];

export default function FormManagementClient({
  forms,
  currentUser,
}: {
  forms: any[];
  currentUser: { isRanked: boolean; role: string; name: string };
}) {
  const [activeTab, setActiveTab] = useState<"list" | "create" | "excel">("list");
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  
  // Manual / Excel Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxPoints, setMaxPoints] = useState<string>("");
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [questions, setQuestions] = useState<any[]>([
    {
      id: "q_1",
      title: "ความคิดเห็นหรือข้อเสนอแนะของคุณ",
      type: "short_answer",
      required: true,
      options: [],
      correct_answer: "",
      points: 0,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingExcel, setIsParsingExcel] = useState(false);

  // File Upload Handler for .xlsx / .csv
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    const loadingToast = toast.loading("กำลังอ่านไฟล์และถอดแบบฟอร์ม...");
    try {
      const parsed = await parseExcelOrCsvForm(file);
      setTitle(parsed.title);
      setDescription(parsed.description);
      if (parsed.maxPoints !== null && parsed.maxPoints !== undefined) {
        setMaxPoints(String(parsed.maxPoints));
      }
      if (parsed.questions.length > 0) {
        setQuestions(parsed.questions);
      }
      toast.dismiss(loadingToast);
      toast.success(`นำเข้าฟอร์มสำเร็จ! ตรวจพบ ${parsed.questions.length} คำถาม`);
      setActiveTab("create");
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(`อ่านไฟล์ไม่สำเร็จ: ${err.message || "รูปแบบไฟล์ไม่ถูกต้อง"}`);
    } finally {
      setIsParsingExcel(false);
      e.target.value = "";
    }
  };

  // Add Question
  const addQuestion = (type = "short_answer") => {
    const newQ = {
      id: `q_${Date.now()}`,
      title: "",
      type,
      required: false,
      options: type === "multiple_choice" || type === "checkboxes" || type === "dropdown" ? ["ตัวเลือกที่ 1", "ตัวเลือกที่ 2"] : [],
      correct_answer: "",
      points: 0,
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
  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          const updated = { ...q, [field]: value };
          if (field === "type") {
            if ((value === "multiple_choice" || value === "checkboxes" || value === "dropdown") && (!q.options || q.options.length === 0)) {
              updated.options = ["ตัวเลือกที่ 1", "ตัวเลือกที่ 2"];
            }
          }
          if (field === "correct_answer" && q.type === "date") {
            updated.correct_answer = normalizeDateInput(value);
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
          const currentOpts = q.options || [];
          return {
            ...q,
            options: [...currentOpts, `ตัวเลือกที่ ${currentOpts.length + 1}`],
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
            options: (q.options || []).filter((_: any, i: number) => i !== optIdx),
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
          const newOpts = [...(q.options || [])];
          newOpts[optIdx] = text;
          return { ...q, options: newOpts };
        }
        return q;
      })
    );
  };

  // Reset Form State
  const resetFormState = () => {
    setEditingFormId(null);
    setTitle("");
    setDescription("");
    setMaxPoints("");
    setAllowAnonymous(false);
    setVisibility("public");
    setQuestions([
      {
        id: "q_1",
        title: "ความคิดเห็นหรือข้อเสนอแนะของคุณ",
        type: "short_answer",
        required: true,
        options: [],
        correct_answer: "",
        points: 0,
      },
    ]);
  };

  // Populate form for editing
  const handleEditClick = (form: any) => {
    setEditingFormId(form.id);
    setTitle(form.title || "");
    setDescription(form.description || "");
    setMaxPoints(form.max_points !== null && form.max_points !== undefined ? String(form.max_points) : "");
    setAllowAnonymous(Boolean(form.allow_anonymous));
    setVisibility(form.visibility === "private" ? "private" : "public");
    setQuestions(
      form.questions && form.questions.length > 0
        ? form.questions
        : [
            {
              id: "q_1",
              title: "ความคิดเห็นหรือข้อเสนอแนะของคุณ",
              type: "short_answer",
              required: true,
              options: [],
              correct_answer: "",
              points: 0,
            },
          ]
    );
    setActiveTab("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit Form (Create or Update)
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
      if (editingFormId) {
        // Update existing form
        const res = await updateForm(editingFormId, {
          title,
          description,
          max_points: maxPoints ? Number(maxPoints) : null,
          allow_anonymous: allowAnonymous,
          visibility,
          questions,
        });

        if (res.success) {
          toast.success("บันทึกการแก้ไขแบบสอบถามสำเร็จ!");
          resetFormState();
          setActiveTab("list");
        } else {
          toast.error(res.error || "ไม่สามารถแก้ไขแบบสอบถามได้");
        }
      } else {
        // Create new form
        const res = await createForm({
          title,
          description,
          max_points: maxPoints ? Number(maxPoints) : null,
          allow_anonymous: allowAnonymous,
          visibility,
          questions,
        });

        if (res.success && res.form) {
          toast.success("สร้างแบบสอบถามสำเร็จ!");
          resetFormState();
          setActiveTab("list");
        } else {
          toast.error(res.error || "ไม่สามารถสร้างแบบสอบถามได้");
        }
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy or Web Share
  const shareForm = async (form: any) => {
    const url = `${window.location.origin}/form?id=${form.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `แบบสอบถาม: ${form.title}`,
          text: `ขอเชิญตอบแบบสอบถามห้อง ม.2/3: ${form.title}`,
          url: url,
        });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }
    // Fallback to clipboard
    navigator.clipboard.writeText(url);
    toast.success("คัดลอกลิงก์แบบสอบถามแล้ว!");
  };

  const shareLine = (form: any) => {
    const url = encodeURIComponent(`${window.location.origin}/form?id=${form.id}`);
    const text = encodeURIComponent(`ขอเชิญตอบแบบสอบถาม ม.2/3: ${form.title}\n`);
    window.open(`https://line.me/R/msg/text/?${text}${url}`, "_blank");
  };

  // Copy URL
  const copyFormUrl = (formId: string) => {
    const url = `${window.location.origin}/form?id=${formId}`;
    navigator.clipboard.writeText(url);
    toast.success("คัดลอกลิงก์แบบสอบถามแล้ว!");
  };

  return (
    <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header - Pink Brand Style (Like Evaluate Boss) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-pink-500 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>ระบบแบบสอบถาม ม.2/3</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              สร้างและตอบแบบสอบถาม (รองรับ Google Form Types &amp; Excel Import)
            </p>
          </div>
        </div>

        {currentUser.isRanked ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200 flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck size={14} />
              ยศ: {currentUser.role}
            </span>
          </div>
        ) : (
          <Link href="/" className="text-sm font-semibold text-pink-600 hover:underline">
            กลับหน้าหลัก
          </Link>
        )}
      </div>

      {/* Tabs */}
      {currentUser.isRanked && (
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-lg">
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "list"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            รายการแบบสอบถาม ({forms.length})
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeTab === "create" && editingFormId) {
                resetFormState();
              }
              setActiveTab("create");
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "create"
                ? "bg-pink-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {editingFormId ? <Edit3 size={14} /> : <Plus size={14} />}
            {editingFormId ? "แก้ไขแบบฟอร์ม" : "สร้างแบบฟอร์ม"}
          </button>
          <button
            type="button"
            onClick={() => {
              resetFormState();
              setActiveTab("excel");
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "excel"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileSpreadsheet size={14} />
            อัปโหลดไฟล์ Excel
          </button>
        </div>
      )}

      {/* TAB 1: LIST VIEW */}
      {activeTab === "list" && (
        <div className="space-y-4">
          {forms.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-pink-50 text-pink-500 mx-auto flex items-center justify-center">
                <HelpCircle size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">ยังไม่มีแบบสอบถามในระบบ</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {currentUser.isRanked
                  ? "กดปุ่ม 'สร้างแบบฟอร์ม' หรือ 'อัปโหลดไฟล์ Excel' ด้านบน เพื่อเริ่มต้นสร้างฟอร์มได้ทันที"
                  : "กรุณารอผู้มียศสร้างแบบสอบถามและแชร์ลิงก์ให้ครับ"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {forms.map((item) => {
                const responseCount = item.form_responses?.[0]?.count ?? 0;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-pink-300 transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 to-rose-400 opacity-90"></div>
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2 pt-1 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              item.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {item.is_active ? "เปิดรับคำตอบ" : "ปิดรับแล้ว"}
                          </span>

                          {item.visibility === "private" ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <Lock size={11} />
                              ส่วนตัว (เฉพาะลิงก์)
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                              <Globe size={11} />
                              สาธารณะ (ค้นหาได้)
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400">
                          โดย: {item.creator_name || "Staff"} ({item.creator_role || "Staff"})
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 group-hover:text-pink-600 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 font-medium">
                        <span>❓ {item.questions?.length || 0} ข้อ</span>
                        <span>👥 ตอบแล้ว {responseCount} คน</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <Link
                        href={`/form?id=${item.id}`}
                        className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Send size={13} />
                        เปิดตอบฟอร์ม
                      </Link>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Edit Button for ranked users / owner */}
                        {currentUser.isRanked && (
                          <button
                            type="button"
                            onClick={() => handleEditClick(item)}
                            className="p-2.5 rounded-xl text-amber-600 hover:bg-amber-50 transition-colors border border-amber-200"
                            title="แก้ไขแบบสอบถาม"
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => shareForm(item)}
                          className="p-2.5 rounded-xl text-pink-600 hover:bg-pink-50 transition-colors border border-pink-200"
                          title="แชร์แบบสอบถาม"
                        >
                          <Share2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => shareLine(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-[11px] font-bold transition-colors"
                          title="แชร์ไปยัง LINE"
                        >
                          LINE
                        </button>
                        <button
                          type="button"
                          onClick={() => copyFormUrl(item.id)}
                          className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
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
                            className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors border border-rose-200"
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

      {/* TAB 3: EXCEL UPLOAD MODAL/PANEL */}
      {activeTab === "excel" && currentUser.isRanked && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600" size={24} />
                <span>นำเข้าแบบสอบถามจากไฟล์ Excel / CSV</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                อัปโหลดไฟล์ template เพื่อแปลงเป็นแบบสอบถาม Google Form อัตโนมัติ
              </p>
            </div>

            {/* Template Download Button */}
            <a
              href="/asset/Form_Example.xlsx"
              download="Form_Example.xlsx"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 font-bold text-xs shadow-2xs transition-all w-fit"
            >
              <Download size={15} />
              <span>ดาวน์โหลดไฟล์ตัวอย่าง (Form_Example.xlsx)</span>
            </a>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition-all relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={isParsingExcel}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              รองรับไฟล์ <strong>.xlsx</strong> และ <strong>.csv</strong> ตามเทมเพลตมาตรฐาน
            </p>
          </div>

          {/* Explanation Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-800">โครงสร้างไฟล์ตัวอย่าง (Form_Example.xlsx):</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Row 1</strong>: Form title: (A1), ชื่อเรื่อง (B1), Max points: (C1), คะแนนเต็ม (D1)</li>
              <li><strong>Row 2</strong>: Form description: (A2), คำอธิบาย (B2)</li>
              <li><strong>Row 3</strong>: แถวหัวตาราง (Question #, Type, Question Text, Answer 1..4, Correct, Points)</li>
              <li><strong>Row 4 เป็นต้นไป (A4)</strong>: ข้อคำถามแต่ละข้อ โดย Type เลือกได้ตาม Google Form Types (Short answer, Paragraph, Multiple choice, Checkboxes, Dropdown, File upload, Linear scale, Rating, Date, Time)</li>
              <li>กรณี Type ไม่ใช่ตัวเลือก ให้ใส่คำตอบในช่อง <strong>Correct</strong> (เช่น วันที่ DD/MM/YYYY)</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE / EDIT FORM BUILDER */}
      {activeTab === "create" && currentUser.isRanked && (
        <form onSubmit={handleCreateForm} className="space-y-6">
          {/* Header Card (Pink themed card) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-rose-400"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อหัวข้อแบบสอบถาม (Form title) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น แบบประเมินกิจกรรมห้อง หรือ แบบสอบถาม ม.2/3"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 font-bold text-base bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คะแนนเต็ม (Max points - ถ้ามี)
                </label>
                <input
                  type="number"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(e.target.value)}
                  placeholder="เช่น 100 หรือเว้นว่างได้"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 font-semibold text-sm bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รายละเอียดคำชี้แจง (Form description - เว้นว่างได้)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุวัตถุประสงค์ คำอธิบาย หรือข้อตกลง..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium text-xs bg-slate-50/50"
              />
            </div>

            {/* Privacy / Visibility Setting */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="block text-xs font-bold text-slate-700">การเข้าถึงแบบสอบถาม (Visibility)</span>
                <p className="text-[11px] text-slate-500">
                  เลือกให้ทุกคนมองเห็นในหน้ารายการ หรือเฉพาะคนที่มีลิงก์เท่านั้น
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    visibility === "public"
                      ? "bg-sky-50 text-sky-700 border-sky-300 shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Globe size={14} />
                  <span>สาธารณะ (ค้นหาได้)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    visibility === "private"
                      ? "bg-amber-50 text-amber-700 border-amber-300 shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Lock size={14} />
                  <span>ส่วนตัว (เข้าถึงผ่านลิงก์เท่านั้น)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allow_anonymous"
                  checked={allowAnonymous}
                  onChange={(e) => setAllowAnonymous(e.target.checked)}
                  className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="allow_anonymous" className="text-xs font-medium text-slate-700 cursor-pointer">
                  อนุญาตให้ผู้ตอบสามารถเลือก <strong>&quot;ไม่ประสงค์ออกนาม&quot;</strong> ได้
                </label>
              </div>

              {editingFormId && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    กำลังแก้ไขแบบสอบถาม
                  </span>
                  <button
                    type="button"
                    onClick={resetFormState}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                  >
                    ยกเลิกการแก้ไข
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Questions Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">
                รายการข้อคำถาม ({questions.length} ข้อ)
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addQuestion("multiple_choice")}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-colors cursor-pointer"
                >
                  + ปรนัย (Multiple choice)
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("short_answer")}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                >
                  + ข้อความสั้น
                </button>
              </div>
            </div>

            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all relative"
              >
                {/* Header Row: Question #, Text & Type Select */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={q.title}
                    onChange={(e) => updateQuestion(q.id, "title", e.target.value)}
                    placeholder={`คำถามข้อที่ ${idx + 1}...`}
                    required
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(q.id, "type", e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    {GOOGLE_FORM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="text-slate-400 hover:text-rose-500 p-2 transition-colors self-end sm:self-auto cursor-pointer"
                    title="ลบคำถามข้อนี้"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Multiple choice, Checkboxes, Dropdown Options */}
                {(q.type === "multiple_choice" || q.type === "checkboxes" || q.type === "dropdown") && (
                  <div className="pl-0 sm:pl-11 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      รายการตัวเลือก (Options):
                    </p>
                    {(q.options || []).map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="flex items-center gap-2.5">
                        <span className="text-slate-400 text-xs shrink-0">
                          {q.type === "multiple_choice" ? "⚪" : q.type === "checkboxes" ? "⬜" : "🔽"}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOptionText(q.id, optIdx, e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500 text-slate-800"
                        />
                        {q.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOption(q.id, optIdx)}
                            className="text-slate-400 hover:text-rose-500 text-xs p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(q.id)}
                      className="text-xs text-pink-600 hover:underline font-bold mt-1 inline-block cursor-pointer"
                    >
                      + เพิ่มตัวเลือก
                    </button>
                  </div>
                )}

                {/* Correct Answer & Points Row */}
                <div className="pl-0 sm:pl-11 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      เฉลยคำตอบ (Correct Answer - เว้นว่างได้)
                    </label>
                    <input
                      type="text"
                      value={q.correct_answer || ""}
                      onChange={(e) => updateQuestion(q.id, "correct_answer", e.target.value)}
                      placeholder={q.type === "date" ? "เช่น 07/10/2026 หรือ 07/10/2569" : "คำตอบที่ถูกต้อง..."}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      คะแนนข้อนี้ (Points - ถ้ามี)
                    </label>
                    <input
                      type="number"
                      value={q.points || 0}
                      onChange={(e) => updateQuestion(q.id, "points", Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>

                {/* Footer of Question Card: Required Checkbox */}
                <div className="flex items-center justify-end pt-3 border-t border-slate-100 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(q.id, "required", e.target.checked)}
                      className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                    />
                    <span>จำเป็นต้องตอบ (Required)</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className="px-6 py-3 rounded-2xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 size={18} />
              <span>
                {isSubmitting
                  ? "กำลังบันทึก..."
                  : editingFormId
                  ? "บันทึกการแก้ไขแบบสอบถาม"
                  : "เผยแพร่แบบสอบถาม"}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
