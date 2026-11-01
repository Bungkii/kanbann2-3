'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Calendar, BookOpen, Send, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { getAiHomeworkDraftAction, parseHomeworkWithAiAction, saveAiParsedTasksAction } from '@/app/add/actions';

interface ParsedTask {
  subject: string;
  details: string;
  due_date: string;
  teacher_name?: string | null;
  submission_method?: string | null;
  work_type?: 'individual' | 'group';
  group_size?: number | null;
  max_score?: number | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  draftId?: string | null;
}

const SAMPLE_TEXT = `งาน 29/10/2026

📌อังกฤษ
ทำstory board เกี่ยวกับเรื่องสยองขวัญ🎃วาดภาพ8ฉาก และเขียน เนื้อเรื่องตามภาพแต่ละฉาก ใส่สมุด
ส่ง30/10/2026
📌ศิลปะ
วิจารณ์ผลงานศิลปะ
-ชื่องาน
-วาดโดย
-เอกภาพ
-จุดเด่น
-จุดรอง
-ความกลมกลืน
ส่งสัปดาห์ที่3ของการเปิดเทอม
ทำในแอปแล้วปริ้น หรือ ในกระดาษก็ได้
ใช้ผลงานตัวเองหรือศิลปินได้หมด
📌ไทย
ปริ้นเนื้อหาข่าวอะไรก็ได้ แค่เนื้อหาไม่ต้องปริ้นภาพ นำมา30/10/2026`;

