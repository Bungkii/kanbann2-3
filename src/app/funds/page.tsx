import FundsClient from './FundsClient'
import { getFundsForWeek, getTotalFunds } from './actions'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getMonday(d: Date) {
  d = new Date(d)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export default async function FundsPage(props: { searchParams: Promise<{ week?: string }> }) {
  const searchParams = await props.searchParams
  const totalFunds = await getTotalFunds()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const currentWeekStart = getMonday(new Date())
  const weekStart = searchParams.week || currentWeekStart
  const fundsData = await getFundsForWeek(weekStart)

  return (
    <>
      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-slate-200 transition-all hover:shadow-md">
          <ChevronLeft size={20} />
          <span className="font-medium">กลับหน้าหลัก</span>
        </Link>
      </div>
      <FundsClient 
        isLoggedIn={isLoggedIn} 
        totalFunds={totalFunds} 
        currentWeekStart={currentWeekStart}
        fundsData={fundsData}
      />
    </>
  )
}
