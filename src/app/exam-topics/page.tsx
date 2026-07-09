import Link from 'next/link';
import { ArrowLeft, BookOpen, AlertCircle, Calendar } from 'lucide-react';
import Countdown from '@/components/Countdown';

const examTopics = [
  {
    subject: "คณิตศาสตร์ 3",
    teacher: "มิสเสาวลักษณ์",
    topics: [
      "ระบบสมการเชิงเส้นสองตัวแปร",
      "การแยกตัวประกอบของพหุนามดีกรีสอง",
      "ทฤษฎีบทพีทาโกรัสและบทกลับ",
    ]
  },
  {
    subject: "วิทยาศาสตร์ 3",
    teacher: "ม.ธนากร",
    topics: [
      "ระบบร่างกายมนุษย์ (ระบบหายใจ, ระบบขับถ่าย)",
      "การแยกสารผสม",
      "งานและพลังงาน"
    ]
  },
  {
    subject: "ภาษาอังกฤษ 3",
    teacher: "ม.อัคเดช",
    topics: [
      "Present Simple & Continuous",
      "Past Simple Tense",
      "Vocabulary: Daily Life & Hobbies",
      "Reading Comprehension"
    ]
  },
  {
    subject: "ภาษาไทย 3",
    teacher: "ม.คมสันต์",
    topics: [
      "การแต่งกลอนสุภาพ",
      "วรรณคดี: โคลงภาพพระราชพงศาวดาร",
      "หลักการอ่านจับใจความสำคัญ"
    ]
  },
  {
    subject: "สังคมศึกษา 3",
    teacher: "มิสธนวรรณ",
    topics: [
      "ภูมิศาสตร์ทวีปเอเชีย",
      "การพัฒนาที่ยั่งยืน",
      "หน้าที่พลเมืองดีตามวิถีประชาธิปไตย"
    ]
  }
];

export default function ExamTopicsPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Navigation */}
        <div className="flex items-center justify-between mb-2">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200"
          >
            <ArrowLeft size={16} />
            กลับหน้าหลัก
          </Link>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-8 md:p-12 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="bg-white/20 text-white p-5 rounded-full mb-6 backdrop-blur-md">
              <BookOpen size={48} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">เนื้อหาออกสอบกลางภาค 1/69</h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              รวมเนื้อหาที่ออกสอบทุกวิชา เตรียมตัวให้พร้อมสำหรับการสอบกลางภาค
            </p>

            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 flex flex-col items-center">
              <div className="flex items-center gap-2 text-white/90 mb-2">
                <Calendar size={20} />
                <span className="font-medium text-lg">นับถอยหลังวันสอบกลางภาค</span>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white tracking-wider">
                <Countdown date="2026-07-13T00:00:00+07:00" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold mb-1">ข้อมูลอาจมีการเปลี่ยนแปลง</h3>
            <p className="text-sm text-amber-700">เนื้อหาออกสอบนี้เป็นการรวบรวมเบื้องต้น โปรดตรวจสอบกับคุณครูประจำวิชาอีกครั้งเพื่อความถูกต้อง</p>
          </div>
        </div>

        {/* Topics List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {examTopics.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {item.subject}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">ครูผู้สอน: {item.teacher}</p>
                </div>
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl group-hover:scale-110 transition-transform">
                  <BookOpen size={20} />
                </div>
              </div>
              
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">หัวข้อที่ออกสอบ:</h4>
                <ul className="space-y-2">
                  {item.topics.map((topic, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-600 text-sm">
                      <span className="text-indigo-500 font-bold mt-0.5">•</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
