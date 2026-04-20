// middleware.ts (project root mein, next.config.mjs ke paas)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password', '/support']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes ko allow karo
  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  if (isPublic) return NextResponse.next()

  // Token check karo (cookies se — localStorage middleware mein nahi milta)
  const token = request.cookies.get('authToken')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname) // optional: redirect back after login
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)'],
}