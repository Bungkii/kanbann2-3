import Link from 'next/link';
import { ArrowLeft, BookOpen, AlertCircle, Calendar, Edit, CheckCircle2, FileEdit, GraduationCap } from 'lucide-react';
import Countdown from '@/components/Countdown';
import { getExamTopics } from './actions';
import { createClient } from '@/utils/supabase/server';
import sanitizeHtml from 'sanitize-html';

export const revalidate = 0; // Disable cache for dynamic data

export default async function ExamTopicsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const examTopics = await getExamTopics();

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200 w-fit font-medium hover:shadow-md"
          >
            <ArrowLeft size={18} />
            กลับหน้าหลัก
          </Link>
          {user && (
            <Link
              href="/exam-topics/manage"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-full shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 hover:shadow-indigo-600/40 hover:-translate-y-0.5 w-fit self-end sm:self-auto"
            >
              <Edit size={18} />
              จัดการเนื้อหาสอบ
            </Link>
          )}
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden ring-1 ring-white/20">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-fuchsia-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex bg-white/20 text-white p-4 rounded-2xl mb-6 backdrop-blur-md shadow-inner shadow-white/20 ring-1 ring-white/30">
                <GraduationCap size={48} strokeWidth={1.5} />
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-100 mb-6 drop-shadow-sm leading-tight">
                เนื้อหาออกสอบ<br className="hidden md:block" />กลางภาค 1/69
              </h1>
              <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 mb-8 font-medium leading-relaxed">
                รวมหัวข้อสำคัญที่ต้องอ่านเตรียมสอบ ครบทุกวิชา ให้คุณพร้อมสู้ศึกกลางภาคได้อย่างมั่นใจ
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 flex flex-col items-center w-full max-w-sm shrink-0 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)]">
              <div className="bg-indigo-500/50 p-3 rounded-full mb-4">
                <Calendar size={28} className="text-white" />
              </div>
              <h2 className="font-semibold text-xl text-indigo-100 mb-3 text-center">นับถอยหลังวันสอบ</h2>
              <div className="text-3xl md:text-4xl font-bold text-white tracking-widest drop-shadow-md">
                <Countdown date="2026-07-13T00:00:00+07:00" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 rounded-3xl p-5 flex gap-4 text-amber-800 shadow-sm">
          <div className="bg-amber-100 p-2 rounded-full shrink-0 h-fit mt-0.5">
            <AlertCircle size={22} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1 text-amber-900">ข้อมูลอาจมีการเปลี่ยนแปลง</h3>
            <p className="text-amber-700 font-medium">เนื้อหาออกสอบนี้เป็นการรวบรวมเบื้องต้น โปรดตรวจสอบกับคุณครูประจำวิชาอีกครั้งเพื่อความชัวร์ที่สุดครับ</p>
          </div>
        </div>

        {/* Topics List */}
        {examTopics.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100 shadow-xl shadow-slate-200/30">
            <div className="bg-slate-50 text-slate-300 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">ยังไม่มีข้อมูลเนื้อหาสอบ</h3>
            <p className="text-slate-500 text-lg">
              รอคนมาเพิ่มข้อมูลเนื้อหาออกสอบกันก่อนนะ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {examTopics.map((item) => (
              <div key={item.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-indigo-200/50 transition-all duration-300 p-6 md:p-8 group relative overflow-hidden flex flex-col h-full hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>
                
                <div className="relative z-10 flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors mb-2">
                      {item.subject}
                    </h3>
                    <p className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full inline-block">ครูผู้สอน: {item.teacher}</p>
                  </div>
                  <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                    <BookOpen size={24} />
                  </div>
                </div>

                {/* Exam format counts */}
                {((item.mcq_count ?? 0) > 0 || (item.essay_count ?? 0) > 0) && (
                  <div className="relative z-10 flex flex-wrap gap-3 mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    {(item.mcq_count ?? 0) > 0 && (
                      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100/50 px-4 py-2 rounded-xl font-bold flex-1 justify-center border border-emerald-100">
                        <CheckCircle2 size={18} />
                        ปรนัย {item.mcq_count} ข้อ
                      </div>
                    )}
                    {(item.essay_count ?? 0) > 0 && (
                      <div className="flex items-center gap-2 text-amber-700 bg-amber-100/50 px-4 py-2 rounded-xl font-bold flex-1 justify-center border border-amber-100">
                        <FileEdit size={18} />
                        อัตนัย {item.essay_count} ข้อ
                      </div>
                    )}
                  </div>
                )}
                
                <div className="relative z-10 mt-auto bg-indigo-50/50 rounded-2xl p-5 border border-indigo-50 flex-1">
                  <h4 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    หัวข้อที่ออกสอบ:
                  </h4>
                  <div className="prose prose-sm prose-slate max-w-none text-slate-700 font-medium prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                    {item.topics.length > 1 || (item.topics[0] && !item.topics[0].includes('<')) ? (
                      <ul className="space-y-3 list-none pl-0">
                        {item.topics.map((topic, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm font-medium leading-relaxed">
                            <span className="text-indigo-400 font-bold mt-0.5 select-none">→</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div dangerouslySetInnerHTML={{ 
                        __html: sanitizeHtml(item.topics[0] || '', {
                          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['u']),
                          allowedAttributes: {
                            ...sanitizeHtml.defaults.allowedAttributes,
                            'p': ['style'],
                            'span': ['style']
                          }
                        })
                      }} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
