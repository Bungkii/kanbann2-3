'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Heart,
  CheckCircle2,
  Search,
  Calendar,
  BookOpen,
  Wallet,
  Smartphone,
  HelpCircle,
  ChevronDown,
  Share2,
  Copy,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Bell,
  Check,
  ShieldCheck,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '@/components/PageTransition';

export default function ParentManualClient() {
  const pathname = usePathname();
  const isUnderParent = pathname.startsWith('/parent');
  const basePath = isUnderParent ? '/parent' : '';

  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('คัดลอกลิงก์คู่มือเรียบร้อยแล้ว!', {
        icon: '📋',
        style: {
          borderRadius: '16px',
          background: '#FFF1F2',
          color: '#9F1239',
          border: '1px solid #FECDD3',
        },
      });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareLine = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent('คู่มือการใช้งานระบบติดตามการบ้านห้อง ม.2/3 สำหรับผู้ปกครอง: ');
      window.open(`https://line.me/R/msg/text/?${text}${url}`, '_blank');
    }
  };

  const faqs = [
    {
      q: 'ผู้ปกครองต้องสมัครสมาชิกหรือตั้งรหัสผ่านหรือไม่?',
      a: 'ไม่ต้องเลยครับ! พอร์ทัลผู้ปกครองออกแบบให้เข้าใช้งานได้อย่างสะดวกและปลอดภัย เพียงเข้าไปที่ระบบแล้วค้นหาชื่อเล่น ชื่อจริง หรือเลขประจำตัว 5 หลักของลูก ก็สามารถเริ่มติดตามการบ้านและกิจกรรมได้ทันที',
    },
    {
      q: 'เมื่อลูกกดทำงานเสร็จแล้ว ทำไมหน้าผู้ปกครองถึงรู้ได้ทันที?',
      a: 'ระบบเชื่อมต่อด้วยฐานข้อมูลแบบเรียลไทม์ เมื่อนักเรียนเข้าสู่ระบบแล้วกดติ๊ก "เสร็จแล้ว" ในฝั่งนักเรียน ข้อมูลจะถูกบันทึกและส่งตรงมายังหน้าจอกระดานการบ้านของผู้ปกครองทันที พร้อมแถบเปอร์เซ็นต์ความคืบหน้าที่อัปเดตแบบสดๆ',
    },
    {
      q: 'ถ้ามีลูกหลานหลายคนในห้อง สามารถเลือกหรือสลับได้ไหม?',
      a: 'สามารถทำได้สะดวกมากครับ เพียงกดปุ่ม "เปลี่ยน" บนแถบด้านบน หรือที่การ์ดข้อมูลนักเรียน แล้วเลือกชื่อลูกอีกคนได้ทันที ระบบจะสลับมาแสดงสถานะการบ้านของลูกคนใหม่ให้อัตโนมัติ',
    },
    {
      q: 'สามารถดูบนโทรศัพท์มือถือและติดตั้งไว้บนหน้าจอหลักได้ไหม?',
      a: 'ได้แน่นอนครับ! เว็บไซต์รองรับเทคโนโลยี PWA (Progressive Web App) สามารถกด "เพิ่มลงในหน้าจอโฮม" (Add to Home Screen) ทั้งบน iPhone/iPad (Safari) และ Android (Chrome) เพื่อเปิดใช้งานเหมือนแอปพลิเคชันจริงได้เลย',
    },
    {
      q: 'หากต้องการติดต่อเรื่องการบ้านหรือแจ้งข้อผิดพลาด ติดต่อทางไหนได้บ้าง?',
      a: 'สามารถพิมพ์ข้อความถามในแชทบอท LINE "พริมจ๋า" หรือส่งต่อข้อความถึงตัวแทนห้อง/แอดมินห้อง ม.2/3 ได้ตลอดเวลาครับ',
    },
  ];

  return (
    <PageTransition className="max-w-5xl mx-auto py-4 sm:py-8 px-2 sm:px-4 space-y-10">
      {/* Hero Header (White & Pink Aesthetic) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50/90 via-pink-50/70 to-white border border-pink-200/80 p-6 sm:p-10 shadow-[0_10px_40px_rgba(244,63,94,0.08)]">
        {/* Soft background ambient glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-pink-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 text-rose-600 text-xs font-bold border border-pink-200 shadow-2xs mb-4">
              <Sparkles size={14} className="text-rose-500 animate-pulse" />
              <span>คู่มือการใช้งานสำหรับผู้ปกครอง ม.2/3</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight leading-tight">
              ยินดีต้อนรับสู่ระบบติดตามงาน <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                สำหรับผู้ปกครองห้อง ม.2/3
              </span>
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              คู่มือแนะนำฟังก์ชันหลัก ช่วยให้คุณพ่อคุณแม่สามารถติดตามการบ้าน งานที่ลูกทำเสร็จแล้วแบบเรียลไทม์
              ตารางเรียนประจำวัน สรุปสอบปลายภาค และยอดเงินห้องได้อย่างสะดวกสบายและอุ่นใจ
            </p>

            {/* Quick Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Link
                href={`${basePath}/assignments`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-[0_4px_16px_rgba(244,63,94,0.3)] transition-all hover:scale-105 active:scale-95"
              >
                <span>ไปที่กระดานการบ้าน</span>
                <ArrowRight size={16} />
              </Link>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-rose-50/60 text-rose-700 font-semibold text-sm border border-pink-200/80 shadow-2xs transition-all cursor-pointer"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                <span>{copied ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์คู่มือ'}</span>
              </button>

              <button
                onClick={handleShareLine}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold text-sm shadow-2xs transition-all cursor-pointer"
              >
                <Share2 size={16} />
                <span>แชร์เข้ากลุ่ม LINE</span>
              </button>
            </div>
          </div>

          {/* Logo / Emblem Container (Easy to replace as requested) */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white p-3 border-2 border-pink-100 shadow-[0_8px_30px_rgba(244,63,94,0.12)] flex items-center justify-center relative group">
              {/* Logo Image slot: replace /icons/icon-192.jpg with custom logo whenever needed */}
              <img
                src="/icons/icon-192.jpg"
                alt="ตราสัญลักษณ์ระบบห้อง ม.2/3"
                className="w-full h-full object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  // Fallback cute SVG if image file is not found
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute -bottom-2.5 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                ม.2/3
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 font-medium">ระบบผู้ปกครอง ม.2/3</span>
          </div>
        </div>
      </div>

      {/* 6 Key Step Cards in White & Pink */}
      <div className="space-y-6">
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center justify-center sm:justify-start gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span>ขั้นตอนการใช้งานหลัก 6 ฟังก์ชัน</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            เริ่มต้นใช้งานง่ายๆ เพียงทำตามขั้นตอนดังต่อไปนี้
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: ค้นหาและเลือกลูกหลาน */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(244,63,94,0.08)] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-pink-200">
                  ขั้นตอนที่ 1
                </span>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Search size={20} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-2">
                1. ค้นหาและบันทึกข้อมูลลูกหลาน
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                เมื่อเข้าสู่ระบบครั้งแรก จะพบแถบค้นหาด้านบน พิมพ์ <strong>ชื่อจริง, ชื่อเล่น หรือเลขประจำตัว 5 หลัก</strong> แล้วแตะเลือกข้อมูลของลูก
              </p>

              <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-pink-100 text-xs text-slate-700 space-y-1.5">
                <p className="flex items-center gap-1.5 font-medium text-rose-900">
                  <CheckCircle2 size={14} className="text-rose-500 shrink-0" />
                  <span>ระบบจะจดจำลูกของคุณไว้ในเครื่องอัตโนมัติ ไม่ต้องค้นหาใหม่ทุกครั้ง</span>
                </p>
                <p className="flex items-center gap-1.5 font-medium text-rose-900">
                  <RefreshCw size={14} className="text-rose-500 shrink-0" />
                  <span>หากต้องการสลับดูลูกคนอื่น สามารถกดปุ่ม <strong>&quot;เปลี่ยน&quot;</strong> ได้ตลอดเวลา</span>
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: ตรวจสอบสถานะการบ้านที่ลูกทำเสร็จแล้ว (Highlight Feature) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-rose-200/80 shadow-[0_8px_30px_rgba(244,63,94,0.08)] hover:shadow-[0_12px_40px_rgba(244,63,94,0.12)] transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-500 to-pink-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl shadow-xs">
              ⚡ ซิงค์สดอัตโนมัติ
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ขั้นตอนที่ 2 · สำคัญมาก
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={22} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-2">
                2. ติดตามงานที่ลูกทำเสร็จแล้วแบบเรียลไทม์
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                เมื่อลูกเข้าสู่ระบบและกดติ๊ก <strong className="text-emerald-700">&quot;เสร็จแล้ว (Done)&quot;</strong> ในฝั่งนักเรียน
                หน้าจอกระดานการบ้านของผู้ปกครองจะขึ้นสถานะ <strong>&quot;✅ น้องทำเสร็จแล้ว&quot;</strong> ให้ทันทีแบบเรียลไทม์!
              </p>

              {/* Visual Demo Card */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    สถานะของลูก:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[11px]">
                    เสร็จเรียบร้อย 100%
                  </span>
                </div>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  คุณพ่อคุณแม่สามารถเปิดหน้า <strong>&quot;การบ้าน&quot;</strong> เพื่อดูรายการวิชาที่ลูกยังไม่ได้ทำ หรือทำเสร็จแล้วได้อย่างชัดเจน
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: ตารางสอนและคาบเรียนประจำวัน */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(244,63,94,0.08)] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-pink-200">
                  ขั้นตอนที่ 3
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Calendar size={20} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-2">
                3. ตรวจสอบตารางสอน & ครูผู้สอน
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                ดูตารางเรียนของห้อง ม.2/3 คาบที่ 1-8 ครอบคลุมรายวิชา ห้องเรียน และชื่อครูผู้สอน
                พร้อมระบบไฮไลท์คาบปัจจุบันและคาบถัดไปแบบอัตโนมัติตามเวลาจริง
              </p>

              <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 text-xs text-amber-900">
                รองรับการดูทั้งแบบการ์ดรายวันบนมือถือ และตารางสัปดาห์แบบเต็มบนคอมพิวเตอร์
              </div>
            </div>
          </div>

          {/* Step 4: สรุปสอบและเนื้อหาออกสอบ */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(244,63,94,0.08)] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-pink-200">
                  ขั้นตอนที่ 4
                </span>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-2">
                4. เตรียมตัวสอบ & ดาวน์โหลดชีทสรุป
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                ดูขอบเขตเนื้อหาออกสอบแต่ละวิชาอย่างละเอียด (จำนวนข้อกากบาท / ข้อเขียน)
                และเปิดดูหรือดาวน์โหลดชีทสรุปบทเรียนในรูปแบบรูปภาพและไฟล์ PDF ได้ฟรี
              </p>

              <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900">
                ช่วยให้ผู้ปกครองสามารถช่วยกำกับดูแลการทบทวนบทเรียนก่อนวันสอบได้อย่างตรงจุด
              </div>
            </div>
          </div>

          {/* Step 5: ตรวจสอบบัญชีเงินห้อง */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(244,63,94,0.08)] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-pink-200">
                  ขั้นตอนที่ 5
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-2">
                5. บัญชีเงินห้อง ม.2/3 โปร่งใส
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                ตรวจสอบยอดเงินคงเหลือของกองกลางห้อง และรายการรายรับ-รายจ่ายที่อัปเดตโดยฝ่ายการเงิน
                พร้อมตารางตรวจสอบการชำระเงินรายสัปดาห์ของนักเรียนทุกคน
              </p>

              <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-900">
                มั่นใจในความโปร่งใส ตรวจสอบยอดเงินและรายการใช้จ่ายได้ตลอด 24 ชั่วโมง
              </div>
            </div>
          </div>

          {/* Step 6: วิธีติดตั้งแอปบนหน้าจอมือถือ (PWA) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(244,63,94,0.08)] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-pink-200">
                  ขั้นตอนที่ 6
                </span>
                <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-2">
                6. ติดตั้งลงบนหน้าจอมือถือ (เปิดเหมือนแอป)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                สามารถบันทึกเว็บไซต์ลงบนหน้าจอโฮมเพื่อเปิดใช้งานได้รวดเร็วเพียง 1 แตะ
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <strong>📱 สำหรับ iPhone (Safari):</strong> แตะปุ่มแชร์ (สี่เหลี่ยมลูกศรชี้ขึ้นด้านล่าง) &gt; เลื่อนลงแตะ <strong>&quot;เพิ่มไปยังหน้าจอโฮม&quot; (Add to Home Screen)</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <strong>🤖 สำหรับ Android (Chrome):</strong> แตะปุ่มจุดสามจุดมุมบนขวา &gt; แตะ <strong>&quot;ติดตั้งแอป&quot; หรือ &quot;เพิ่มลงในหน้าจอหลัก&quot;</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive FAQ Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-[0_6px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <HelpCircle size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">คำถามที่พบบ่อย (FAQ)</h2>
            <p className="text-xs text-slate-500">ข้อสงสัยที่ผู้ปกครองสอบถามเข้ามาบ่อยที่สุด</p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-pink-100 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left px-5 py-4 bg-rose-50/30 hover:bg-rose-50/60 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-sm text-slate-800 leading-snug">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-rose-500 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 py-4 bg-white text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-pink-50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Callout Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white text-center shadow-[0_8px_30px_rgba(244,63,94,0.25)] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-white">
            <Heart size={24} />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            ร่วมเป็นกำลังใจให้ลูกๆ ห้อง ม.2/3 ไปด้วยกันนะค้า
          </h3>

          <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
            พร้อมเริ่มใช้งานหรือยัง? เข้าสู่กระดานการบ้านและเลือกลูกของคุณได้เลย
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`${basePath}/assignments`}
              className="px-6 py-3 rounded-full bg-white text-rose-600 hover:bg-rose-50 font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95"
            >
              ไปยังกระดานการบ้านเลย ↗
            </Link>

            <Link
              href={basePath || '/'}
              className="px-5 py-3 rounded-full bg-white/20 hover:bg-white/30 text-white font-medium text-sm transition-all"
            >
              กลับหน้าหลักผู้ปกครอง
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
