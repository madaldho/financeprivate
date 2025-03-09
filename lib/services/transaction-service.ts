import { prisma, withErrorHandling, getCached, setCache } from "../db-utils"
import type { Transaction } from "@prisma/client"

export class TransactionService {
  // Get transactions with caching
  static async getTransactions(filter = "semua", sortBy = "tanggal", order: "asc" | "desc" = "desc") {
    const cacheKey = `transactions:${filter}:${sortBy}:${order}`
    const cached = getCached<Transaction[]>(cacheKey)
    if (cached) return cached

    return await withErrorHandling(async () => {
      let whereClause = {}

      if (filter === "bulan-ini") {
        const now = new Date()
        whereClause = {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          },
        }
      } else if (filter === "bulan-lalu") {
        const now = new Date()
        whereClause = {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            lte: new Date(now.getFullYear(), now.getMonth(), 0),
          },
        }
      }

      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
          category: true,
          wallet: true,
          sourceWallet: true,
          targetWallet: true,
        },
        orderBy: {
          [sortBy === "tanggal" ? "date" : sortBy === "nominal" ? "amount" : "date"]: order,
        },
      })

      setCache(cacheKey, transactions)
      return transactions
    }, "Failed to fetch transactions")
  }

  // Create transaction with proper error handling and validation
  static async createTransaction(data: any) {
    return await withErrorHandling(async () => {
      const { category, wallet, amount, type, description, status, date } = data

      // Validate category and wallet
      const [categoryExists, walletExists] = await Promise.all([
        prisma.category.findFirst({ where: { id: category.id, isActive: true } }),
        prisma.wallet.findFirst({ where: { id: wallet.id, isActive: true } }),
      ])

      if (!categoryExists || !walletExists) {
        throw new Error("Invalid category or wallet")
      }

      // Create transaction in a transaction block
      return await prisma.$transaction(async (tx) => {
        // Create the transaction
        const transaction = await tx.transaction.create({
          data: {
            date: new Date(date),
            categoryId: category.id,
            walletId: wallet.id,
            amount: Number.parseFloat(amount),
            type,
            description,
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

        return transaction
      })
    }, "Failed to create transaction")
  }

  // Delete transaction safely
  static async deleteTransaction(id: string) {
    return await withErrorHandling(async () => {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: { wallet: true },
      })

      if (!transaction) {
        throw new Error("Transaction not found")
      }

      await prisma.$transaction(async (tx) => {
        // Delete the transaction
        await tx.transaction.delete({
          where: { id },
        })

        // Reverse the balance change
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              increment: transaction.type === "pemasukan" ? -transaction.amount : transaction.amount,
            },
          },
        })
      })

      return true
    }, "Failed to delete transaction")
  }

  // Get summary statistics
  static async getSummary() {
    return await withErrorHandling(async () => {
      const [transactions, wallets] = await Promise.all([
        prisma.transaction.findMany(),
        prisma.wallet.findMany({ where: { isActive: true } }),
      ])

      const totalPemasukan = transactions.filter((t) => t.type === "pemasukan").reduce((sum, t) => sum + t.amount, 0)

      const totalPengeluaran = transactions
        .filter((t) => t.type === "pengeluaran")
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        totalPemasukan,
        totalPengeluaran,
        saldoTotal: totalPemasukan - totalPengeluaran,
        wallets: wallets.map((w) => ({
          id: w.id,
          name: w.name,
          balance: w.balance,
          color: w.color,
          icon: w.icon,
        })),
      }
    }, "Failed to get summary")
  }
}

