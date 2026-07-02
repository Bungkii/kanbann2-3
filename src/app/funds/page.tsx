import FundsClient from './FundsClient'
import { getFundsForWeek, getFundsData, getExpenses } from './actions'
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
  const fundsStats = await getFundsData()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const currentWeekStart = getMonday(new Date())
  const weekStart = searchParams.week || currentWeekStart
  const fundsData = await getFundsForWeek(weekStart)

  const expenses = await getExpenses()

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link 
          href="/"
          className="bg-white/80 backdrop-blur-md text-slate-500 hover:text-slate-800 p-2 sm:px-4 sm:py-2 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 border border-slate-200/50"
        >
          <ChevronLeft size={20} />
          <span className="hidden sm:inline font-medium">กลับหน้าหลัก</span>
        </Link>
      </div>
      <FundsClient 
        isLoggedIn={isLoggedIn} 
        fundsStats={fundsStats}
        currentWeekStart={currentWeekStart}
        fundsData={fundsData}
        expenses={expenses}
      />
    </div>
  )
}
