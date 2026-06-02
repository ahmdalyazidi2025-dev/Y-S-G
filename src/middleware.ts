import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const isAdminPath = pathname.startsWith('/admin')
  const isCustomerPath = pathname.startsWith('/customer')
  
  let token = undefined
  let role = undefined
  
  if (isAdminPath) {
    token = request.cookies.get('firebase-auth-token-admin')?.value || request.cookies.get('firebase-auth-token')?.value
    role = request.cookies.get('user-role-admin')?.value || request.cookies.get('user-role')?.value
  } else if (isCustomerPath) {
    token = request.cookies.get('firebase-auth-token-customer')?.value || request.cookies.get('firebase-auth-token')?.value
    role = request.cookies.get('user-role-customer')?.value || request.cookies.get('user-role')?.value
  } else {
    token = request.cookies.get('firebase-auth-token')?.value || request.cookies.get('firebase-auth-token-customer')?.value || request.cookies.get('firebase-auth-token-admin')?.value
    role = request.cookies.get('user-role')?.value || request.cookies.get('user-role-customer')?.value || request.cookies.get('user-role-admin')?.value
  }

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
