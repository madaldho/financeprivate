import { prisma } from "@/lib/db"
import { format } from "date-fns"

export class TransactionService {
  static async getTransactions(filter = "semua", sortBy = "tanggal", order: "asc" | "desc" = "desc") {
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
        const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0)

        whereClause = {
          date: {
            gte: startOfLastMonth,
            lte: endOfMonth,
          },
        }
      }

      // Tentukan pengurutan
      let orderBy = {}
      if (sortBy === "tanggal") {
        orderBy = { date: order }
      } else if (sortBy === "nominal") {
        orderBy = { amount: order }
      } else if (sortBy === "kategori") {
        orderBy = { category: { name: order } }
      } else if (sortBy === "jenisTransaksi") {
        orderBy = { wallet: { name: order } }
      }

      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
          category: true,
          wallet: true,
        },
        orderBy,
      })

      // Format untuk frontend
      return transactions.map((tx) => ({
        id: tx.id,
        tanggal: format(tx.date, "yyyy-MM-dd"),
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

  static async createTransaction(data: any) {
    try {
      const { tanggal, kategori, jenisTransaksi, pemasukan, pengeluaran, deskripsi, status } = data

      // Dapatkan kategori dan wallet
      const category = await prisma.category.findFirst({
        where: { name: kategori },
      })

      const wallet = await prisma.wallet.findFirst({
        where: { name: jenisTransaksi },
      })

      if (!category || !wallet) {
        throw new Error("Kategori atau wallet tidak ditemukan")
      }

      // Buat transaksi
      const amount = Number(pemasukan) || Number(pengeluaran)
      const type = Number(pemasukan) > 0 ? "pemasukan" : "pengeluaran"

      return await prisma.$transaction(async (tx) => {
        // Buat transaksi
        const transaction = await tx.transaction.create({
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

        // Update saldo wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: type === "pemasukan" ? amount : -amount,
            },
          },
        })

        return transaction
      })
    } catch (error) {
      console.error("Error saving transaction:", error)
      throw new Error("Gagal menyimpan transaksi")
    }
  }
}

