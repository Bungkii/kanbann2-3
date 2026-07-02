'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Banknote, ChevronLeft, ChevronRight, CheckCircle2, Circle, RefreshCw, HandCoins, Settings, X, Plus, Minus, Equal, RotateCcw, Receipt, Trash2, Camera, Image as ImageIcon, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { toggleFundStatus, setFundsBalanceAdjustment, addExpense, deleteExpense } from './actions'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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

type FundsClientProps = {
  isLoggedIn: boolean;
  fundsStats: FundsStats;
  currentWeekStart: string;
  fundsData: FundRecord[];
  expenses: ExpenseRecord[];
}

export default function FundsClient({ isLoggedIn, fundsStats: initialFundsStats, currentWeekStart, fundsData: initialFundsData, expenses: initialExpenses }: FundsClientProps) {
  const router = useRouter()
  
  // Local state for instant updates (Optimistic UI)
  const [localFundsData, setLocalFundsData] = useState(initialFundsData)
  const [localFundsStats, setLocalFundsStats] = useState(initialFundsStats)
  const [localExpenses, setLocalExpenses] = useState(initialExpenses)

  // Sync with props if they change from server
  useEffect(() => {
    setLocalFundsData(initialFundsData)
    setLocalFundsStats(initialFundsStats)
    setLocalExpenses(initialExpenses)
  }, [initialFundsData, initialFundsStats, initialExpenses])

  const [weekStart, setWeekStart] = useState<string>(currentWeekStart)
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [adjType, setAdjType] = useState<'add' | 'sub' | 'set'>('set')
  const [adjAmount, setAdjAmount] = useState('')
  
  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [expAmount, setExpAmount] = useState('')
  const [expDesc, setExpDesc] = useState('')
  const [expFile, setExpFile] = useState<File | null>(null)
  const [expPreview, setExpPreview] = useState<string | null>(null)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)
  const supabase = createClient()

  const weekDate = new Date(weekStart)
  const isCurrentWeek = weekStart === currentWeekStart

  const students = Array.from({ length: 52 }, (_, i) => i + 1)

  function getMonday(d: Date) {
    d = new Date(d)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }

  const changeWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(weekDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    router.push(`/funds?week=${newDate.toISOString().split('T')[0]}`)
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
      setIsModalOpen(false)
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
      setIsModalOpen(false)
      router.refresh()
    } else {
      toast.error(res.error || 'เกิดข้อผิดพลาด', { id: toastId })
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
        toast.loading('กำลังอัปโหลดใบเสร็จ...', { id: toastId })
        const fileExt = expFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('expense-receipts')
          .upload(fileName, expFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('expense-receipts')
          .getPublicUrl(fileName)
        
        receiptUrl = publicUrl
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
    if (!confirm('ยืนยันลบรายการใชจ่ายนี้?')) return
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

  const handleToggle = async (studentNo: number, currentlyPaid: boolean) => {
    if (!isLoggedIn) {
      toast.error('กรุณาล็อกอินก่อนถึงจะกดติ๊กจ่ายเงินได้')
      return
    }

    const amountChanged = 20
    const newIsPaid = !currentlyPaid

    // Optimistic UI Update
    setLocalFundsData(prev => {
      const exists = prev.find(p => p.student_number === studentNo)
      if (exists) {
        return prev.map(p => p.student_number === studentNo ? { ...p, is_paid: newIsPaid } : p)
      } else {
        return [...prev, { student_number: studentNo, is_paid: newIsPaid, amount: amountChanged }]
      }
    })

    setLocalFundsStats(prev => ({
      ...prev,
      sumPaid: prev.sumPaid + (newIsPaid ? amountChanged : -amountChanged),
      totalFunds: prev.totalFunds + (newIsPaid ? amountChanged : -amountChanged)
    }))

    // Server request in background
    try {
      const res = await toggleFundStatus(weekStart, studentNo, newIsPaid, amountChanged)
      if (res.error) {
        toast.error(res.error)
        router.refresh() // revert on error
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด')
      router.refresh()
    }
  }

  const unpaidStudents = students.filter(num => !(localFundsData.find(f => f.student_number === num)?.is_paid))
  const paidStudents = students.filter(num => localFundsData.find(f => f.student_number === num)?.is_paid)

  const paidCount = paidStudents.length
  const unpaidCount = unpaidStudents.length

  const renderStudentBtn = (num: number, isPaid: boolean) => (
    <motion.button
      key={num}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={isLoggedIn ? { scale: 1.05 } : {}}
      whileTap={isLoggedIn ? { scale: 0.95 } : {}}
      onClick={() => handleToggle(num, isPaid)}
      disabled={!isLoggedIn}
      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
        isPaid 
          ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300' 
          : 'bg-white border-slate-200 hover:border-rose-200'
      } ${!isLoggedIn && 'cursor-default opacity-80'}`}
    >
      <span className={`text-lg font-bold mb-1 ${isPaid ? 'text-emerald-700' : 'text-slate-600'}`}>
        {num}
      </span>
      {isPaid ? (
        <CheckCircle2 size={20} className="text-emerald-500" />
      ) : (
        <Circle size={20} className="text-slate-300" />
      )}
    </motion.button>
  )

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-8 pt-20">
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-50 opacity-50 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <HandCoins className="text-amber-500" size={32} />
            ระบบทวงเงินห้อง
          </h1>
          <p className="text-slate-500 mt-2">สัปดาห์ละ 20 บาท สำหรับกิจกรรมและของใช้ส่วนรวม</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <Banknote size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">ยอดเงินคงเหลือห้อง</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-slate-800">{localFundsStats.totalFunds.toLocaleString()} ฿</p>
                {isLoggedIn && (
                  <button onClick={() => setIsModalOpen(true)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-full hover:bg-slate-100" title="ตั้งค่า/ปรับยอดเงิน">
                    <Settings size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => changeWeek('prev')}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">
              สัปดาห์ที่เริ่ม {weekDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {paidCount} คนจ่ายแล้ว • {unpaidCount} คนยังไม่จ่าย
            </p>
          </div>

          <button 
            onClick={() => changeWeek('next')}
            className={`p-2 rounded-xl border border-slate-200 transition-colors ${isCurrentWeek ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 text-slate-600'}`}
            disabled={isCurrentWeek}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 mb-8 overflow-hidden flex">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(paidCount / 52) * 100}%` }}
            className="bg-emerald-500 h-full"
          />
        </div>

        {!isLoggedIn && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-xl flex items-start gap-3 border border-blue-100">
            <div>
              <p className="font-semibold">กรุณาล็อกอินเพื่อจัดการเงินห้อง</p>
              <p className="text-sm opacity-90">ล็อกอินแล้วจะสามารถกดติ๊กจ่ายเงินให้เพื่อนได้ทันทีเลยครับ</p>
            </div>
          </div>
        )}

        {/* Students Grids */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Circle className="text-rose-400" size={20} /> 
            ยังไม่จ่าย ({unpaidStudents.length} คน)
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {unpaidStudents.map(num => renderStudentBtn(num, false))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" size={20} /> 
            จ่ายแล้ว ({paidStudents.length} คน)
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {paidStudents.map(num => renderStudentBtn(num, true))}
          </div>
        </div>
      </div>

      {/* Expense Tracking Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="text-rose-500" size={24} />
              ประวัติการใช้จ่าย
            </h2>
            <p className="text-sm text-slate-500 mt-1">ยอดรวมทั้งหมด: {localFundsStats.sumExpenses.toLocaleString()} ฿</p>
          </div>
          {isLoggedIn && (
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-4 py-2 rounded-full shadow-sm transition-all flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              บันทึกรายจ่าย
            </button>
          )}
        </div>

        {localExpenses.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Receipt size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500">ยังไม่มีประวัติการใช้จ่าย</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localExpenses.map(exp => (
              <div key={exp.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col hover:border-slate-300 transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-800 line-clamp-2 pr-2">{exp.description}</span>
                  <span className="font-bold text-rose-600 whitespace-nowrap bg-rose-50 px-2 py-1 rounded-lg text-sm">
                    -{Number(exp.amount).toLocaleString()} ฿
                  </span>
                </div>
                
                <div className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                  {new Date(exp.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                </div>

                <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
                  {exp.receipt_url ? (
                    <button 
                      onClick={() => setLightboxImg(exp.receipt_url)}
                      className="text-indigo-600 hover:text-indigo-700 text-xs font-medium flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md"
                    >
                      <ImageIcon size={14} /> ดูใบเสร็จ
                    </button>
                  ) : (
                    <span className="text-slate-400 text-xs flex items-center gap-1"><X size={12} /> ไม่มีรูป</span>
                  )}

                  {isLoggedIn && (
                    <button 
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
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

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="text-rose-500" size={24} />
                บันทึกการใช้จ่าย
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
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">รายละเอียด <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="เช่น ซื้อไม้กวาด, ถุงดำ, ค่ากีฬาสี..."
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">แนบรูปใบเสร็จ / หลักฐาน (ถ้ามี)</label>
                <label className={`block w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors relative ${expPreview ? 'border-rose-300 bg-rose-50' : 'border-slate-300 hover:border-rose-400 hover:bg-slate-50'}`}>
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
                  className="w-full py-3 px-4 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-sm"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Settings Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="text-indigo-500" size={24} />
                ตั้งค่ายอดเงินห้อง
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-sm border border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>เงินที่เก็บได้จริง (จากตารางติ๊ก):</span>
                  <span className="font-semibold text-slate-800">{localFundsStats.sumPaid.toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ยอดปรับฐาน (ที่ถูกหัก/เพิ่ม):</span>
                  <span className={`font-semibold ${localFundsStats.adjustment < 0 ? 'text-rose-500' : localFundsStats.adjustment > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {localFundsStats.adjustment > 0 ? '+' : ''}{localFundsStats.adjustment.toLocaleString()} ฿
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>หักรายจ่ายทั้งหมด:</span>
                  <span className="font-semibold">-{localFundsStats.sumExpenses.toLocaleString()} ฿</span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-base text-slate-800">
                  <span>ยอดเงินสุทธิปัจจุบัน:</span>
                  <span className="text-indigo-600">{localFundsStats.totalFunds.toLocaleString()} ฿</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">ต้องการทำอะไร?</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button 
                    onClick={() => setAdjType('add')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-colors ${adjType === 'add' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <Plus size={20} />
                    <span className="text-xs font-medium">ได้เงินเพิ่ม</span>
                  </button>
                  <button 
                    onClick={() => setAdjType('sub')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-colors ${adjType === 'sub' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <Minus size={20} />
                    <span className="text-xs font-medium">จ่ายออก</span>
                  </button>
                  <button 
                    onClick={() => setAdjType('set')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-colors ${adjType === 'set' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <Equal size={20} />
                    <span className="text-xs font-medium">ตั้งยอดใหม่</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    placeholder={adjType === 'set' ? "ใส่ยอดเงินสุทธิที่ต้องการ..." : "ใส่จำนวนเงิน..."}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">บาท</div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={resetAdjustment}
                  className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  ล้างยอด
                </button>
                <button
                  onClick={submitAdjustment}
                  className="flex-[2] py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  บันทึกยอดเงิน
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

    </main>
  )
}
