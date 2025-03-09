import { type NextRequest, NextResponse } from "next/server"
import { exportTransactionsToExcel } from "@/lib/export"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined

    const buffer = await exportTransactionsToExcel(startDate, endDate)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="transaksi_${startDate || "semua"}_${endDate || "semua"}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error in export API:", error)
    return NextResponse.json({ error: "Gagal mengekspor data" }, { status: 500 })
  }
}

