import { createClient } from '@/utils/supabase/server'
import { clearStudentSessionCookies } from '@/utils/studentAuth'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Clear student session cookies
  try {
    await clearStudentSessionCookies()
  } catch (e) {
    console.error('Error clearing student cookies:', e)
  }

  const supabase = await createClient()

  // Check if a Supabase user's logged in
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user && !user.id.startsWith('student_')) {
      await supabase.auth.signOut()
    }
  } catch (e) {
    console.error('Error signing out of Supabase:', e)
  }

  revalidatePath('/', 'layout')
  return NextResponse.redirect(new URL('/', req.url), {
    status: 302,
  })
}
