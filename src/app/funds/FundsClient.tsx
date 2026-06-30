'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Banknote, ChevronLeft, ChevronRight, CheckCircle2, Circle, AlertCircle, RefreshCw, HandCoins, Settings } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { toggleFundStatus, assignSelfRole } from './actions'

type FundRecord = {
  student_number: number;
  is_paid: boolean;
  amount: number;
}

type FundsClientProps = {
  role: string | null;
  totalFunds: number;
  currentWeekStart: string;
  fundsData: FundRecord[];
}

export default function FundsClient({ role, totalFunds, currentWeekStart, fundsData }: FundsClientProps) {
  const [weekStart, setWeekStart] = useState<string>(currentWeekStart)
  const [loading, setLoading] = useState(false)
  const [claimingRole, setClaimingRole] = useState(false)

  // Parse current date info
  const weekDate = new Date(weekStart)
  const isCurrentWeek = weekStart === currentWeekStart

  // Create array of 1-52 students
  const students = Array.from({ length: 52 }, (_, i) => i + 1)

  const canEdit = role === 'admin' || role === 'tuang'

  const changeWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(weekDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    // We would need to push router to fetch new data or handle it in client state, 
    // but for simplicity let's reload the page with a query param
    window.location.href = `/funds?week=${newDate.toISOString().split('T')[0]}`
  }

  const handleToggle = async (studentNo: number, currentlyPaid: boolean) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์จัดการเงินห้อง (ต้องเป็น Admin หรือ ทวง)')
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

  const handleClaimAdmin = async () => {
    if (!confirm('ยืนยันรับ Role Admin? (เฉพาะแอดมินเท่านั้น)')) return
    setClaimingRole(true)
    const res = await assignSelfRole('admin')
    if (res.success) {
      toast.success('ได้รับ Role Admin แล้ว! รีเฟรชหน้าเว็บ')
      window.location.reload()
    } else {
      toast.error(res.error || 'Failed')
    }
    setClaimingRole(false)
  }

  // Calculate summary
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
              <p className="text-2xl font-bold text-slate-800">{totalFunds.toLocaleString()} ฿</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!role && (
              <button onClick={handleClaimAdmin} disabled={claimingRole} className="text-xs text-indigo-600 hover:underline">
                Claim Admin Role
              </button>
            )}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${role === 'admin' ? 'bg-indigo-100 text-indigo-700' : role === 'tuang' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
              Role: {role || 'User (Read Only)'}
            </span>
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

        {!canEdit && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-xl flex items-start gap-3 border border-blue-100">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">โหมดผู้เข้าชม (Read-Only)</p>
              <p className="text-sm opacity-90">คุณสามารถดูสถานะการจ่ายเงินได้เท่านั้น หากต้องการสิทธิ์ "ทวง" ให้ติดต่อ Admin (บุ้งกี๋)</p>
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
                whileHover={canEdit ? { scale: 1.05 } : {}}
                whileTap={canEdit ? { scale: 0.95 } : {}}
                onClick={() => handleToggle(num, isPaid)}
                disabled={!canEdit || loading}
                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                  isPaid 
                    ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300' 
                    : 'bg-white border-slate-200 hover:border-rose-200'
                } ${!canEdit && 'cursor-default'}`}
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
    </main>
  )
}