export default function AiHomeworkImportModal({ isOpen, onClose, draftId }: Props) {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tasks, setTasks] = useState<ParsedTask[]>([]);
  const [modelUsed, setModelUsed] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !draftId) return;
    let active = true;
    getAiHomeworkDraftAction(draftId).then((result) => {
      if (!active) return;
      if ('error' in result) toast.error(result.error || 'เปิดรายการไม่ได้');
      else {
        setTasks(result.tasks as ParsedTask[]);
        setModelUsed(result.modelUsed || 'Gemini');
      }
    });
    return () => { active = false; };
  }, [isOpen, draftId]);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      toast.error('กรุณาวางข้อความการบ้านก่อนกดวิเคราะห์');
      return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading('Gemini 3.5 Flash Lite กำลังอ่านและจัดระเบียบการบ้าน...');
    try {
      const res = await parseHomeworkWithAiAction(inputText);
      if (res.error) {
        toast.error(`วิเคราะห์ไม่สำเร็จ: ${res.error}`, { id: toastId });
      } else if (res.tasks && res.tasks.length > 0) {
        setTasks(res.tasks);
        setModelUsed(res.modelUsed || 'Gemini 3.5 Flash Lite');
        toast.success(`ถอดการบ้านสำเร็จ ${res.tasks.length} วิชา! ✨`, { id: toastId });
      } else {
        toast.error('ไม่พบรายการการบ้านในข้อความที่ให้มา', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ AI', { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, changes: Partial<ParsedTask>) => {
    setTasks((current) => current.map((task, i) => i === index ? { ...task, ...changes } : task));
  };

  const handleSaveAll = async () => {
    if (tasks.length === 0) return;

    setIsSaving(true);
    const toastId = toast.loading('กำลังบันทึกการบ้านลงระบบ...');
    try {
      const res = await saveAiParsedTasksAction(tasks, draftId || undefined);
      if (res.success) {
        toast.success(`บันทึกการบ้าน ${'insertedCount' in res ? res.insertedCount : tasks.length} รายการเรียบร้อยแล้ว!`, { id: toastId });
        onClose();
        router.push('/kanban');
      } else {
        toast.error(`บันทึกไม่สำเร็จ: ${res.error}`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || 'เกิดข้อผิดพลาดในการบันทึก', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-indigo-100 my-8 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
              <Sparkles size={24} className="text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-xl flex items-center gap-2">
                ถอดข้อความการบ้านด้วย AI
                <span className="text-xs bg-indigo-500/50 text-indigo-100 px-2.5 py-0.5 rounded-full font-mono">
                  Gemini 3.5 Flash Lite
                </span>
              </h3>
              <p className="text-xs text-indigo-100 mt-0.5">
                วางข้อความสรุปงานจาก LINE ที่เพื่อนหรือครูส่งมา แล้ว AI จะแยกวิชา วันส่ง และรายละเอียดให้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {tasks.length === 0 ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  ข้อความการบ้านจาก LINE:
                </label>
                <button
                  type="button"
                  onClick={() => setInputText(SAMPLE_TEXT)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                >
                  ลองใส่ข้อความตัวอย่าง
                </button>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="วางข้อความที่เพื่อนส่งในไลน์ที่นี่ได้เลย เช่น:&#10;งาน 29/10/2026&#10;📌อังกฤษ ทำ story board ส่ง 30/10&#10;📌ไทย ปริ้นข่าว นำมา 30/10..."
                rows={9}
                className="w-full border border-slate-300 rounded-2xl p-4 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed resize-none"
              />

              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                <div className="text-xs text-indigo-900 leading-relaxed">
                  <strong>AI จะช่วยวิเคราะห์ให้อัตโนมัติ:</strong>
                  <ul className="list-disc list-inside mt-1 text-slate-600 space-y-0.5">
                    <li>แยกแยะชื่อวิชาภาษาไทยอย่างถูกต้อง (เช่น อังกฤษ, ศิลปะ, ไทย)</li>
                    <li>แปลงวันกำหนดส่งจากข้อความ เช่น &quot;ส่ง 30/10&quot; หรือ &quot;สัปดาห์ที่ 3 ของเปิดเทอม&quot;</li>
                    <li>จับช่องทางการส่งงาน (ใส่สมุด, ปริ้นในกระดาษ, ส่งในไลน์ ฯลฯ)</li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !inputText.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium py-3.5 rounded-2xl shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>กำลังประมวลผลด้วย Gemini 3.5 Flash Lite...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>วิเคราะห์และแยกวิชาด้วย AI</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    พบการบ้าน {tasks.length} รายการ
                  </h4>
                  <p className="text-xs text-slate-500">
                    โมเดลที่ใช้: <span className="font-mono font-medium text-indigo-600">{modelUsed}</span> — สามารถตรวจสอบความถูกต้องก่อนกดบันทึก
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTasks([])}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-medium"
                >
                  ถอดข้อความใหม่
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {tasks.map((task, idx) => {
                  const dueDate = new Date(task.due_date);
                  const dateStr = !isNaN(dueDate.getTime())
                    ? dueDate.toLocaleDateString('th-TH', { dateStyle: 'long' })
                    : 'ตามที่ระบุ';

                  return (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 relative group hover:border-indigo-300 transition-colors"
                    >
                      <button
                        onClick={() => handleRemoveTask(idx)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="ลบรายการนี้"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-xl text-sm">
                          📌 {task.subject}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar size={13} className="text-indigo-500" />
                          กำหนดส่ง: {dateStr}
                        </span>
                      </div>

                      <div className="text-sm text-slate-700 whitespace-pre-line bg-white rounded-xl p-3 border border-slate-100">
                        {task.details}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="text-xs text-slate-600">วิชา
                          <input className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm" value={task.subject} onChange={(e) => updateTask(idx, { subject: e.target.value })} />
                        </label>
                        <label className="text-xs text-slate-600">วันส่ง (ตรวจแก้หากเป็นวันประมาณ)
                          <input type="date" className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm" value={Number.isNaN(dueDate.getTime()) ? '' : dueDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })} onChange={(e) => updateTask(idx, { due_date: `${e.target.value}T17:00:00+07:00` })} />
                        </label>
                      </div>
                      <label className="text-xs text-slate-600">รายละเอียดงาน
                        <textarea className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm" rows={4} value={task.details} onChange={(e) => updateTask(idx, { details: e.target.value })} />
                      </label>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {task.submission_method && (
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100">
                            📦 ส่ง: {task.submission_method}
                          </span>
                        )}
                        {task.teacher_name && (
                          <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-100">
                            👤 {task.teacher_name}
                          </span>
                        )}
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                          👥 {task.work_type === 'group' ? 'งานกลุ่ม' : 'งานเดี่ยว'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {tasks.length > 0 && (
          <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setTasks([])}
              className="text-slate-600 hover:text-slate-800 text-sm font-medium px-4 py-2"
            >
              ยกเลิก / แก้ไขข้อความ
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>บันทึกทั้ง {tasks.length} รายการลงระบบ</span>
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
