import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const authToken = request.cookies.get("auth-token")

  // Check if accessing admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // If not authenticated, redirect to login
    if (!authToken) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // If authenticated and accessing login, redirect to admin
  if (request.nextUrl.pathname === "/login" && authToken) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
}
