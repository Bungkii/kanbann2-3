"use client";

import { useState, useEffect } from "react";
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
  BarChart3,
  Users,
  FileDown,
  Award,
  ExternalLink,
  Eye,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { createForm, updateForm, deleteForm, getFormResponses } from "./actions";
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
  const [activeTab, setActiveTab] = useState<"list" | "create" | "excel" | "responses">("list");
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  
  // Manual / Excel Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isQuiz, setIsQuiz] = useState(false);
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

  // Response Viewer State
  const [viewingForm, setViewingForm] = useState<any | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [responseSearchQuery, setResponseSearchQuery] = useState("");

  // Open Responses Dashboard
  const handleOpenResponses = async (form: any) => {
    setViewingForm(form);
    setActiveTab("responses");
    setIsLoadingResponses(true);
    try {
      const data = await getFormResponses(form.id);
      setResponses(data || []);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลคำตอบได้");
    } finally {
      setIsLoadingResponses(false);
    }
  };

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
      setIsQuiz(Boolean(parsed.isQuiz));
      if (parsed.maxPoints !== null && parsed.maxPoints !== undefined) {
        setMaxPoints(String(parsed.maxPoints));
      }
      if (parsed.questions.length > 0) {
        setQuestions(parsed.questions);
      }
      toast.dismiss(loadingToast);
      toast.success(`นำเข้าฟอร์มสำเร็จ! ตรวจพบ ${parsed.questions.length} คำถาม ${parsed.isQuiz ? "(โหมดแบบทดสอบ)" : ""}`);
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
      points: isQuiz ? 1 : 0,
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

  // Multiple Choice / Checkbox Choice Correct Answer Toggle Helper
  const toggleCorrectChoice = (qId: string, optVal: string, isCheckboxes: boolean) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          if (isCheckboxes) {
            // Can select multiple correct answers
            const currentList = q.correct_answer ? String(q.correct_answer).split(',').map(s => s.trim()).filter(Boolean) : [];
            let newList: string[];
            if (currentList.includes(optVal)) {
              newList = currentList.filter(s => s !== optVal);
            } else {
              newList = [...currentList, optVal];
            }
            return { ...q, correct_answer: newList.join(',') };
          } else {
            // Single choice (multiple_choice or dropdown)
            const current = String(q.correct_answer || "").trim();
            return { ...q, correct_answer: current === optVal ? "" : optVal };
          }
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
          const optToRemove = q.options?.[optIdx];
          const newOpts = (q.options || []).filter((_: any, i: number) => i !== optIdx);
          let newCorrect = q.correct_answer;
          if (optToRemove && newCorrect) {
            const list = String(newCorrect).split(',').map(s => s.trim()).filter(s => s !== optToRemove);
            newCorrect = list.join(',');
          }
          return {
            ...q,
            options: newOpts,
            correct_answer: newCorrect,
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
          const oldOpt = q.options?.[optIdx];
          const newOpts = [...(q.options || [])];
          newOpts[optIdx] = text;
          let newCorrect = q.correct_answer;
          if (oldOpt && newCorrect) {
            const list = String(newCorrect).split(',').map(s => s.trim()).map(s => s === oldOpt ? text : s);
            newCorrect = list.join(',');
          }
          return { ...q, options: newOpts, correct_answer: newCorrect };
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
    setIsQuiz(false);
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
    setIsQuiz(Boolean(form.is_quiz));
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
          is_quiz: isQuiz,
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
          is_quiz: isQuiz,
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

  // Calculate Quiz statistics for responses
  const avgScore = responses.length > 0 && viewingForm?.is_quiz
    ? (responses.reduce((acc, r) => acc + (Number(r.score) || 0), 0) / responses.length).toFixed(1)
    : null;

  const filteredResponses = responses.filter(r => {
    if (!responseSearchQuery.trim()) return true;
    const q = responseSearchQuery.toLowerCase();
    const name = String(r.respondent_name || "").toLowerCase();
    const id = String(r.respondent_id || "").toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  return (
    <div className="max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
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
              สร้าง, ตอบ, และสรุปผลแบบสอบถาม (รองรับ Google Form Types, โหมดแบบทดสอบ, ส่งออก CSV &amp; PDF)
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
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-2xl">
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
            อัปโหลด Excel / CSV
          </button>

          {viewingForm && (
            <button
              type="button"
              onClick={() => setActiveTab("responses")}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "responses"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-purple-700 bg-purple-50 hover:bg-purple-100"
              }`}
            >
              <BarChart3 size={14} />
              สรุปผลคำตอบ ({responses.length})
            </button>
          )}
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

                          {item.is_quiz && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <Award size={11} />
                              แบบทดสอบ (Quiz)
                            </span>
                          )}

                          {item.visibility === "private" ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <Lock size={11} />
                              ส่วนตัว
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                              <Globe size={11} />
                              สาธารณะ
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400">
                          โดย: {item.creator_name || "Staff"}
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
                        <span className="font-semibold text-slate-700">👥 ตอบแล้ว {responseCount} คน</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/form?id=${item.id}`}
                          className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <Send size={13} />
                          ตอบฟอร์ม
                        </Link>

                        {currentUser.isRanked && (
                          <button
                            type="button"
                            onClick={() => handleOpenResponses(item)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="ดูสรุปผลคำตอบ และดาวน์โหลด CSV/PDF"
                          >
                            <BarChart3 size={14} />
                            สรุปผล ({responseCount})
                          </button>
                        )}
                      </div>

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
                            className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors border border-rose-200 cursor-pointer"
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

      {/* TAB 4: RESPONSES DASHBOARD & EXPORTS (Google Forms Responses style) */}
      {activeTab === "responses" && viewingForm && (
        <div className="space-y-6">
          {/* Header Card for Form Responses */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    📊 สรุปผลการตอบแบบฟอร์ม
                  </span>
                  {viewingForm.is_quiz && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      🏆 แบบทดสอบ (Quiz Mode)
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                  {viewingForm.title}
                </h2>
                {viewingForm.description && (
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">{viewingForm.description}</p>
                )}
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`/api/export-form-csv?id=${viewingForm.id}`}
                  download
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <FileSpreadsheet size={16} />
                  <span>ดาวน์โหลด Excel / CSV</span>
                </a>
                <a
                  href={`/api/export-form-pdf?id=${viewingForm.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <FileDown size={16} />
                  <span>ส่งออก PDF (พิมพ์รายงาน)</span>
                </a>
              </div>
            </div>

            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold">จำนวนผู้ตอบทั้งหมด</p>
                  <h4 className="text-xl font-bold text-slate-800">{responses.length} คน</h4>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold">จำนวนข้อคำถาม</p>
                  <h4 className="text-xl font-bold text-slate-800">{viewingForm.questions?.length || 0} ข้อ</h4>
                </div>
              </div>

              {viewingForm.is_quiz && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold">คะแนนเฉลี่ย (Average Score)</p>
                    <h4 className="text-xl font-bold text-slate-800">{avgScore || 0} คะแนน</h4>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Question Breakdown Analysis (Google Forms Summary Charts/Bars) */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="text-purple-600" size={18} />
              <span>สรุปผลคำตอบรายข้อ (Question Summary)</span>
            </h3>

            {(viewingForm.questions || []).map((q: any, qIdx: number) => {
              // Count choices
              const isChoiceType = q.type === "multiple_choice" || q.type === "checkboxes" || q.type === "dropdown";
              const counts: Record<string, number> = {};
              if (isChoiceType) {
                (q.options || []).forEach((opt: string) => {
                  counts[opt] = 0;
                });
                responses.forEach((resp) => {
                  const val = resp.answers?.[q.id];
                  if (Array.isArray(val)) {
                    val.forEach((item) => {
                      counts[item] = (counts[item] || 0) + 1;
                    });
                  } else if (val) {
                    counts[val] = (counts[val] || 0) + 1;
                  }
                });
              }

              const correctList = q.correct_answer ? String(q.correct_answer).split(',').map(s => s.trim().toLowerCase()) : [];

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {qIdx + 1}
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-slate-800">{q.title}</h4>
                    </div>

                    {q.correct_answer && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl shrink-0 flex items-center gap-1">
                        <CheckCircle size={13} />
                        เฉลย: {q.correct_answer}
                      </span>
                    )}
                  </div>

                  {/* If Choice type: Show Bar distribution */}
                  {isChoiceType ? (
                    <div className="space-y-2.5 pt-2">
                      {Object.entries(counts).map(([opt, count]) => {
                        const percent = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;
                        const isCorrect = correctList.includes(opt.trim().toLowerCase());
                        return (
                          <div key={opt} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-semibold flex items-center gap-1.5 ${isCorrect ? 'text-emerald-700 font-bold' : 'text-slate-700'}`}>
                                {isCorrect && <Check size={14} className="text-emerald-600" />}
                                {opt}
                              </span>
                              <span className="text-slate-500 font-medium">
                                {count} คน ({percent}%)
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isCorrect ? "bg-emerald-500" : "bg-purple-500"
                                }`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* If text/date/time: Show recent answers list */
                    <div className="pt-2">
                      <p className="text-xs font-bold text-slate-500 mb-2">ตัวอย่างคำตอบล่าสุด ({responses.length} คำตอบ):</p>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                        {responses.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">ยังไม่มีผู้ตอบคำถามข้อนี้</p>
                        ) : (
                          responses.slice(0, 10).map((resp, i) => (
                            <div
                              key={i}
                              className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700 flex items-center justify-between gap-2"
                            >
                              <span>{String(resp.answers?.[q.id] || "-")}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {resp.respondent_name || "นิรนาม"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Individual Respondents Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-pink-600" size={18} />
                <span>รายชื่อผู้ตอบทั้งหมด ({filteredResponses.length} คน)</span>
              </h3>

              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ หรือเลขประจำตัว..."
                  value={responseSearchQuery}
                  onChange={(e) => setResponseSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50"
                />
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">เวลาที่ตอบ</th>
                    <th className="py-3 px-4">เลขประจำตัว</th>
                    <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                    {viewingForm.is_quiz && <th className="py-3 px-4 text-center">คะแนน</th>}
                    <th className="py-3 px-4">ตัวอย่างคำตอบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingResponses ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        กำลังโหลดข้อมูลผู้ตอบ...
                      </td>
                    </tr>
                  ) : filteredResponses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลคำตอบ
                      </td>
                    </tr>
                  ) : (
                    filteredResponses.map((r, idx) => (
                      <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString("th-TH", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {r.respondent_id || "-"}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {r.respondent_name || "ผู้ไม่ประสงค์ออกนาม"}
                        </td>
                        {viewingForm.is_quiz && (
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              {r.score ?? 0} / {r.max_score ?? viewingForm.max_points ?? 0}
                            </span>
                          </td>
                        )}
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {Object.values(r.answers || {})
                            .map((v) => (Array.isArray(v) ? v.join(", ") : String(v)))
                            .join(" | ") || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
                อัปโหลดไฟล์ template เพื่อแปลงเป็นแบบสอบถาม Google Form อัตโนมัติ (ตรวจจับเฉลยและคะแนนให้อัตโนมัติ)
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
              <li>กรณี Type ปรนัย หรือ ไม่ใช่ตัวเลือก ให้ใส่คำตอบในช่อง <strong>Correct</strong> (เช่น วันที่ DD/MM/YYYY)</li>
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

            {/* Quiz Mode & Visibility Settings */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quiz Mode Toggle */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Award size={15} className="text-purple-600" />
                    ตั้งเป็นแบบทดสอบ (Quiz Mode)
                  </span>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    ตรวจคำตอบอัตโนมัติ คำนวณคะแนนตามเฉลย
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="quiz_toggle"
                  checked={isQuiz}
                  onChange={(e) => setIsQuiz(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-5 h-5 cursor-pointer"
                />
              </div>

              {/* Privacy / Visibility Setting */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    การเข้าถึง (Visibility)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {visibility === "public" ? "สาธารณะ (แสดงในรายการ)" : "ส่วนตัว (เฉพาะคนมีลิงก์)"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      visibility === "public"
                        ? "bg-sky-50 text-sky-700 border-sky-300 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    สาธารณะ
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      visibility === "private"
                        ? "bg-amber-50 text-amber-700 border-amber-300 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    ส่วนตัว
                  </button>
                </div>
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
            <div className="flex items-center justify-between flex-wrap gap-2">
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

            {questions.map((q, idx) => {
              const isChoiceType = q.type === "multiple_choice" || q.type === "checkboxes" || q.type === "dropdown";
              const correctList = q.correct_answer ? String(q.correct_answer).split(',').map(s => s.trim().toLowerCase()) : [];

              return (
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
                  {isChoiceType && (
                    <div className="pl-0 sm:pl-11 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          รายการตัวเลือก (Options) &amp; เลือกช้อยที่ถูกต้อง (Correct Choice):
                        </p>
                        <span className="text-[10px] text-pink-600 font-medium">
                          * กดปุ่มวงกลม/ถูก ข้างตัวเลือกเพื่อตั้งเป็นเฉลยคำตอบ
                        </span>
                      </div>

                      {(q.options || []).map((opt: string, optIdx: number) => {
                        const isCorrect = correctList.includes(opt.trim().toLowerCase());
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2.5 p-2 rounded-2xl border transition-all ${
                              isCorrect
                                ? "bg-emerald-50/70 border-emerald-300"
                                : "bg-white border-slate-200"
                            }`}
                          >
                            {/* Toggle Choice as Correct Answer */}
                            <button
                              type="button"
                              onClick={() => toggleCorrectChoice(q.id, opt, q.type === "checkboxes")}
                              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                isCorrect
                                  ? "bg-emerald-600 text-white shadow-2xs"
                                  : "bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-700"
                              }`}
                              title={isCorrect ? "ตัวเลือกนี้คือคำตอบที่ถูกต้อง (กดเพื่อยกเลิก)" : "กดเพื่อให้ตัวเลือกนี้เป็นคำตอบที่ถูกต้อง"}
                            >
                              <Check size={14} />
                              <span className="text-[10px]">{isCorrect ? "เฉลย" : "ตั้งเป็นเฉลย"}</span>
                            </button>

                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOptionText(q.id, optIdx, e.target.value)}
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500 text-slate-800 bg-transparent"
                            />
                            {q.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOption(q.id, optIdx)}
                                className="text-slate-400 hover:text-rose-500 text-xs p-1 cursor-pointer"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}
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
                        placeholder={
                          isChoiceType
                            ? "คลิกเลือกที่ตัวเลือกด้านบน หรือพิมพ์เฉลยที่นี่"
                            : q.type === "date"
                            ? "เช่น 07/10/2026 หรือ 07/10/2569"
                            : "คำตอบที่ถูกต้อง..."
                        }
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
              );
            })}
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
