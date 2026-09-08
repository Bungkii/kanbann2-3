import { clearStudentSessionCookies } from '@/utils/studentAuth'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  // 1. Clear student session cookies
  try {
    await clearStudentSessionCookies()
  } catch (e) {
    console.error('Error clearing student cookies:', e)
  }

  // 2. Clear all legacy Supabase auth cookies
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    for (const c of allCookies) {
      if (c.name.startsWith('sb-') && c.name.includes('-auth-token')) {
        cookieStore.delete(c.name)
      }
    }
  } catch (e) {
    console.error('Error clearing supabase cookies:', e)
  }

  revalidatePath('/', 'layout')
  const response = NextResponse.redirect(new URL('/', req.url), {
    status: 302,
  })

  // Explicitly delete cookies on outgoing response
  response.cookies.delete('primja_session')
  response.cookies.delete('primja_user')

  return response
}
