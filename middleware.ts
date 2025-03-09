import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { initializeDefaultData } from "@/lib/actions"

export async function middleware(request: NextRequest) {
  // Hanya jalankan seeding jika mengakses halaman utama dan belum pernah dikunjungi
  const hasVisited = request.cookies.get("has_visited")

  if (!hasVisited && request.nextUrl.pathname === "/") {
    try {
      await initializeDefaultData()
      const response = NextResponse.next()
      response.cookies.set("has_visited", "true", {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      })
      return response
    } catch (error) {
      console.error("Error initializing database:", error)
      // Lanjutkan ke halaman utama meskipun ada error
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/"],
}

