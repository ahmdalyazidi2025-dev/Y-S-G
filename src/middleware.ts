import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('firebase-auth-token')?.value
  const role = request.cookies.get('user-role')?.value

  // 1. Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!token || (role !== 'admin' && role !== 'staff')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('role', 'admin')
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
  }

  // 2. Protect Customer Routes
  if (pathname.startsWith('/customer')) {
    if (!token && role !== 'guest') {
      // Allow guests or authenticated customers
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('role', 'customer')
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
  }

  // 3. Prevent logged-in users from hitting login page again
  if (pathname === '/login' && token) {
    const url = request.nextUrl.clone()
    url.pathname = (role === 'admin' || role === 'staff') ? '/admin' : '/customer'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/admin/:path*',
    '/customer/:path*',
    '/login',
  ],
}
