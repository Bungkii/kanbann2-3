'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Banknote, ChevronLeft, ChevronRight, CheckCircle2, Circle, RefreshCw, HandCoins, Settings, X, Plus, Minus, Equal, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { toggleFundStatus, setFundsBalanceAdjustment } from './actions'

type FundRecord = {
  student_number: number;
  is_paid: boolean;
  amount: number;
}

type FundsStats = {
  sumPaid: number;
  adjustment: number;
  totalFunds: number;
}

type FundsClientProps = {
  isLoggedIn: boolean;
  fundsStats: FundsStats;
  currentWeekStart: string;
  fundsData: FundRecord[];
}

export default function FundsClient({ isLoggedIn, fundsStats, currentWeekStart, fundsData }: FundsClientProps) {
  const [weekStart, setWeekStart] = useState<string>(currentWeekStart)
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [adjType, setAdjType] = useState<'add' | 'sub' | 'set'>('set')
  const [adjAmount, setAdjAmount] = useState('')

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
    window.location.href = `/funds?week=${newDate.toISOString().split('T')[0]}`
  }

  const submitAdjustment = async () => {
    if (!adjAmount) return toast.error('กรุณาระบุจำนวนเงิน')
    const num = Number(adjAmount)
    if (isNaN(num)) return toast.error('กรุณาใส่ตัวเลขที่ถูกต้อง')
    
    let finalAdjustment = 0
    if (adjType === 'add') {
      finalAdjustment = fundsStats.adjustment + num
    } else if (adjType === 'sub') {
      finalAdjustment = fundsStats.adjustment - num
    } else if (adjType === 'set') {
      finalAdjustment = num - fundsStats.sumPaid
    }

    const toastId = toast.loading('กำลังอัปเดตยอดเงิน...')
    const res = await setFundsBalanceAdjustment(finalAdjustment)
    if (res.success) {
      toast.success('อัปเดตยอดเงินสำเร็จ!', { id: toastId })
      window.location.reload()
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
      window.location.reload()
    } else {
      toast.error(res.error || 'เกิดข้อผิดพลาด', { id: toastId })
    }
  }

  const handleToggle = async (studentNo: number, currentlyPaid: boolean) => {
    if (!isLoggedIn) {
      toast.error('กรุณาล็อกอินก่อนถึงจะกดติ๊กจ่ายเงินได้')
      return
    }

    setLoading(true)
    const toastId = toast.loading('กำลังอัปเดต...')
    
    try {
      const res = await toggleFundStatus(weekStart, studentNo, !currentlyPaid, 20)
      if (res.error) {
        toast.error(res.error, { id: toastId })
      } else {
        toast.success(`อัปเดตสถานะเลขที่ ${studentNo} สำเร็จ`, { id: toastId })
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const paidCount = fundsData.filter(f => f.is_paid).length
  const unpaidCount = 52 - paidCount

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
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
                <p className="text-2xl font-bold text-slate-800">{fundsStats.totalFunds.toLocaleString()} ฿</p>
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

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {students.map((num) => {
            const fundRecord = fundsData.find(f => f.student_number === num)
            const isPaid = fundRecord?.is_paid || false

            return (
              <motion.button
                key={num}
                whileHover={isLoggedIn ? { scale: 1.05 } : {}}
                whileTap={isLoggedIn ? { scale: 0.95 } : {}}
                onClick={() => handleToggle(num, isPaid)}
                disabled={!isLoggedIn || loading}
                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                  isPaid 
                    ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300' 
                    : 'bg-white border-slate-200 hover:border-rose-200'
                } ${!isLoggedIn && 'cursor-default'}`}
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
          })}
        </div>
      </div>

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
                  <span className="font-semibold text-slate-800">{fundsStats.sumPaid.toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ยอดปรับฐาน (ที่ถูกหัก/เพิ่ม):</span>
                  <span className={`font-semibold ${fundsStats.adjustment < 0 ? 'text-rose-500' : fundsStats.adjustment > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {fundsStats.adjustment > 0 ? '+' : ''}{fundsStats.adjustment.toLocaleString()} ฿
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-base text-slate-800">
                  <span>ยอดเงินสุทธิปัจจุบัน:</span>
                  <span className="text-indigo-600">{fundsStats.totalFunds.toLocaleString()} ฿</span>
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
    </main>
  )
}
