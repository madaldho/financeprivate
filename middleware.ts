import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Cek apakah url path adalah api/init - jika ya, lewati
  if (request.nextUrl.pathname === "/api/init") {
    return NextResponse.next()
  }

  // Hanya jalankan seeding jika mengakses halaman utama dan belum pernah dikunjungi
  const hasVisited = request.cookies.get("has_visited")

  if (!hasVisited && request.nextUrl.pathname === "/") {
    // Sebenarnya kita tidak lagi menginisialisasi di middleware,
    // tapi memberikan cookie untuk menghindari pengecekan berulang
    const response = NextResponse.next()
    response.cookies.set("has_visited", "true", {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/api/init"],
}

