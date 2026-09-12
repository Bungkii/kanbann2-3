import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  // Subdomain routing: kanbann.bungkii.app -> Parent Portal (Rooted at src/app/parent)
  const isParentDomain =
    process.env.APP_MODE === 'parent' ||
    process.env.NEXT_PUBLIC_APP_MODE === 'parent' ||
    host.startsWith('kanbann.bungkii.app') ||
    (host.startsWith('kanbann.') && !host.includes('vercel.app'))

  // 1. Student-only routes must NEVER be on parent domain (redirect to primjaa.bungkii.app)
  if (
    isParentDomain &&
    (pathname.startsWith('/kanban') ||
      pathname.startsWith('/add') ||
      pathname.startsWith('/schedule') ||
      pathname.startsWith('/summaries') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/election') ||
      pathname.startsWith('/evaluate-boss') ||
      pathname.startsWith('/homework-feed') ||
      pathname.startsWith('/line') ||
      pathname.startsWith('/exam-topics'))
  ) {
    return NextResponse.redirect(`https://primjaa.bungkii.app${pathname}`)
  }

  // 2. Parent-only routes when accessed on student domain (primjaa.bungkii.app) -> redirect to kanbann.bungkii.app
  if (
    !isParentDomain &&
    (host.startsWith('primjaa.bungkii.app') || host.startsWith('primjaa.'))
  ) {
    if (pathname === '/parent') {
      return NextResponse.redirect('https://kanbann.bungkii.app')
    }
    if (pathname.startsWith('/parent/')) {
      const cleanPath = pathname.replace(/^\/parent/, '')
      return NextResponse.redirect(`https://kanbann.bungkii.app${cleanPath}`)
    }
  }

  // 3. If parent domain is accessed with /parent prefix, redirect to clean root path
  if (isParentDomain) {
    if (pathname === '/parent') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith('/parent/')) {
      const url = request.nextUrl.clone()
      url.pathname = pathname.replace(/^\/parent/, '')
      return NextResponse.redirect(url)
    }
  }

  // 4. Rewrite clean root paths on parent domain directly to /parent pages
  let rewriteUrl: URL | null = null
  if (
    isParentDomain &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.includes('.')
  ) {
    if (pathname === '/') {
      rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = '/parent'
    } else if (
      pathname.startsWith('/assignments') ||
      pathname.startsWith('/exams') ||
      pathname.startsWith('/funds') ||
      pathname.startsWith('/manual')
    ) {
      rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = `/parent${pathname}`
    }
  }

  let supabaseResponse = rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, { request })
    : NextResponse.next({ request })

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = rewriteUrl
            ? NextResponse.rewrite(rewriteUrl, { request })
            : NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const hasPrimjaSession = Boolean(request.cookies.get('primja_session')?.value)

  // Evict any legacy email users: delete Supabase auth cookies if there is no valid student session
  if (!hasPrimjaSession) {
    request.cookies.getAll().forEach((c) => {
      if (c.name.startsWith('sb-') && c.name.includes('-auth-token')) {
        supabaseResponse.cookies.delete(c.name)
      }
    })
  }

  // Protect student/admin routes
  const isProtected =
    pathname.startsWith('/add') ||
    pathname.startsWith('/line') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/summaries/upload') ||
    pathname.startsWith('/summaries/edit') ||
    pathname.startsWith('/exam-topics/manage') ||
    pathname.startsWith('/election/edit') ||
    pathname.startsWith('/election/candidates')

  if (!hasPrimjaSession && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
