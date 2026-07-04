"use client";

import { useState } from "react";
import { Star, User, MessageSquare, Send, ThumbsUp, AlertCircle, Phone, HeartHandshake, X, ShieldAlert, HeartPulse } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitBossEvaluation } from "./actions";

const traitsList = [
  "พูดมีสาระ",
  "ทำตามคำสั่งได้ดี",
  "ปลอบเพื่อน",
  "ปรึกษาได้",
  "หน้าตา",
  "ความรับผิดชอบ",
  "ดูแลเพื่อน",
  "สุภาพ เรียบร้อย",
  "สั่งงานมั่ว",
  "มารยาท",
  "แบ่งปัน มีน้ำใจ",
  "ปกป้องเพื่อน",
  "เตือนเพื่อนตอนทำอะไรผิด",
];

const topicsList = [
  { id: "management", title: "การบริหารจัดการงาน", icon: <User className="w-8 h-8 text-blue-500" /> },
  { id: "communication", title: "การสื่อสารและรับฟัง", icon: <MessageSquare className="w-8 h-8 text-green-500" /> },
  { id: "problem_solving", title: "การแก้ปัญหาและตัดสินใจ", icon: <AlertCircle className="w-8 h-8 text-orange-500" /> },
];

export default function EvaluateBossForm() {
  const router = useRouter();

  const [appearanceScore, setAppearanceScore] = useState(0);
  const [responsibilityScore, setResponsibilityScore] = useState(0);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  
  const [topicScores, setTopicScores] = useState<Record<string, number>>({});
  
  const [suggestion, setSuggestion] = useState("");
  const [overallScore, setOverallScore] = useState(0);
  
  const [improvements, setImprovements] = useState<string[]>(Array(6).fill(""));
  const [shouldChangeBoss, setShouldChangeBoss] = useState<boolean | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const toggleTrait = (trait: string) => {
    setSelectedTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    );
  };

  const updateImprovement = (index: number, value: string) => {
    const newImprovements = [...improvements];
    newImprovements[index] = value;
    setImprovements(newImprovements);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const data = {
      appearanceScore,
      responsibilityScore,
      selectedTraits,
      topicScores,
      suggestion,
      overallScore,
      improvements,
      shouldChangeBoss
    };

    const result = await submitBossEvaluation(data);

    setIsSubmitting(false);

    if (result.success) {
      setShowModal(true);
    } else {
      toast.error("เกิดข้อผิดพลาดในการส่งข้อมูล: " + result.error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    router.push('/');
  };

  const StarRating = ({ 
    value, 
    onChange, 
    size = "w-6 h-6",
    activeColor = "text-yellow-400",
    hoverScale = 1.2
  }: { 
    value: number; 
    onChange: (val: number) => void;
    size?: string;
    activeColor?: string;
    hoverScale?: number;
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            whileHover={{ scale: hoverScale }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(star)}
            className={`focus:outline-none transition-colors ${
              star <= value ? activeColor : "text-slate-300"
            }`}
          >
            <Star className={`${size} ${star <= value ? "fill-current" : ""}`} />
          </motion.button>
        ))}
      </div>
    );
  };

  return (
    <motion.main 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-800 font-sans border-b-4 border-pink-500 pb-2 inline-block">
            ระบบประเมินหัวหน้า
          </h1>
          <Link href="/" className="text-pink-600 hover:underline">
            กลับหน้าหลัก
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-32 h-32 bg-pink-50 rounded-full flex items-center justify-center border-4 border-pink-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/asset/austin.jpg" alt="Boss Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                    <ThumbsUp className="w-6 h-6 text-pink-500" />
                  </div>
                </div>

                <div className="w-full space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-col items-center">
                    <span className="text-slate-700 font-semibold mb-2">หน้าตา</span>
                    <StarRating value={appearanceScore} onChange={setAppearanceScore} size="w-8 h-8" activeColor="text-yellow-400" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-slate-700 font-semibold mb-2">ความรับผิดชอบ</span>
                    <StarRating value={responsibilityScore} onChange={setResponsibilityScore} size="w-8 h-8" activeColor="text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">จุดเด่น / ลักษณะนิสัย</h3>
              <div className="flex flex-wrap gap-2">
                {traitsList.map((trait) => {
                  const isSelected = selectedTraits.includes(trait);
                  const isNegative = trait === "สั่งงานมั่ว";
                  
                  return (
                    <motion.button
                      key={trait}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleTrait(trait)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                        ${isSelected 
                          ? (isNegative 
                              ? "bg-red-500 text-white border-red-600 shadow-md" 
                              : "bg-pink-500 text-white border-pink-600 shadow-md")
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                        }
                      `}
                    >
                      {trait}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6">ประเมินตามหัวข้อ</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topicsList.map((topic) => (
                <div key={topic.id} className="border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center relative overflow-hidden group hover:border-pink-300 transition-colors">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    {topic.icon}
                  </div>
                  
                  <h4 className="font-semibold text-slate-700 mb-4">{topic.title}</h4>
                  
                  <div className="mt-auto flex flex-col items-center w-full">
                    <span className="text-xs text-slate-500 mb-2">คะแนนเฉลี่ย</span>
                    <StarRating 
                      value={topicScores[topic.id] || 0} 
                      onChange={(val) => setTopicScores({ ...topicScores, [topic.id]: val })} 
                      activeColor="text-yellow-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
            <div>
              <label htmlFor="suggestion" className="block text-lg font-semibold text-slate-800 mb-3">
                ข้อเสนอแนะเพิ่มเติม
              </label>
              <textarea
                id="suggestion"
                rows={4}
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="พิมพ์ข้อเสนอแนะของคุณที่นี่..."
                className="w-full rounded-xl border-slate-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 p-4 text-slate-700 bg-slate-50 resize-none"
              />
            </div>

            <hr className="border-slate-100" />

            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xl font-bold text-slate-800 mb-4">คะแนนโดยรวม</span>
              <StarRating 
                value={overallScore} 
                onChange={setOverallScore} 
                size="w-12 h-12" 
                hoverScale={1.1}
                activeColor="text-yellow-400"
              />
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">เรื่องที่ควรปรับปรุง</h3>
                <div className="grid grid-cols-2 gap-3">
                  {improvements.map((imp, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={imp}
                      onChange={(e) => updateImprovement(idx, e.target.value)}
                      placeholder={`เรื่องที่ ${idx + 1}`}
                      className="rounded-lg border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 py-2 text-sm bg-white"
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl p-6 border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6">ควรเปลี่ยนหัวหน้าไหม?</h3>
                <div className="flex gap-6 w-full max-w-xs">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShouldChangeBoss(true)}
                    className={`flex-1 py-4 rounded-xl font-bold text-xl border-2 transition-all ${
                      shouldChangeBoss === true
                        ? "bg-[#39FF14] text-black border-[#39FF14] shadow-lg shadow-[#39FF14]/50"
                        : "bg-white text-[#39FF14] border-[#39FF14]/40 hover:border-[#39FF14] hover:bg-[#39FF14]/10"
                    }`}
                  >
                    Yes
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShouldChangeBoss(false)}
                    className={`flex-1 py-4 rounded-xl font-bold text-xl border-2 transition-all ${
                      shouldChangeBoss === false
                        ? "bg-[#FF0000] text-white border-[#FF0000] shadow-lg shadow-[#FF0000]/50"
                        : "bg-white text-[#FF0000] border-[#FF0000]/40 hover:border-[#FF0000] hover:bg-[#FF0000]/10"
                    }`}
                  >
                    No
                  </motion.button>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-colors ${
                isSubmitting ? "bg-slate-400" : "bg-pink-600 hover:bg-pink-700"
              }`}
            >
              {isSubmitting ? (
                "กำลังส่ง..."
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  ส่งผลประเมิน
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto pt-20 pb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative border-4 border-pink-100 my-auto"
            >
              <button 
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-2">
                  <HeartHandshake className="w-10 h-10 text-pink-500" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">ส่งผลประเมินสำเร็จ!</h2>
                  <p className="text-slate-600 font-medium text-sm md:text-base">
                    (แต่ถ้าหัวหน้าทำงานไม่ดีแล้วรู้สึกปวดหัวจนทนไม่ไหว...)
                  </p>
                </div>

                <div className="w-full bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-200 space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 sticky top-0 bg-slate-50 py-1">
                    สามารถโทรปรึกษาหรือขอความช่วยเหลือได้ที่
                  </p>
                  
                  <a href="tel:1323" className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-green-300 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full group-hover:bg-green-200 transition-colors">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-bold text-slate-700 text-sm md:text-base">สายด่วน 1323</span>
                    </div>
                    <span className="text-xs md:text-sm text-slate-500">กรมสุขภาพจิต</span>
                  </a>

                  <a href="tel:021136789" className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-200 transition-colors">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-bold text-slate-700 text-sm md:text-base">02-113-6789</span>
                    </div>
                    <span className="text-xs md:text-sm text-slate-500 truncate max-w-[120px]">สมาคมสะมาริตันส์</span>
                  </a>

                  <a href="tel:1300" className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-pink-300 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="bg-pink-100 p-2 rounded-full group-hover:bg-pink-200 transition-colors">
                        <HeartPulse className="w-5 h-5 text-pink-600" />
                      </div>
                      <span className="font-bold text-slate-700 text-sm md:text-base">สายด่วน 1300</span>
                    </div>
                    <span className="text-xs md:text-sm text-slate-500">ศูนย์ช่วยเหลือสังคม พม.</span>
                  </a>

                  <a href="tel:1669" className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-red-300 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-full group-hover:bg-red-200 transition-colors">
                        <HeartPulse className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="font-bold text-slate-700 text-sm md:text-base">สายด่วน 1669</span>
                    </div>
                    <span className="text-xs md:text-sm text-slate-500">เจ็บป่วยฉุกเฉิน</span>
                  </a>

                  <a href="tel:191" className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-orange-300 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 p-2 rounded-full group-hover:bg-orange-200 transition-colors">
                        <ShieldAlert className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="font-bold text-slate-700 text-sm md:text-base">สายด่วน 191</span>
                    </div>
                    <span className="text-xs md:text-sm text-slate-500">เหตุด่วนเหตุร้าย</span>
                  </a>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCloseModal}
                  className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors"
                >
                  รับทราบ กลับหน้าหลัก!
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.main>
  );
}
