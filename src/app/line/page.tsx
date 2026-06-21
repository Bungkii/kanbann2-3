'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { sendCustomLineMessage, createCustomPoll } from './actions';
import LineBroadcastButtons from '@/components/LineBroadcastButtons';

export default function LinePage() {
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Custom Poll States
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollEndTime, setPollEndTime] = useState('');
  const [isStartingPoll, setIsStartingPoll] = useState(false);

  const handleSendCustomMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim()) {
      toast.error('กรุณาพิมพ์ข้อความก่อนส่ง');
      return;
    }

    if (!confirm('ยืนยันการส่งข้อความนี้เข้า LINE ทันทีหรือไม่?')) {
      return;
    }

    setIsSending(true);
    const toastId = toast.loading('กำลังส่งข้อความ...');

    try {
      const result = await sendCustomLineMessage(customMessage.trim());
      
      if (result?.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success('ส่งข้อความสำเร็จ! 🎉', { id: toastId });
        setCustomMessage('');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการส่งข้อความ', { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  const handleAddOption = () => {
    if (pollOptions.length >= 10) {
      toast.error('เพิ่มได้สูงสุด 10 ตัวเลือกเท่านั้น (ข้อจำกัดของ LINE)');
      return;
    }
    setPollOptions([...pollOptions, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length <= 2) {
      toast.error('ต้องมีอย่างน้อย 2 ตัวเลือก');
      return;
    }
    const newOptions = [...pollOptions];
    newOptions.splice(index, 1);
    setPollOptions(newOptions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleStartPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion.trim()) {
      toast.error('กรุณากรอกคำถามโพล');
      return;
    }
    
    const validOptions = pollOptions.map(o => o.trim()).filter(o => o !== '');
    if (validOptions.length < 2) {
      toast.error('กรุณากรอกตัวเลือกอย่างน้อย 2 ข้อ');
      return;
    }

    if (!pollEndTime) {
      toast.error('กรุณาเลือกเวลาปิดโหวต');
      return;
    }

    if (!confirm(`ยืนยันการเปิดโพล "${pollQuestion}" และส่งเข้า LINE ทันทีหรือไม่?`)) {
      return;
    }

    setIsStartingPoll(true);
    const toastId = toast.loading('กำลังสร้างโพลและส่งเข้า LINE...');

    try {
      const isoDateTime = new Date(pollEndTime).toISOString();
      const result = await createCustomPoll(pollQuestion.trim(), validOptions, isoDateTime);
      
      if (result?.error) {
        toast.error(result.error, { id: toastId });
      } else if (result?.requireTrigger) {
        toast.success('บันทึกโพลแล้ว! กรุณาพิมพ์ "พริมจ๋า ส่งโพลล่าสุด" ในแชทกลุ่ม LINE เพื่อให้บอทส่งโพล (ฟรีโควต้า)', { id: toastId, duration: 8000 });
        setPollQuestion('');
        setPollOptions(['', '']);
        setPollEndTime('');
      } else {
        toast.success('เปิดโพลโหวตสำเร็จ! 🎉', { id: toastId });
        setPollQuestion('');
        setPollOptions(['', '']);
        setPollEndTime('');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสร้างโพล', { id: toastId });
    } finally {
      setIsStartingPoll(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">จัดการข้อความ LINE 💬</h1>
            <p className="text-slate-500 mt-1">ส่งข้อความแจ้งเตือนเข้ากลุ่ม LINE ของห้อง</p>
          </div>
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            กลับหน้าหลัก
          </Link>
        </div>

        {/* Start Poll Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">สร้างโพลใหม่ (Custom Poll)</h2>
              <p className="text-slate-500 text-sm">สร้างคำถามโพล ตั้งตัวเลือกเอง และส่งปุ่มโหวตเข้ากลุ่มทันที</p>
            </div>
          </div>

          <form onSubmit={handleStartPoll} className="space-y-5">
            <div>
              <label htmlFor="pollQuestion" className="block text-sm font-medium text-slate-700 mb-2">
                หัวข้อโพล (คำถาม)
              </label>
              <input
                type="text"
                id="pollQuestion"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="เช่น เย็นนี้กินอะไรดี?"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                disabled={isStartingPoll}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  ตัวเลือกโหวต
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={pollOptions.length >= 10 || isStartingPoll}
                  className="text-amber-600 hover:text-amber-700 text-sm font-medium disabled:opacity-50"
                >
                  + เพิ่มตัวเลือก
                </button>
              </div>
              <div className="space-y-3">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`ตัวเลือกที่ ${index + 1}`}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      disabled={isStartingPoll}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        disabled={isStartingPoll}
                        className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="ลบตัวเลือกนี้"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="pollEndTime" className="block text-sm font-medium text-slate-700 mb-2">
                เวลาปิดโหวต (สิ้นสุดโพล)
              </label>
              <input
                type="datetime-local"
                id="pollEndTime"
                value={pollEndTime}
                onChange={(e) => setPollEndTime(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                disabled={isStartingPoll}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isStartingPoll || !pollEndTime || !pollQuestion}
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStartingPoll ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    กำลังสร้างโพล...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
                    </svg>
                    เปิดโหวตทันที
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Predefined Messages Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">ส่งข้อความด่วน (อัตโนมัติ)</h2>
              <p className="text-slate-500 text-sm">ส่งรูปแบบข้อความที่มีเตรียมไว้ให้แล้ว</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <LineBroadcastButtons />
          </div>
        </div>

        {/* Custom Message Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">ส่งข้อความกำหนดเอง</h2>
              <p className="text-slate-500 text-sm">พิมพ์ข้อความที่ต้องการส่งเข้า LINE ด้วยตัวเอง</p>
            </div>
          </div>

          <form onSubmit={handleSendCustomMessage} className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                ข้อความที่ต้องการส่ง
              </label>
              <textarea
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="พิมพ์ข้อความที่นี่..."
                rows={5}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                disabled={isSending}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSending || !customMessage.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                    </svg>
                    ส่งข้อความ
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
