import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const cookieName = process.env.SESSION_COOKIE_NAME ?? "session"
  if (!request.cookies.has(cookieName)) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] }
