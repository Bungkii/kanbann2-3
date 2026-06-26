'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { Users, Crown, Medal, TrendingUp, Clock, X, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

type Candidate = {
  name: string;
  count: number;
  percentage: number;
  image_url: string | null;
  policy_text: string | null;
  policy_image_url: string | null;
};

type ElectionResultsProps = {
  candidates: Candidate[];
  totalVotes: number;
  totalPopulation: number;
  turnoutPercentage: number;
};

export default function ElectionResults({
  candidates,
  totalVotes,
  totalPopulation,
  turnoutPercentage
}: ElectionResultsProps) {
  
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to both candidates and leader_votes tables
    const channel = supabase.channel('election-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leader_votes' }, () => {
        router.refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  useEffect(() => {
    // Target date: July 1, 2026 00:00:00 (Thailand time UTC+7)
    const targetDate = new Date('2026-07-01T00:00:00+07:00').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="text-yellow-500 drop-shadow-md" size={32} />;
      case 1: return <Medal className="text-slate-400 drop-shadow-sm" size={28} />;
      case 2: return <Medal className="text-amber-700 drop-shadow-sm" size={28} />;
      default: return <div className="w-8 text-center font-bold text-slate-400">#{index + 1}</div>;
    }
  };

  return (
    <div className="w-full">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/50 backdrop-blur-xl rounded-3xl p-8 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 opacity-80"></div>
        <h1 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight drop-shadow-sm">
          ผลการเลือกตั้งหัวหน้าห้อง
          <span className="block text-amber-500 mt-2 text-2xl drop-shadow-sm">ประจำปี 2569</span>
        </h1>

        {/* Countdown Timer with Glassmorphism */}
        <div className="mt-8 mb-4 inline-block bg-white/40 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/60 w-full max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4 text-slate-600 font-bold text-sm tracking-widest uppercase">
            <Clock size={18} className="text-amber-500" /> นับถอยหลังวันยุบสภา (1 ก.ค. 2569)
          </div>
          <div className="flex justify-center gap-4 text-center">
            <div className="flex flex-col bg-white/50 rounded-xl p-3 min-w-[70px] shadow-sm">
              <span className="text-3xl font-black font-mono text-slate-800">{timeLeft ? timeLeft.days : '--'}</span>
              <span className="text-xs text-slate-500 font-medium">วัน</span>
            </div>
            <div className="text-3xl font-bold text-slate-400 mt-2">:</div>
            <div className="flex flex-col bg-white/50 rounded-xl p-3 min-w-[70px] shadow-sm">
              <span className="text-3xl font-black font-mono text-slate-800">{timeLeft ? timeLeft.hours.toString().padStart(2, '0') : '--'}</span>
              <span className="text-xs text-slate-500 font-medium">ชม.</span>
            </div>
            <div className="text-3xl font-bold text-slate-400 mt-2">:</div>
            <div className="flex flex-col bg-white/50 rounded-xl p-3 min-w-[70px] shadow-sm">
              <span className="text-3xl font-black font-mono text-slate-800">{timeLeft ? timeLeft.minutes.toString().padStart(2, '0') : '--'}</span>
              <span className="text-xs text-slate-500 font-medium">นาที</span>
            </div>
            <div className="text-3xl font-bold text-slate-400 mt-2">:</div>
            <div className="flex flex-col bg-amber-100/50 rounded-xl p-3 min-w-[70px] shadow-sm border border-amber-200/50">
              <span className="text-3xl font-black font-mono text-amber-600 drop-shadow-sm">{timeLeft ? timeLeft.seconds.toString().padStart(2, '0') : '--'}</span>
              <span className="text-xs text-amber-600/80 font-medium">วินาที</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-8">
          <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl p-5 flex items-center gap-4 min-w-[240px] shadow-sm">
            <div className="bg-blue-100/80 text-blue-600 p-3 rounded-full">
              <Users size={24} />
            </div>
            <div className="text-left">
              <p className="text-sm text-slate-500 font-medium">ผู้มาใช้สิทธิ์ (Turnout)</p>
              <p className="text-2xl font-bold text-slate-800">
                {totalVotes} <span className="text-base font-normal text-slate-500">/ {totalPopulation} คน</span>
              </p>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl p-5 flex items-center gap-4 min-w-[240px] shadow-sm">
            <div className="bg-emerald-100/80 text-emerald-600 p-3 rounded-full">
              <TrendingUp size={24} />
            </div>
            <div className="text-left">
              <p className="text-sm text-slate-500 font-medium">คิดเป็นเปอร์เซนะ</p>
              <p className="text-2xl font-bold text-emerald-600">
                {turnoutPercentage}%
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {candidates.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-lg rounded-3xl p-12 text-center shadow-sm border border-white/60">
            <div className="text-slate-400 mb-4 flex justify-center"><Users size={48} /></div>
            <h3 className="text-xl font-bold text-slate-700">ยังไม่มีข้อมูลการโหวต หรือ ผู้สมัคร</h3>
            <p className="text-slate-500 mt-2">พิมพ์ "พริมจ๋า เปลี่ยนหัวหน้า" ในไลน์เพื่อเปิดโหวต</p>
          </div>
        ) : (
          candidates.map((candidate, index) => (
            <motion.div
              key={candidate.name}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedCandidate(candidate)}
              className={`cursor-pointer relative overflow-hidden rounded-2xl p-5 md:p-6 shadow-sm border flex items-center gap-4 md:gap-6 backdrop-blur-lg transition-all ${
                index === 0 
                  ? 'bg-amber-50/70 border-amber-200/80 shadow-[0_8px_30px_rgba(251,191,36,0.15)] ring-1 ring-amber-100/50' 
                  : index === 1
                  ? 'bg-slate-50/70 border-slate-200/80 shadow-[0_8px_30px_rgba(148,163,184,0.15)] ring-1 ring-slate-100/50'
                  : 'bg-white/60 border-white/80 hover:bg-white/80'
              }`}
            >
              {/* Progress Bar Background */}
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${candidate.percentage}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className={`absolute left-0 top-0 h-full opacity-[0.08] mix-blend-multiply ${
                  index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-500' : index === 2 ? 'bg-orange-500' : 'bg-indigo-500'
                }`}
              />

              <div className="shrink-0 flex justify-center items-center w-14 h-14 bg-white/80 rounded-full border border-white shadow-sm z-10 backdrop-blur-sm">
                {getRankIcon(index)}
              </div>

              {/* Candidate Image */}
              <div className="shrink-0 z-10 relative">
                {candidate.image_url ? (
                  <img 
                    src={candidate.image_url} 
                    alt={candidate.name} 
                    className={`w-16 h-16 md:w-20 md:h-20 object-cover rounded-full border-4 shadow-sm ${
                      index === 0 ? 'border-amber-300/80' : index === 1 ? 'border-slate-300/80' : 'border-white/80'
                    }`}
                  />
                ) : (
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-4 shadow-sm backdrop-blur-md ${
                    index === 0 ? 'bg-amber-100/80 border-amber-300/80 text-amber-500' : index === 1 ? 'bg-slate-200/80 border-slate-300/80 text-slate-500' : 'bg-slate-100/80 border-white/80 text-slate-400'
                  }`}>
                    <Users size={32} />
                  </div>
                )}
                
                {index === 0 && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm border border-amber-400">
                    ว่าที่หัวหน้า!
                  </div>
                )}
                
                {index === 1 && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm border border-slate-400">
                    รองหัวหน้า
                  </div>
                )}
              </div>

              <div className="flex-1 z-10 min-w-0 pl-2">
                <h3 className={`text-xl md:text-2xl font-bold truncate ${index === 0 ? 'text-slate-900 drop-shadow-sm' : index === 1 ? 'text-slate-800' : 'text-slate-700'}`}>
                  {candidate.name}
                </h3>
                
                {(candidate.policy_text || candidate.policy_image_url) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                      <FileText size={12} /> มีนโยบาย
                    </span>
                    {candidate.policy_image_url && (
                      <img 
                        src={candidate.policy_image_url} 
                        alt="Policy Thumbnail" 
                        className="h-6 w-auto max-w-[60px] object-cover rounded shadow-sm border border-slate-200"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="shrink-0 text-right z-10">
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 flex items-baseline justify-end gap-1">
                  {candidate.count}
                  <span className="text-sm md:text-base font-medium text-slate-500">โหวต</span>
                </div>
                <div className="text-sm font-semibold text-indigo-600 mt-1 bg-indigo-50/80 backdrop-blur-sm inline-block px-2 py-0.5 rounded-md border border-indigo-100/50">
                  {candidate.percentage}%
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Policy Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedCandidate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-2 transition-colors z-10"
              >
                <X size={24} />
              </button>

              <div className="p-8 border-b border-slate-100 flex items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"></div>
                
                <div className="shrink-0">
                  {selectedCandidate.image_url ? (
                    <img 
                      src={selectedCandidate.image_url} 
                      alt={selectedCandidate.name} 
                      className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-md bg-slate-100 text-slate-400">
                      <Users size={40} />
                    </div>
                  )}
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">{selectedCandidate.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold border border-amber-200">
                      ผู้สมัครหัวหน้าห้อง
                    </span>
                    <span className="text-slate-500 text-sm font-medium">
                      ได้รับ {selectedCandidate.count} โหวต ({selectedCandidate.percentage}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <FileText className="text-amber-500" /> 
                  นโยบายและวิสัยทัศน์
                </h3>
                
                {selectedCandidate.policy_text ? (
                  <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed text-lg">
                    {selectedCandidate.policy_text}
                  </div>
                ) : (
                  <p className="text-slate-400 italic bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                    ผู้สมัครท่านนี้ยังไม่ได้ระบุนโยบาย
                  </p>
                )}

                {selectedCandidate.policy_image_url && (
                  <div className="mt-8 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                    <img 
                      src={selectedCandidate.policy_image_url} 
                      alt={`นโยบายของ ${selectedCandidate.name}`} 
                      className="w-full h-auto object-contain bg-slate-50"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
