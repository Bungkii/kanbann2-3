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
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // Wrap client.auth.getUser and client.auth.getSession to recognize student sessions
  const originalGetUser = client.auth.getUser.bind(client.auth)
  client.auth.getUser = async (jwt?: string) => {
    try {
      const res = await originalGetUser(jwt)
      if (res?.data?.user) {
        return res
      }
    } catch {
      // Supabase auth error or network error, fallback to student session
    }

    const session = getStudentSessionFromCookies(cookieStore)
    if (session) {
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

    return { data: { user: null }, error: null }
  }

  const originalGetSession = client.auth.getSession.bind(client.auth)
  client.auth.getSession = async () => {
    try {
      const res = await originalGetSession()
      if (res?.data?.session) {
        return res
      }
    } catch {}

    const session = getStudentSessionFromCookies(cookieStore)
    if (session) {
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
