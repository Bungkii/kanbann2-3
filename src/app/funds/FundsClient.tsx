'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Banknote, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  RefreshCw, 
  HandCoins, 
  Settings, 
  X, 
  Plus, 
  Minus, 
  Equal, 
  RotateCcw, 
  Receipt, 
  Trash2, 
  Camera, 
  Image as ImageIcon, 
  ExternalLink, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  User, 
  Check, 
  Sparkles, 
  Calendar 
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  toggleFundStatus, 
  setFundsBalanceAdjustment, 
  addExpense, 
  deleteExpense, 
  getFundsForWeek, 
  setFundsSettings 
} from './actions'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { STUDENTS } from '@/data/students'

type FundRecord = {
  student_number: number;
  is_paid: boolean;
  amount: number;
}

export type ExpenseRecord = {
  id: string;
  amount: number;
  description: string;
  receipt_url: string | null;
  created_at: string;
  created_by: string;
}

type FundsStats = {
  sumPaid: number;
  adjustment: number;
  sumExpenses: number;
  totalFunds: number;
}

type FundsSettings = {
  startDate: string | null;
  endDate: string | null;
  finalExamDate: string | null;
  recordedWeeks?: string[];
}

type FundsClientProps = {
  isLoggedIn: boolean;
  isParentMode?: boolean;
  fundsStats: FundsStats;
  currentWeekStart: string;
  fundsData: FundRecord[];
  expenses: ExpenseRecord[];
  settings: FundsSettings;
}

// Timezone-safe date helper
function parseDateParts(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number)
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2])
  }
  return new Date(dateStr)
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMonday(d: string | Date): string {
  let dt: Date
  if (typeof d === 'string') {
    dt = parseDateParts(d)
  } else {
    dt = new Date(d)
  }
  const day = dt.getDay()
  const diff = dt.getDate() - day + (day === 0 ? -6 : 1)
  dt.setDate(diff)
  return formatDateISO(dt)
}

