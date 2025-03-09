"use server"

import { prisma } from "./db"
import { syncToSheets } from "./sheet-sync"
import { revalidatePath } from "next/cache"

export async function getTransactions(filter = "semua", sortBy = "tanggal", order: "asc" | "desc" = "desc") {
  try {
    let whereClause = {}

    if (filter === "bulan-ini") {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      whereClause = {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      }
    } else if (filter === "bulan-lalu") {
      const now = new Date()
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

      whereClause = {
        date: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
        wallet: true,
      },
      orderBy: {
        [sortBy === "tanggal"
          ? "date"
          : sortBy === "nominal"
            ? "amount"
            : sortBy === "kategori"
              ? "categoryId"
              : "walletId"]: order,
      },
    })

    // Format for frontend
    return transactions.map((tx) => ({
      id: tx.id,
      tanggal: tx.date.toISOString().split("T")[0],
      kategori: tx.category.name,
      jenisTransaksi: tx.wallet.name,
      pemasukan: tx.type === "pemasukan" ? tx.amount.toString() : "0",
      pengeluaran: tx.type === "pengeluaran" ? tx.amount.toString() : "0",
      deskripsi: tx.description || "",
      status: tx.status,
      timestamp: tx.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching transactions:", error)
    throw new Error("Gagal mengambil data transaksi")
  }
}

export async function saveTransaction(data: any) {
  try {
    const { tanggal, kategori, jenisTransaksi, pemasukan, pengeluaran, deskripsi, status } = data

    // Get category and wallet
    const category = await prisma.category.findFirst({
      where: { name: kategori },
    })

    const wallet = await prisma.wallet.findFirst({
      where: { name: jenisTransaksi },
    })

    if (!category || !wallet) {
      throw new Error("Category or wallet not found")
    }

    // Create transaction
    const amount = Number(pemasukan) || Number(pengeluaran)
    const type = Number(pemasukan) > 0 ? "pemasukan" : "pengeluaran"

    await prisma.$transaction(async (tx) => {
      // Create transaction
      await tx.transaction.create({
        data: {
          date: new Date(tanggal),
          categoryId: category.id,
          walletId: wallet.id,
          amount,
          type,
          description: deskripsi,
          status,
        },
      })

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: type === "pemasukan" ? amount : -amount,
          },
        },
      })
    })

    // Sync to Google Sheets
    await syncToSheets()

    // Revalidate pages
    revalidatePath("/")
    revalidatePath("/insights")

    return { success: true }
  } catch (error) {
    console.error("Error saving transaction:", error)
    throw new Error("Gagal menyimpan transaksi")
  }
}

// Add other actions (getSummary, updateTransaction, etc.) similarly...

