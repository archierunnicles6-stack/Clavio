import { NextResponse } from 'next/server'

export async function middleware() {
  // Route-level checks are handled in client pages for now.
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/generate/:path*']
}