export default function FundsClient({ 
  isLoggedIn, 
  isParentMode = false, 
  fundsStats: initialFundsStats, 
  currentWeekStart, 
  fundsData: initialFundsData, 
  expenses: initialExpenses, 
  settings: initialSettings 
}: FundsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Local state for instant updates (Optimistic UI)
  const [localFundsData, setLocalFundsData] = useState(initialFundsData)
  const [localFundsStats, setLocalFundsStats] = useState(initialFundsStats)
  const [localExpenses, setLocalExpenses] = useState(initialExpenses)
  const [localSettings, setLocalSettings] = useState(initialSettings)

  // Sync with props if they change from server
  useEffect(() => {
    setLocalFundsData(initialFundsData)
    setLocalFundsStats(initialFundsStats)
    setLocalExpenses(initialExpenses)
    setLocalSettings(initialSettings)
  }, [initialFundsData, initialFundsStats, initialExpenses, initialSettings])

  const [weekStart, setWeekStart] = useState<string>(searchParams.get('week') || currentWeekStart)
  const [loading, setLoading] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [adjType, setAdjType] = useState<'add' | 'sub' | 'set'>('set')
  const [adjAmount, setAdjAmount] = useState('')
  const [settingStartDate, setSettingStartDate] = useState(localSettings.startDate || '')
  const [settingEndDate, setSettingEndDate] = useState(localSettings.endDate || '')
  const [settingExamDate, setSettingExamDate] = useState(localSettings.finalExamDate || '')
  
  // Student Detail / Payment Action Modal State
  const [selectedStudentNum, setSelectedStudentNum] = useState<number | null>(null)
  const [customAmountInput, setCustomAmountInput] = useState('20')
  const [isSavingStudent, setIsSavingStudent] = useState(false)
  
  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [expAmount, setExpAmount] = useState('')
  const [expDesc, setExpDesc] = useState('')
  const [expFile, setExpFile] = useState<File | null>(null)
  const [expPreview, setExpPreview] = useState<string | null>(null)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  // Highlight selected student for parents
  const [highlightedStudent, setHighlightedStudent] = useState<{ student_no: number; student_id?: string; prefix?: string; first_name?: string; last_name?: string; full_name: string; nickname: string } | null>(null)

  useEffect(() => {
    if (isParentMode) {
      try {
        const saved = localStorage.getItem('parent_selected_student')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed?.student_no) {
            setHighlightedStudent(parsed)
          }
        }
      } catch (e) {}
    }
  }, [isParentMode])

  const isCurrentWeek = weekStart === currentWeekStart
  const students = Array.from({ length: 52 }, (_, i) => i + 1)

  // Robust, timezone-safe generation of available weeks
  const weeksList = useMemo(() => {
    const weekSet = new Set<string>()
    const startStr = localSettings.startDate ? getMonday(localSettings.startDate) : '2024-05-13'
    const endStr = localSettings.endDate ? getMonday(localSettings.endDate) : (currentWeekStart ? getMonday(currentWeekStart) : formatDateISO(new Date()))

    const startDate = parseDateParts(startStr)
    const endDate = parseDateParts(endStr)

    let cur = startDate <= endDate ? new Date(startDate) : new Date(endDate)
    const limitEnd = startDate <= endDate ? new Date(endDate) : new Date(startDate)

    let count = 0
    while (cur <= limitEnd && count < 150) {
      weekSet.add(formatDateISO(cur))
      cur.setDate(cur.getDate() + 7)
      count++
    }

    // Always include current week
    if (currentWeekStart) {
      weekSet.add(getMonday(currentWeekStart))
    }

    // Always include any week that was recorded in database history
    if (localSettings.recordedWeeks && Array.isArray(localSettings.recordedWeeks)) {
      localSettings.recordedWeeks.forEach((w: string) => {
        if (w) weekSet.add(getMonday(w))
      })
    }

    return Array.from(weekSet).sort().reverse() // Newest first
  }, [localSettings, currentWeekStart])

  const changeWeek = async (direction: 'prev' | 'next' | string) => {
    let targetDateStr = direction
    if (direction === 'prev' || direction === 'next') {
      const curIdx = weeksList.indexOf(weekStart)
      if (direction === 'next') {
        if (curIdx > 0) {
          targetDateStr = weeksList[curIdx - 1]
        } else {
          return
        }
      } else {
        if (curIdx >= 0 && curIdx < weeksList.length - 1) {
          targetDateStr = weeksList[curIdx + 1]
        } else {
          const curDate = parseDateParts(weekStart)
          curDate.setDate(curDate.getDate() - 7)
          targetDateStr = formatDateISO(curDate)
        }
      }
    }
    
    setLoading(true)
    setWeekStart(targetDateStr)
    window.history.pushState(null, '', `${window.location.pathname}?week=${targetDateStr}`)
    
    try {
      const data = await getFundsForWeek(targetDateStr)
      setLocalFundsData(data)
    } catch (e) {
      toast.error('ไม่สามารถดึงข้อมูลสัปดาห์นี้ได้')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStudentPayment = async (studentNo: number, isPaid: boolean, amount: number = 20) => {
    if (!isLoggedIn) {
      toast.error('กรุณาล็อกอินก่อนถึงจะบันทึกสถานะได้')
      return
    }

    const oldRecord = localFundsData.find(f => f.student_number === studentNo)
    const oldAmount = oldRecord?.is_paid ? (oldRecord.amount || 20) : 0
    const targetAmount = isPaid ? amount : 0
    const difference = targetAmount - oldAmount

    // Optimistic UI Update
    setLocalFundsData(prev => {
      const exists = prev.find(p => p.student_number === studentNo)
      if (exists) {
        return prev.map(p => p.student_number === studentNo ? { ...p, is_paid: isPaid, amount: isPaid ? amount : exists.amount } : p)
      } else {
        return [...prev, { student_number: studentNo, is_paid: isPaid, amount: amount }]
      }
    })

    setLocalFundsStats(prev => ({
      ...prev,
      sumPaid: prev.sumPaid + difference,
      totalFunds: prev.totalFunds + difference
    }))

    setIsSavingStudent(true)
    try {
      const res = await toggleFundStatus(weekStart, studentNo, isPaid, isPaid ? amount : (oldRecord?.amount || 20))
      if (res.error) {
        toast.error(res.error)
        router.refresh()
      } else {
        const studentInfo = STUDENTS.find(s => s.student_no === studentNo)
        const nameLabel = studentInfo ? `${studentInfo.nickname} (เลขที่ ${studentNo})` : `เลขที่ ${studentNo}`
        toast.success(isPaid ? `บันทึกจ่ายแล้ว: ${nameLabel} (${amount}฿)` : `ยกเลิกจ่าย: ${nameLabel}`)
        setSelectedStudentNum(null)
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก')
      router.refresh()
    } finally {
      setIsSavingStudent(false)
    }
  }

  const submitAdjustment = async () => {
    if (!adjAmount) return toast.error('กรุณาระบุจำนวนเงิน')
    const num = Number(adjAmount)
    if (isNaN(num)) return toast.error('กรุณาใส่ตัวเลขที่ถูกต้อง')
    
    let finalAdjustment = 0
    if (adjType === 'add') {
      finalAdjustment = localFundsStats.adjustment + num
    } else if (adjType === 'sub') {
      finalAdjustment = localFundsStats.adjustment - num
    } else if (adjType === 'set') {
      finalAdjustment = num - localFundsStats.sumPaid
    }

    const toastId = toast.loading('กำลังอัปเดตยอดเงิน...')
    const res = await setFundsBalanceAdjustment(finalAdjustment)
    if (res.success) {
      toast.success('อัปเดตยอดเงินสำเร็จ!', { id: toastId })
      setLocalFundsStats(prev => ({
        ...prev,
        adjustment: finalAdjustment,
        totalFunds: prev.sumPaid + finalAdjustment - prev.sumExpenses
      }))
      setIsSettingsModalOpen(false)
      setAdjAmount('')
      router.refresh()
    } else {
      toast.error(res.error || 'เกิดข้อผิดพลาด', { id: toastId })
    }
  }

  const resetAdjustment = async () => {
    if (!confirm('ยืนยันล้างยอดปรับฐานทั้งหมด (ยอดจะเหลือเท่ากับที่เก็บได้จริง)?')) return
    const toastId = toast.loading('กำลังล้างยอด...')
    const res = await setFundsBalanceAdjustment(0)
    if (res.success) {
      toast.success('ล้างยอดสำเร็จ!', { id: toastId })
      setLocalFundsStats(prev => ({
        ...prev,
        adjustment: 0,
        totalFunds: prev.sumPaid - prev.sumExpenses
      }))
      setIsSettingsModalOpen(false)
      router.refresh()
    } else {
      toast.error(res.error || 'เกิดข้อผิดพลาด', { id: toastId })
    }
  }

  const submitSettings = async () => {
    setLoading(true)
    const result = await setFundsSettings(settingStartDate, settingEndDate, settingExamDate)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('บันทึกการตั้งค่าระบบเรียบร้อย')
      setIsSettingsModalOpen(false)
      window.location.reload()
    }
  }

  const submitExpense = async () => {
    if (!expAmount || !expDesc) return toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    const num = Number(expAmount)
    if (isNaN(num) || num <= 0) return toast.error('กรุณาใส่จำนวนเงินที่ถูกต้อง')

    const toastId = toast.loading('กำลังบันทึกรายจ่าย...')
    let receiptUrl = null

    try {
      if (expFile) {
        toast.loading('กำลังอัปโหลดใบเสร็จ (ImgBB)...', { id: toastId })
        const formData = new FormData()
        formData.append('image', expFile)
        
        const imgbbResponse = await fetch('https://api.imgbb.com/1/upload?key=1596fbd05841877b8aaed415ed93e575', {
          method: 'POST',
          body: formData
        })
        const result = await imgbbResponse.json()
        
        if (!result.success) {
          throw new Error(result.error?.message || 'ImgBB upload failed')
        }
        
        receiptUrl = result.data.url
      }

      toast.loading('กำลังบันทึกข้อมูล...', { id: toastId })
      const res = await addExpense(num, expDesc, receiptUrl)
      
      if (res.error) throw new Error(res.error)
      
      toast.success('บันทึกรายจ่ายสำเร็จ!', { id: toastId })
      
      setLocalFundsStats(prev => ({
        ...prev,
        sumExpenses: prev.sumExpenses + num,
        totalFunds: prev.totalFunds - num
      }))
      setIsExpenseModalOpen(false)
      setExpAmount('')
      setExpDesc('')
      setExpFile(null)
      setExpPreview(null)
      
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด', { id: toastId })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setExpFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setExpPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('ยืนยันลบรายการใช้จ่ายนี้?')) return
    const toastId = toast.loading('กำลังลบ...')
    const res = await deleteExpense(id)
    if (res.success) {
      toast.success('ลบสำเร็จ!', { id: toastId })
      const expToDelete = localExpenses.find(e => e.id === id)
      if (expToDelete) {
        setLocalFundsStats(prev => ({
          ...prev,
          sumExpenses: prev.sumExpenses - expToDelete.amount,
          totalFunds: prev.totalFunds + expToDelete.amount
        }))
        setLocalExpenses(prev => prev.filter(e => e.id !== id))
      }
      router.refresh()
    } else {
      toast.error(res.error || 'เกิดข้อผิดพลาด', { id: toastId })
    }
  }

  const unpaidStudents = students.filter(num => !(localFundsData.find(f => f.student_number === num)?.is_paid))
  const paidStudents = students.filter(num => localFundsData.find(f => f.student_number === num)?.is_paid)

  const paidCount = paidStudents.length
  const unpaidCount = unpaidStudents.length
  const weekSumPaid = paidStudents.reduce((acc, num) => {
    const r = localFundsData.find(f => f.student_number === num)
    return acc + (r?.amount || 20)
  }, 0)

  // Current selected student info for the action modal
  const activeStudentInfo = selectedStudentNum ? STUDENTS.find(s => s.student_no === selectedStudentNum) : null
  const activeStudentFundRecord = selectedStudentNum ? localFundsData.find(f => f.student_number === selectedStudentNum) : null
  const activeStudentIsPaid = !!activeStudentFundRecord?.is_paid
  const activeStudentAmount = activeStudentFundRecord?.amount || 20

  const openStudentModal = (num: number) => {
    const record = localFundsData.find(f => f.student_number === num)
    setSelectedStudentNum(num)
    setCustomAmountInput((record?.amount || 20).toString())
  }

  // Simplified student button showing ONLY the student number
  const renderStudentNumberCard = (num: number, isPaid: boolean) => {
    const fundRecord = localFundsData.find(f => f.student_number === num)
    const amount = fundRecord?.amount || 20
    const isMyChild = isParentMode && highlightedStudent?.student_no === num
    const studentInfo = STUDENTS.find(s => s.student_no === num)

    return (
      <motion.div
        key={num}
        layout
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative ${isMyChild ? 'z-20' : ''}`}
      >
        <button
          onClick={() => openStudentModal(num)}
          title={studentInfo ? `${studentInfo.prefix || ''}${studentInfo.first_name} ${studentInfo.last_name} (${studentInfo.nickname}) · เลขที่ ${num}` : `เลขที่ ${num}`}
          className={`w-full aspect-square relative flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-xs ${
            isMyChild 
              ? 'ring-4 ring-indigo-500 ring-offset-2 scale-105 shadow-md bg-indigo-50/70 border-indigo-300' 
              : isPaid
                ? 'bg-emerald-50 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100/60' 
                : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/40'
          }`}
        >
          {isMyChild && (
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.2 bg-indigo-600 text-white text-[9px] font-bold rounded-full shadow-md whitespace-nowrap z-10 animate-bounce">
              ⭐ บุตรหลาน
            </span>
          )}

          {/* Large Student Number */}
          <span className={`text-xl sm:text-2xl font-black tracking-tight ${
            isPaid ? 'text-emerald-800' : 'text-slate-700'
          }`}>
            {num}
          </span>

          {/* Status Badge below number */}
          <div className="mt-1 flex items-center gap-0.5">
            {isPaid ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/70 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                <Check size={10} strokeWidth={3} /> {amount}฿
              </span>
            ) : (
              <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-full">
                ค้าง
              </span>
            )}
          </div>
        </button>
      </motion.div>
    )
  }

  return (
    <motion.main 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto p-4 sm:p-8 pt-20"
    >
      {/* Hero Header & Financial Summary */}
      <div className="bg-gradient-to-br from-white to-slate-50/80 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/80 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-56 h-56 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-56 h-56 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                ห้อง 3 สัมธุน ม.2/3
              </span>
              {isParentMode && (
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                  โหมดผู้ปกครอง
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-2.5">
              <HandCoins className="text-amber-500 shrink-0" size={30} />
              {isParentMode ? 'บัญชีเงินห้อง ม.2/3' : 'ระบบจัดการเงินกองทุนห้อง'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              เก็บสัปดาห์ละ 20 บาท สำหรับอุปกรณ์ กิจกรรม และของใช้ส่วนรวมในห้องเรียน
            </p>
          </div>

          {/* Total Balance Card */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
            <div className="bg-white/90 backdrop-blur-sm px-5 py-3.5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-3.5 flex-1 sm:flex-initial">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Banknote size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">ยอดเงินคงเหลือสุทธิ</p>
                <p className="text-xl sm:text-2xl font-black text-slate-800">
                  {localFundsStats.totalFunds.toLocaleString()} <span className="text-sm font-bold text-slate-500">฿</span>
                </p>
              </div>
            </div>

            {isLoggedIn && (
              <button 
                onClick={() => setIsSettingsModalOpen(true)} 
                className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm shrink-0"
                title="ตั้งค่ายอดยกมา / รอบวันที่"
              >
                <Settings size={16} />
                ตั้งค่าระบบ
              </button>
            )}
          </div>
        </div>

        {/* 4 Financial Breakdown Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/60">
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">📥 เก็บได้รอบนี้</span>
            <p className="text-base sm:text-lg font-bold text-emerald-700 mt-0.5">
              {weekSumPaid.toLocaleString()} ฿
            </p>
            <span className="text-[11px] text-slate-400">({paidCount} จาก 52 คน)</span>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">🏛️ ยอดยกมา / ปรับฐาน</span>
            <p className={`text-base sm:text-lg font-bold mt-0.5 ${localFundsStats.adjustment >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
              {localFundsStats.adjustment > 0 ? '+' : ''}{localFundsStats.adjustment.toLocaleString()} ฿
            </p>
            <span className="text-[11px] text-slate-400">เงินตั้งต้นยกมา</span>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">💰 เก็บสะสมทั้งหมด</span>
            <p className="text-base sm:text-lg font-bold text-indigo-700 mt-0.5">
              {localFundsStats.sumPaid.toLocaleString()} ฿
            </p>
            <span className="text-[11px] text-slate-400">รวมทุกสัปดาห์</span>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">💸 รายจ่ายรวม</span>
            <p className="text-base sm:text-lg font-bold text-rose-600 mt-0.5">
              -{localFundsStats.sumExpenses.toLocaleString()} ฿
            </p>
            <span className="text-[11px] text-slate-400">{localExpenses.length} รายการ</span>
          </div>
        </div>
      </div>

      {/* Export & Week Navigator Action Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          {/* Week Navigation */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button 
              onClick={() => changeWeek('prev')}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="สัปดาห์ก่อนหน้า"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="text-center px-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600 shrink-0" />
                <select
                  value={weekStart}
                  onChange={(e) => changeWeek(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {weeksList.map(w => (
                    <option key={w} value={w}>
                      สัปดาห์ {new Date(w).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={() => changeWeek('next')}
              className={`p-2.5 rounded-xl border border-slate-200 transition-colors ${isCurrentWeek ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50 text-slate-600'}`}
              disabled={isCurrentWeek}
              title="สัปดาห์ถัดไป"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Export Action Buttons (CSV & PDF) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a 
              href={`/api/export-funds-csv?week=${weekStart}`}
              download
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              title="ดาวน์โหลดไฟล์ตาราง Excel / CSV (ยอดยกมา + 52 คน + รายจ่าย)"
            >
              <FileSpreadsheet size={16} />
              Export CSV
            </a>

            <a 
              href={`/api/export-funds?week=${weekStart}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              title="เปิดและพิมพ์รายงาน PDF พร้อมตารางยอดยกมาและรายชื่อ"
            >
              <FileText size={16} />
              Export PDF
            </a>
          </div>
        </div>

        {/* Weekly Collection Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
            <span>สถานะการเก็บเงินสัปดาห์นี้: <strong>{paidCount} / 52 คน</strong></span>
            <span className="font-bold text-emerald-600">{Math.round((paidCount / 52) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(paidCount / 52) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-emerald-500 h-full rounded-full"
            />
          </div>
        </div>

        {/* Parent Mode Info / Login Reminder */}
        {isParentMode ? (
          <div className="mt-4 p-3.5 bg-emerald-50/80 text-emerald-800 rounded-xl flex items-center gap-2.5 border border-emerald-200/60 text-xs sm:text-sm">
            <Sparkles size={18} className="text-emerald-600 shrink-0" />
            <p><strong>ผู้ปกครอง:</strong> กดที่การ์ดเลขที่ของนักเรียนเพื่อดูชื่อและสถานะการจ่ายเงินค่าห้องได้อย่างโปร่งใส</p>
          </div>
        ) : !isLoggedIn && (
          <div className="mt-4 p-3.5 bg-amber-50 text-amber-800 rounded-xl flex items-center gap-2.5 border border-amber-200 text-xs sm:text-sm">
            <Circle size={16} className="text-amber-500 shrink-0" />
            <p><strong>ผู้ดูแลระบบ/นักเรียน:</strong> กรุณาล็อกอินก่อนเพื่อเปิดสิทธิ์การบันทึกสถานะจ่ายเงิน</p>
          </div>
        )}

        {/* Personalized Student Payment Status (For Parents) */}
        {isParentMode && highlightedStudent && (
          <div className="mt-4 p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 p-1">
                <img
                  src={highlightedStudent.prefix === 'ด.ญ.' ? '/asset/student-girl.webp' : '/asset/student-boy.webp'}
                  alt="Student"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                  {highlightedStudent.prefix || ''}{highlightedStudent.first_name || highlightedStudent.full_name} {highlightedStudent.last_name || ''} ({highlightedStudent.nickname})
                </h4>
                <p className="text-xs text-slate-500">เลขที่ {highlightedStudent.student_no} · รหัส {highlightedStudent.student_id}</p>
              </div>
            </div>

            <div className="shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                localFundsData.find(f => f.student_number === highlightedStudent.student_no)?.is_paid
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {localFundsData.find(f => f.student_number === highlightedStudent.student_no)?.is_paid
                  ? '✅ ชำระสัปดาห์นี้แล้ว'
                  : '⏳ ยังไม่ชำระค่าห้อง (20 บาท)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Simplified Number-Only Student Grids */}
      <div className="space-y-6 mb-8">
        {/* Unpaid Students Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Circle className="text-rose-500" size={18} /> 
              ยังไม่จ่ายเงิน ({unpaidCount} คน)
            </h3>
            <span className="text-xs text-slate-400 font-medium">กดที่เลขที่เพื่อดูชื่อ / บันทึกจ่าย</span>
          </div>

          {unpaidStudents.length === 0 ? (
            <div className="text-center py-8 bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-bold text-emerald-800">สุดยอดมาก! จ่ายครบทุกคนแล้ว 🎉</p>
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-2.5">
              {unpaidStudents.map(num => renderStudentNumberCard(num, false))}
            </div>
          )}
        </div>

        {/* Paid Students Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={18} /> 
              จ่ายเงินแล้ว ({paidCount} คน)
            </h3>
            <span className="text-xs text-slate-400 font-medium">รวมยอด: {weekSumPaid.toLocaleString()} ฿</span>
          </div>

          {paidStudents.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Circle size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">ยังไม่มีนักเรียนจ่ายเงินในสัปดาห์นี้</p>
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-2.5">
              {paidStudents.map(num => renderStudentNumberCard(num, true))}
            </div>
          )}
        </div>
      </div>

      {/* Expense Tracking Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="text-rose-500" size={24} />
              ประวัติการใช้จ่ายของห้อง
            </h2>
            <p className="text-sm text-slate-500 mt-1">ยอดรวมทั้งหมด: {localFundsStats.sumExpenses.toLocaleString()} ฿</p>
          </div>
          {isLoggedIn && (
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-2xl shadow-sm transition-all flex items-center gap-1.5 text-sm"
            >
              <Plus size={16} />
              บันทึกรายจ่าย
            </button>
          )}
        </div>

        {localExpenses.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Receipt size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500">ยังไม่มีประวัติการใช้จ่าย</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localExpenses.map(exp => (
              <div key={exp.id} className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col hover:border-slate-300 transition-colors shadow-2xs">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-800 line-clamp-2 pr-2">{exp.description}</span>
                  <span className="font-bold text-rose-600 whitespace-nowrap bg-rose-50 px-2.5 py-1 rounded-xl text-sm">
                    -{Number(exp.amount).toLocaleString()} ฿
                  </span>
                </div>
                
                <div className="text-xs text-slate-400 mb-3">
                  {new Date(exp.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                </div>

                <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
                  {exp.receipt_url ? (
                    <button 
                      onClick={() => setLightboxImg(exp.receipt_url)}
                      className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1 bg-indigo-50 px-2.5 py-1.5 rounded-lg"
                    >
                      <ImageIcon size={14} /> ดูใบเสร็จ
                    </button>
                  ) : (
                    <span className="text-slate-400 text-xs flex items-center gap-1"><X size={12} /> ไม่มีรูป</span>
                  )}

                  {isLoggedIn && (
                    <button 
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-slate-300 hover:text-rose-500 p-1.5 transition-colors rounded-lg"
                      title="ลบรายจ่ายนี้"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Detail & Quick Action Modal */}
      <AnimatePresence>
        {selectedStudentNum !== null && activeStudentInfo && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                    {selectedStudentNum}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                      {activeStudentInfo.prefix || ''}{activeStudentInfo.first_name} {activeStudentInfo.last_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      ชื่อเล่น <strong className="text-indigo-600">{activeStudentInfo.nickname}</strong> · รหัสประจำตัว {activeStudentInfo.student_id}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudentNum(null)} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Current Status Badge */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  activeStudentIsPaid 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {activeStudentIsPaid ? (
                      <CheckCircle2 size={22} className="text-emerald-600" />
                    ) : (
                      <Circle size={22} className="text-rose-500" />
                    )}
                    <div>
                      <p className="text-xs font-semibold opacity-75">สถานะรอบสัปดาห์นี้</p>
                      <p className="text-base font-bold">
                        {activeStudentIsPaid ? `จ่ายแล้ว (${activeStudentAmount} บาท)` : 'ยังไม่จ่ายเงิน'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/80 shadow-2xs">
                    เลขที่ {selectedStudentNum}
                  </span>
                </div>

                {isLoggedIn ? (
                  <div className="space-y-4">
                    {/* Quick Toggle Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleUpdateStudentPayment(selectedStudentNum, true, 20)}
                        disabled={isSavingStudent}
                        className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 text-sm"
                      >
                        <Check size={18} />
                        จ่าย 20 บาท
                      </button>

                      <button
                        onClick={() => handleUpdateStudentPayment(selectedStudentNum, false, 0)}
                        disabled={isSavingStudent}
                        className="py-3 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 text-sm"
                      >
                        <RotateCcw size={16} />
                        เปลี่ยนเป็นยังไม่จ่าย
                      </button>
                    </div>

                    {/* Custom Amount Section */}
                    <div className="pt-3 border-t border-slate-100">
                      <label className="block text-xs font-bold text-slate-600 mb-2">
                        ระบุจำนวนเงินที่จ่ายแบบกำหนดเอง (บาท):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={customAmountInput}
                          onChange={(e) => setCustomAmountInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => {
                            const amt = Number(customAmountInput)
                            if (isNaN(amt) || amt < 0) return toast.error('กรุณาระบุตัวเลขที่ถูกต้อง')
                            handleUpdateStudentPayment(selectedStudentNum, amt > 0, amt)
                          }}
                          disabled={isSavingStudent}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shrink-0 shadow-sm"
                        >
                          บันทึกยอด
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex gap-2 mt-2">
                        {[20, 40, 60, 100].map(val => (
                          <button
                            key={val}
                            onClick={() => setCustomAmountInput(val.toString())}
                            className="flex-1 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                          >
                            +{val}฿
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                    เข้าสู่ระบบเพื่อแก้ไขและบันทึกการชำระเงินของนักเรียน
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expense Add Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="text-rose-500" size={24} />
                บันทึกการใช้จ่ายเงินห้อง
              </h2>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">จำนวนเงิน (บาท) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="เช่น 500"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">รายละเอียด <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="เช่น ซื้อไม้กวาด, ถุงดำ, ค่ากีฬาสี..."
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">แนบรูปใบเสร็จ / หลักฐาน (ถ้ามี)</label>
                <label className={`block w-full border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors relative ${expPreview ? 'border-rose-300 bg-rose-50' : 'border-slate-300 hover:border-rose-400 hover:bg-slate-50'}`}>
                  {expPreview ? (
                    <div className="relative group">
                      <img src={expPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg text-white font-medium text-sm">
                        เปลี่ยนรูป
                      </div>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Camera size={32} className="mx-auto text-slate-400 mb-2" />
                      <span className="text-slate-500 text-sm font-medium">คลิกเพื่อเลือกรูปภาพ</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>

              <div className="pt-2">
                <button
                  onClick={submitExpense}
                  className="w-full py-3 px-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-colors shadow-sm"
                >
                  บันทึกข้อมูลรายจ่าย
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="text-indigo-600" size={24} />
                ตั้งค่ายอดยกมาและระบบเงินห้อง
              </h2>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Financial Balance Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-sm border border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>เงินที่เก็บได้จริง (จากตารางติ๊กสะสม):</span>
                  <span className="font-semibold text-slate-800">{localFundsStats.sumPaid.toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ยอดยกมา / เงินปรับฐานเริ่มต้น:</span>
                  <span className={`font-semibold ${localFundsStats.adjustment < 0 ? 'text-rose-500' : localFundsStats.adjustment > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {localFundsStats.adjustment > 0 ? '+' : ''}{localFundsStats.adjustment.toLocaleString()} ฿
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>หักรายจ่ายทั้งหมด:</span>
                  <span className="font-semibold">-{localFundsStats.sumExpenses.toLocaleString()} ฿</span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-base text-slate-800">
                  <span>ยอดเงินคงเหลือสุทธิ:</span>
                  <span className="text-indigo-600 font-extrabold">{localFundsStats.totalFunds.toLocaleString()} ฿</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">ต้องการปรับยอดยกมาอย่างไร?</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button 
                    onClick={() => setAdjType('add')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-colors ${adjType === 'add' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <Plus size={20} />
                    <span className="text-xs">ได้เงินเพิ่ม</span>
                  </button>
                  <button 
                    onClick={() => setAdjType('sub')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-colors ${adjType === 'sub' ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <Minus size={20} />
                    <span className="text-xs">จ่ายออก</span>
                  </button>
                  <button 
                    onClick={() => setAdjType('set')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-colors ${adjType === 'set' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <Equal size={20} />
                    <span className="text-xs">ตั้งยอดใหม่</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    placeholder={adjType === 'set' ? "ใส่ยอดเงินสุทธิที่ต้องการ..." : "ใส่จำนวนเงิน..."}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">บาท</div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 pb-4 border-b border-slate-100">
                <button
                  onClick={resetAdjustment}
                  className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-2xl font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  ล้างยอด
                </button>
                <button
                  onClick={submitAdjustment}
                  className="flex-[2] py-3 px-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  บันทึกยอดเงิน
                </button>
              </div>

              {/* Start/End Date Settings */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ตั้งค่ารอบเปิดภาคเรียนและเก็บเงินห้อง</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">วันเริ่มเก็บ (วันจันทร์แรก):</span>
                    <input 
                      type="date"
                      value={settingStartDate}
                      onChange={(e) => setSettingStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">วันสิ้นสุดรอบ:</span>
                    <input 
                      type="date"
                      value={settingEndDate}
                      onChange={(e) => setSettingEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>
                
                <label className="block text-sm font-semibold text-slate-700 mb-1 mt-3">วันสอบปลายภาค (นับถอยหลัง)</label>
                <div className="mb-4">
                  <input 
                    type="date"
                    value={settingExamDate}
                    onChange={(e) => setSettingExamDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <button
                  onClick={submitSettings}
                  className="w-full py-3 px-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-colors shadow-sm flex justify-center items-center gap-2"
                >
                  บันทึกการตั้งค่าวันที่
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lightbox for Receipts */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 p-2.5 rounded-full backdrop-blur-sm text-lg font-bold"
            onClick={() => setLightboxImg(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={lightboxImg} 
            alt="Receipt" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </motion.main>
  )
}
