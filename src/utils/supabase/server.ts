import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getStudentSessionFromCookies } from '@/utils/studentAuth'

export async function createClient() {
  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Can be ignored if called from a Server Component
          }
        },
      },
    }
  )

  // STAGE: Evict all legacy email users. Only authenticated student sessions are allowed!
  client.auth.getUser = async () => {
    const session = getStudentSessionFromCookies(cookieStore)

    if (session && session.student_id) {
      return {
        data: {
          user: {
            id: `student_${session.student_id}`,
            app_metadata: { provider: 'student_id', role: session.role || 'Student' },
            user_metadata: {
              student_id: session.student_id,
              student_no: session.student_no,
              full_name: session.full_name,
              nickname: session.nickname,
              role: session.role || 'Student',
              prefix: session.prefix,
            },
            aud: 'authenticated',
            confirmation_sent_at: '',
            recovery_sent_at: '',
            email_change_sent_at: '',
            new_email: '',
            invited_at: '',
            action_link: '',
            email: `${session.student_id}@student.local`,
            phone: '',
            created_at: new Date(session.logged_in_at).toISOString(),
            confirmed_at: new Date(session.logged_in_at).toISOString(),
            email_confirmed_at: new Date(session.logged_in_at).toISOString(),
            phone_confirmed_at: '',
            last_sign_in_at: new Date(session.logged_in_at).toISOString(),
            role: session.role || 'Student',
            updated_at: new Date(session.logged_in_at).toISOString(),
            identities: [],
            is_anonymous: false,
            factors: [],
          } as any,
        },
        error: null,
      }
    }

    // No student session found -> forcibly delete any legacy Supabase email auth tokens!
    try {
      const allCookies = cookieStore.getAll()
      for (const c of allCookies) {
        if (c.name.startsWith('sb-') && c.name.includes('-auth-token')) {
          cookieStore.delete(c.name)
        }
      }
    } catch {}

    return { data: { user: null }, error: null }
  }

  client.auth.getSession = async () => {
    const session = getStudentSessionFromCookies(cookieStore)
    if (session && session.student_id) {
      const { data } = await client.auth.getUser()
      if (data?.user) {
        return {
          data: {
            session: {
              access_token: 'primja_student_access_token',
              refresh_token: 'primja_student_refresh_token',
              expires_in: 3600 * 24 * 30,
              expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
              token_type: 'bearer',
              user: data.user,
            } as any,
          },
          error: null,
        }
      }
    }

    return { data: { session: null }, error: null }
  }

  return client
}
