"use server"

import { prisma } from "./db"
import * as XLSX from "xlsx"
import { format } from "date-fns"

export async function exportTransactionsToExcel(startDate?: string, endDate?: string) {
  try {
    // Build filter based on date range
    let whereClause = {}

    if (startDate && endDate) {
      whereClause = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }
    }

    // Get transactions from database
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
        wallet: true,
      },
      orderBy: {
        date: "desc",
      },
    })

    // Format data for Excel
    const data = transactions.map((tx) => ({
      Tanggal: format(tx.date, "dd/MM/yyyy"),
      Kategori: tx.category.name,
      "Jenis Transaksi": tx.wallet.name,
      Pemasukan: tx.type === "pemasukan" ? tx.amount : 0,
      Pengeluaran: tx.type === "pengeluaran" ? tx.amount : 0,
      Deskripsi: tx.description || "",
      Status: tx.status,
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi")

    // Create buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    return buffer
  } catch (error) {
    console.error("Error exporting transactions:", error)
    throw new Error("Gagal mengekspor data transaksi")
  }
}

