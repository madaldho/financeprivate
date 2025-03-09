"use server"

import { prisma } from "./db"
import * as XLSX from "xlsx"
import { format } from "date-fns"

export async function exportTransactionsToExcel(startDate?: string, endDate?: string) {
  try {
    // Buat filter berdasarkan rentang tanggal
    let whereClause = {}

    if (startDate && endDate) {
      whereClause = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }
    }

    // Ambil transaksi dari database
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

    // Format data untuk Excel
    const data = transactions.map((tx) => ({
      Tanggal: format(tx.date, "dd/MM/yyyy"),
      Kategori: tx.category.name,
      "Jenis Transaksi": tx.wallet.name,
      Pemasukan: tx.type === "pemasukan" ? tx.amount : 0,
      Pengeluaran: tx.type === "pengeluaran" ? tx.amount : 0,
      Deskripsi: tx.description || "",
      Status: tx.status,
    }))

    // Buat workbook dan worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi")

    // Buat buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    return buffer
  } catch (error) {
    console.error("Error exporting transactions:", error)
    throw new Error("Gagal mengekspor data transaksi")
  }
}

