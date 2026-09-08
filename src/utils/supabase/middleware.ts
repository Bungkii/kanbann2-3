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

  // 1. Student-only routes must NEVER be on parent domain
  if (
    isParentDomain &&
    (pathname.startsWith('/election') ||
      pathname.startsWith('/evaluate-boss') ||
      pathname.startsWith('/homework-feed'))
  ) {
    return NextResponse.redirect(`https://primjaa.bungkii.app${pathname}`)
  }

  // 2. If parent domain is accessed with /parent prefix, redirect to clean root path
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

  // 3. Rewrite clean root paths on parent domain directly to /parent pages
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
      pathname.startsWith('/funds')
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const hasPrimjaSession = Boolean(request.cookies.get('primja_session')?.value)

  // Protect routes
  if (!user && !hasPrimjaSession && (request.nextUrl.pathname.startsWith('/add') || request.nextUrl.pathname.startsWith('/line'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
