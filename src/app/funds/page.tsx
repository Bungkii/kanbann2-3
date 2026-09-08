import FundsClient from './FundsClient'
import { getFundsForWeek, getFundsData, getExpenses, getFundsSettings } from './actions'
import { createClient } from '@/utils/supabase/server'
import StudentNavbar from '@/components/StudentNavbar'

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
  const settings = await getFundsSettings()

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased relative">
      {/* Subtle Ambient Background Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] bg-purple-500/4 rounded-full blur-3xl" />
      </div>

      <StudentNavbar isAuthenticated={isLoggedIn} />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 pb-28 md:pb-12">
        <FundsClient 
          isLoggedIn={isLoggedIn} 
          fundsStats={fundsStats}
          currentWeekStart={currentWeekStart}
          fundsData={fundsData}
          expenses={expenses}
          settings={settings}
        />
      </main>
    </div>
  )
}
