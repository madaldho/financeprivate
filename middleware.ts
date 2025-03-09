import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Redirect to /api/seed on first visit to initialize database
  const hasVisited = request.cookies.get("has_visited")

  if (!hasVisited && request.nextUrl.pathname === "/") {
    const response = NextResponse.redirect(new URL("/api/seed", request.url))
    response.cookies.set("has_visited", "true", {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/"],
}

