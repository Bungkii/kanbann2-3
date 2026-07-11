'use client';

import { useState } from 'react';
import { addExamTopic, updateExamTopic, deleteExamTopic, ExamTopic } from '../actions';
import { Edit, Trash2, Plus, X, Save, BookOpen, Layers, CheckCircle2, FileEdit, ChevronDown } from 'lucide-react';

const SUBJECT_LIST = [
  { label: 'คณิตศาสตร์', value: 'คณิตศาสตร์' },
  { label: 'วิทยาศาสตร์', value: 'วิทยาศาสตร์' },
  { label: 'ภาษาไทย', value: 'ภาษาไทย' },
  { label: 'ภาษาอังกฤษ', value: 'ภาษาอังกฤษ' },
  { label: 'สังคมศึกษา', value: 'สังคมศึกษา' },
  { label: 'ประวัติศาสตร์', value: 'ประวัติศาสตร์' },
  { label: 'STEM ACTIVITY', value: 'STEM ACTIVITY' },
  { label: 'General Science', value: 'General Science' },
  { label: 'General Math', value: 'General Math' },
];

export default function ManageClient({ initialTopics }: { initialTopics: ExamTopic[] }) {
  const [topics, setTopics] = useState<ExamTopic[]>(initialTopics);
  const [isEditing, setIsEditing] = useState<string | 'new' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    subject: '',
    teacher: '',
    topicsStr: '',
    mcqCount: 0,
    essayCount: 0
  });

  const handleEdit = (topic: ExamTopic) => {
    setFormData({
      subject: topic.subject,
      teacher: topic.teacher,
      topicsStr: topic.topics.join('\n'),
      mcqCount: topic.mcq_count || 0,
      essayCount: topic.essay_count || 0
    });
    setErrorMsg('');
    setIsEditing(topic.id);
  };

  const handleAddNew = () => {
    setFormData({ subject: '', teacher: '', topicsStr: '', mcqCount: 0, essayCount: 0 });
    setErrorMsg('');
    setIsEditing('new');
  };

  const handleCancel = () => {
    setIsEditing(null);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const fd = new FormData();
    fd.append('subject', formData.subject);
    fd.append('teacher', formData.teacher);
    fd.append('topics', formData.topicsStr);
    fd.append('mcq_count', formData.mcqCount.toString());
    fd.append('essay_count', formData.essayCount.toString());

    let res;
    if (isEditing === 'new') {
      res = await addExamTopic(fd);
    } else if (isEditing) {
      res = await updateExamTopic(isEditing, fd);
    }

    if (res?.success) {
      setIsEditing(null);
      window.location.reload(); 
    } else {
      setErrorMsg(res?.error || 'เกิดข้อผิดพลาด');
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันที่จะลบเนื้อหาสอบนี้?')) return;
    const res = await deleteExamTopic(id);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error || 'ลบไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      {isEditing && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-100 ring-1 ring-indigo-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
          
          <div className="relative z-10 flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-900">
              <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                {isEditing === 'new' ? <Plus size={20} /> : <Edit size={20} />}
              </span>
              {isEditing === 'new' ? 'เพิ่มวิชาสอบใหม่' : 'แก้ไขวิชาสอบ'}
            </h2>
            <button onClick={handleCancel} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-medium border border-rose-100 flex items-center gap-2">
              <X size={16} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อวิชา</label>
                <div className="relative">
                  <select
                    required={(!SUBJECT_LIST.some(s => s.value === formData.subject) && formData.subject !== '') ? false : true}
                    value={(!SUBJECT_LIST.some(s => s.value === formData.subject) && formData.subject !== '') ? 'อื่นๆ' : formData.subject}
                    onChange={(e) => {
                      if (e.target.value === 'อื่นๆ') {
                        setFormData({...formData, subject: ' '}); // trigger custom mode
                      } else {
                        setFormData({...formData, subject: e.target.value});
                      }
                    }}
                    className="w-full appearance-none bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium pr-10 cursor-pointer"
                  >
                    <option value="">-- เลือกวิชา --</option>
                    {SUBJECT_LIST.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                    <option value="อื่นๆ">อื่นๆ (โปรดระบุ)</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {(!SUBJECT_LIST.some(s => s.value === formData.subject) && formData.subject !== '') && (
                  <input 
                    type="text" 
                    required 
                    value={formData.subject.trim()}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium mt-3"
                    placeholder="พิมพ์ชื่อวิชาเอง..."
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ครูผู้สอน</label>
                <input 
                  type="text" 
                  required 
                  value={formData.teacher}
                  onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  placeholder="เช่น มิสเสาวลักษณ์"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  ปรนัย (กี่ข้อ)
                </label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.mcqCount}
                  onChange={(e) => setFormData({...formData, mcqCount: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <FileEdit size={16} className="text-amber-500" />
                  อัตนัย (กี่ข้อ)
                </label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.essayCount}
                  onChange={(e) => setFormData({...formData, essayCount: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Layers size={16} className="text-indigo-500" />
                หัวข้อที่ออกสอบ (ขึ้นบรรทัดใหม่สำหรับแต่ละหัวข้อ)
              </label>
              <textarea 
                required 
                rows={6}
                value={formData.topicsStr}
                onChange={(e) => setFormData({...formData, topicsStr: e.target.value})}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium resize-none leading-relaxed"
                placeholder="บทที่ 1 การแยกตัวประกอบ...&#10;บทที่ 2 ทฤษฎีบทพีทาโกรัส..."
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={handleCancel}
                className="px-6 py-3 rounded-2xl font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-8 py-3 rounded-2xl font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? 'กำลังบันทึก...' : <><Save size={20} /> บันทึกข้อมูล</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isEditing && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleAddNew}
            className="bg-indigo-900 hover:bg-indigo-800 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2 hover:shadow-indigo-900/40 hover:-translate-y-0.5"
          >
            <Plus size={20} /> เพิ่มวิชาสอบ
          </button>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100">
        {topics.length === 0 ? (
          <div className="p-16 text-center">
            <div className="bg-slate-100 text-slate-400 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">ยังไม่มีข้อมูลวิชาสอบ</h3>
            <p className="text-slate-500">กดปุ่มเพิ่มวิชาสอบด้านบนเพื่อเริ่มต้นได้เลยครับ</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100/80">
            {topics.map(topic => (
              <li key={topic.id} className="p-6 md:p-8 hover:bg-indigo-50/30 transition-all duration-300 flex flex-col md:flex-row md:items-start justify-between gap-6 group">
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-bold text-xl text-slate-800 group-hover:text-indigo-700 transition-colors">{topic.subject}</h3>
                    <span className="text-sm bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">
                      ครูผู้สอน: {topic.teacher}
                    </span>
                    {((topic.mcq_count ?? 0) > 0 || (topic.essay_count ?? 0) > 0) ? (
                      <div className="flex gap-2">
                        {(topic.mcq_count ?? 0) > 0 && (
                          <span className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                            <CheckCircle2 size={12} /> ปรนัย {topic.mcq_count} ข้อ
                          </span>
                        )}
                        {(topic.essay_count ?? 0) > 0 && (
                          <span className="text-xs bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                            <FileEdit size={12} /> อัตนัย {topic.essay_count} ข้อ
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>
                  
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <Layers size={16} className="text-indigo-500" /> หัวข้อที่ออกสอบ
                    </h4>
                    <ul className="space-y-2">
                      {topic.topics.map((t, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                          <span className="text-indigo-400 mt-0.5">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0 self-end md:self-start opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => handleEdit(topic)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl transition-all bg-indigo-50 shadow-sm border border-indigo-100 hover:border-transparent"
                  >
                    <Edit size={16} /> แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(topic.id)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all bg-rose-50 shadow-sm border border-rose-100 hover:border-transparent"
                  >
                    <Trash2 size={16} /> ลบ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
