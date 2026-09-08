import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  )

  if (typeof window !== 'undefined') {
    const originalGetUser = client.auth.getUser.bind(client.auth)
    client.auth.getUser = async (jwt?: string) => {
      // 1. Check document.cookie for student session (primja_user)
      try {
        const match = document.cookie.match(/(?:^|;\s*)primja_user=([^;]+)/)
        if (match) {
          const student = JSON.parse(decodeURIComponent(match[1]))
          if (student && student.student_id) {
            return {
              data: {
                user: {
                  id: `student_${student.student_id}`,
                  app_metadata: { provider: 'student_id', role: student.role || 'Student' },
                  user_metadata: {
                    student_id: student.student_id,
                    student_no: student.student_no,
                    full_name: student.full_name,
                    nickname: student.nickname,
                    role: student.role || 'Student',
                    prefix: student.prefix,
                  },
                  aud: 'authenticated',
                  email: `${student.student_id}@student.local`,
                  role: student.role || 'Student',
                  created_at: new Date().toISOString(),
                } as any,
              },
              error: null,
            }
          }
        }
      } catch {}

      // 2. If NO student session, immediately evict any legacy Supabase email session!
      try {
        const res = await originalGetUser(jwt)
        if (res?.data?.user && !res.data.user.id?.startsWith('student_')) {
          client.auth.signOut().catch(() => {})
        }
      } catch {}

      return { data: { user: null }, error: null }
    }

    client.auth.getSession = async () => {
      const { data } = await client.auth.getUser()
      if (data?.user) {
        return {
          data: {
            session: {
              access_token: 'primja_student_access_token',
              user: data.user,
            } as any,
          },
          error: null,
        }
      }
      return { data: { session: null }, error: null }
    }
  }

  return client
}
