'use client';

import { useState } from 'react';
import { addExamTopic, updateExamTopic, deleteExamTopic, ExamTopic } from '../actions';
import { Edit, Trash2, Plus, X, Save } from 'lucide-react';

export default function ManageClient({ initialTopics }: { initialTopics: ExamTopic[] }) {
  const [topics, setTopics] = useState<ExamTopic[]>(initialTopics);
  const [isEditing, setIsEditing] = useState<string | 'new' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    subject: '',
    teacher: '',
    topicsStr: ''
  });

  const handleEdit = (topic: ExamTopic) => {
    setFormData({
      subject: topic.subject,
      teacher: topic.teacher,
      topicsStr: topic.topics.join('\n')
    });
    setErrorMsg('');
    setIsEditing(topic.id);
  };

  const handleAddNew = () => {
    setFormData({ subject: '', teacher: '', topicsStr: '' });
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

    let res;
    if (isEditing === 'new') {
      res = await addExamTopic(fd);
    } else if (isEditing) {
      res = await updateExamTopic(isEditing, fd);
    }

    if (res?.success) {
      setIsEditing(null);
      // Let server component fetch and pass new initialTopics in a real app,
      // but here we rely on revalidatePath which will trigger a page reload naturally.
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
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {isEditing === 'new' ? 'เพิ่มวิชาสอบใหม่' : 'แก้ไขวิชาสอบ'}
            </h2>
            <button onClick={handleCancel} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl mb-4 text-sm font-medium border border-rose-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อวิชา</label>
              <input 
                type="text" 
                required 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="เช่น คณิตศาสตร์ 3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ครูผู้สอน</label>
              <input 
                type="text" 
                required 
                value={formData.teacher}
                onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="เช่น มิสเสาวลักษณ์"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">หัวข้อที่ออกสอบ (ขึ้นบรรทัดใหม่สำหรับแต่ละหัวข้อ)</label>
              <textarea 
                required 
                rows={5}
                value={formData.topicsStr}
                onChange={(e) => setFormData({...formData, topicsStr: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="บทที่ 1...&#10;บทที่ 2..."
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังบันทึก...' : <><Save size={18} /> บันทึกข้อมูล</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isEditing && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleAddNew}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-5 py-2.5 rounded-full shadow-sm transition-all flex items-center gap-2 hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus size={18} /> เพิ่มวิชาสอบ
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
        {topics.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            ยังไม่มีข้อมูลเนื้อหาออกสอบ
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {topics.map(topic => (
              <li key={topic.id} className="p-5 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg text-slate-800">{topic.subject}</h3>
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">
                      ครูผู้สอน: {topic.teacher}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {topic.topics.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <button
                    onClick={() => handleEdit(topic)}
                    className="p-2 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors bg-white shadow-sm border border-indigo-100"
                    title="แก้ไข"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(topic.id)}
                    className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors bg-white shadow-sm border border-rose-100"
                    title="ลบ"
                  >
                    <Trash2 size={16} />
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
