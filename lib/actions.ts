"use server"

import { prisma } from "./db"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS } from "./default-data"

// Fungsi untuk mendapatkan transaksi dengan filter
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

// Fungsi untuk menyimpan transaksi baru
export async function saveTransaction(data: any) {
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

    await prisma.$transaction(async (tx) => {
      // Buat transaksi
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

      // Update saldo wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: type === "pemasukan" ? amount : -amount,
          },
        },
      })
    })

    // Revalidasi halaman
    revalidatePath("/")
    revalidatePath("/insights")

    return { success: true }
  } catch (error) {
    console.error("Error saving transaction:", error)
    throw new Error("Gagal menyimpan transaksi")
  }
}

// Fungsi untuk konversi antar wallet
export async function saveConvertTransaction(data: {
  tanggal: string
  sourceWallet: string
  targetWallet: string
  amount: string
  sourceAdminFee: string
  targetAdminFee: string
  deskripsi?: string
}) {
  try {
    // Dapatkan wallet
    const sourceWalletData = await prisma.wallet.findFirst({
      where: { name: data.sourceWallet },
    })

    const targetWalletData = await prisma.wallet.findFirst({
      where: { name: data.targetWallet },
    })

    if (!sourceWalletData || !targetWalletData) {
      throw new Error("Wallet tidak ditemukan")
    }

    // Dapatkan kategori convert
    const convertCategory = await prisma.category.findFirst({
      where: { name: "CONVERT" },
    })

    if (!convertCategory) {
      throw new Error("Kategori CONVERT tidak ditemukan")
    }

    // Pastikan nilai adalah angka
    const sourceAdminFee = Number(data.sourceAdminFee) || 0
    const targetAdminFee = Number(data.targetAdminFee) || 0
    const amount = Number(data.amount) || 0

    await prisma.$transaction(async (tx) => {
      // Buat transaksi pengeluaran dari source wallet
      await tx.transaction.create({
        data: {
          date: new Date(data.tanggal),
          categoryId: convertCategory.id,
          walletId: sourceWalletData.id,
          amount: amount + sourceAdminFee,
          type: "pengeluaran",
          description: `Convert ke ${data.targetWallet}${sourceAdminFee > 0 ? ` (Biaya admin sumber: ${sourceAdminFee})` : ""}`,
          status: "lunas",
          sourceWalletId: sourceWalletData.id,
          targetWalletId: targetWalletData.id,
        },
      })

      // Buat transaksi pemasukan ke target wallet
      await tx.transaction.create({
        data: {
          date: new Date(data.tanggal),
          categoryId: convertCategory.id,
          walletId: targetWalletData.id,
          amount: amount - targetAdminFee,
          type: "pemasukan",
          description: `Convert dari ${data.sourceWallet}${targetAdminFee > 0 ? ` (Biaya admin tujuan: ${targetAdminFee})` : ""}`,
          status: "lunas",
          sourceWalletId: sourceWalletData.id,
          targetWalletId: targetWalletData.id,
        },
      })

      // Update saldo wallet
      await tx.wallet.update({
        where: { id: sourceWalletData.id },
        data: {
          balance: {
            decrement: amount + sourceAdminFee,
          },
        },
      })

      await tx.wallet.update({
        where: { id: targetWalletData.id },
        data: {
          balance: {
            increment: amount - targetAdminFee,
          },
        },
      })
    })

    // Revalidasi halaman
    revalidatePath("/")
    revalidatePath("/insights")

    return { success: true }
  } catch (error) {
    console.error("Error saving convert transaction:", error)
    throw new Error("Gagal menyimpan transaksi konversi")
  }
}

// Fungsi untuk menghapus transaksi
export async function deleteTransaction(id: string) {
  try {
    // Dapatkan transaksi sebelum dihapus
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { wallet: true },
    })

    if (!transaction) {
      throw new Error("Transaksi tidak ditemukan")
    }

    await prisma.$transaction(async (tx) => {
      // Hapus transaksi
      await tx.transaction.delete({
        where: { id },
      })

      // Update saldo wallet
      if (transaction.type === "pemasukan") {
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              decrement: transaction.amount,
            },
          },
        })
      } else if (transaction.type === "pengeluaran") {
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              increment: transaction.amount,
            },
          },
        })
      }
    })

    // Revalidasi halaman
    revalidatePath("/")
    revalidatePath("/insights")

    return { success: true }
  } catch (error) {
    console.error("Error deleting transaction:", error)
    throw new Error("Gagal menghapus transaksi")
  }
}

// Fungsi untuk memperbarui transaksi
export async function updateTransaction(data: any) {
  try {
    // Dapatkan transaksi asli
    const originalTransaction = await prisma.transaction.findUnique({
      where: { id: data.id },
      include: { wallet: true },
    })

    if (!originalTransaction) {
      throw new Error("Transaksi tidak ditemukan")
    }

    // Dapatkan kategori dan wallet
    const category = await prisma.category.findFirst({
      where: { name: data.kategori },
    })

    const wallet = await prisma.wallet.findFirst({
      where: { name: data.jenisTransaksi },
    })

    if (!category || !wallet) {
      throw new Error("Kategori atau wallet tidak ditemukan")
    }

    const newAmount = Number(data.pemasukan) || Number(data.pengeluaran)
    const newType = Number(data.pemasukan) > 0 ? "pemasukan" : "pengeluaran"

    await prisma.$transaction(async (tx) => {
      // Update transaksi
      await tx.transaction.update({
        where: { id: data.id },
        data: {
          date: new Date(data.tanggal),
          categoryId: category.id,
          walletId: wallet.id,
          amount: newAmount,
          type: newType,
          description: data.deskripsi,
          status: data.status,
        },
      })

      // Update saldo wallet jika wallet sama
      if (originalTransaction.walletId === wallet.id) {
        // Kembalikan saldo lama
        let balanceAdjustment = 0
        if (originalTransaction.type === "pemasukan") {
          balanceAdjustment -= originalTransaction.amount
        } else {
          balanceAdjustment += originalTransaction.amount
        }

        // Tambahkan saldo baru
        if (newType === "pemasukan") {
          balanceAdjustment += newAmount
        } else {
          balanceAdjustment -= newAmount
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: balanceAdjustment,
            },
          },
        })
      } else {
        // Wallet berbeda, update keduanya
        // Kembalikan saldo wallet lama
        if (originalTransaction.type === "pemasukan") {
          await tx.wallet.update({
            where: { id: originalTransaction.walletId },
            data: {
              balance: {
                decrement: originalTransaction.amount,
              },
            },
          })
        } else {
          await tx.wallet.update({
            where: { id: originalTransaction.walletId },
            data: {
              balance: {
                increment: originalTransaction.amount,
              },
            },
          })
        }

        // Update saldo wallet baru
        if (newType === "pemasukan") {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: {
                increment: newAmount,
              },
            },
          })
        } else {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: {
                decrement: newAmount,
              },
            },
          })
        }
      }
    })

    // Revalidasi halaman
    revalidatePath("/")
    revalidatePath("/insights")

    return { success: true }
  } catch (error) {
    console.error("Error updating transaction:", error)
    throw new Error("Gagal memperbarui transaksi")
  }
}

// Fungsi untuk mendapatkan ringkasan keuangan
export async function getSummary() {
  try {
    // Dapatkan semua transaksi
    const transactions = await prisma.transaction.findMany()

    // Dapatkan semua wallet
    const wallets = await prisma.wallet.findMany()

    // Hitung total pemasukan dan pengeluaran
    let totalPemasukan = 0
    let totalPengeluaran = 0

    transactions.forEach((transaction) => {
      if (transaction.type === "pemasukan") {
        totalPemasukan += transaction.amount
      } else if (transaction.type === "pengeluaran") {
        totalPengeluaran += transaction.amount
      }
    })

    const saldoTotal = totalPemasukan - totalPengeluaran

    // Format wallet untuk frontend
    const formattedWallets = wallets.map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      icon: wallet.icon || "",
      color: wallet.color,
      balance: wallet.balance,
      type: wallet.type || "other",
      description: wallet.description || "",
    }))

    return {
      totalPemasukan,
      totalPengeluaran,
      saldoTotal,
      wallets: formattedWallets,
    }
  } catch (error) {
    console.error("Error fetching summary:", error)
    throw new Error("Gagal mengambil data ringkasan")
  }
}

// Fungsi untuk mendapatkan wallet
export async function getWallets() {
  try {
    const wallets = await prisma.wallet.findMany()

    return wallets.map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      icon: wallet.icon || "",
      color: wallet.color,
      balance: wallet.balance,
      type: wallet.type || "other",
      description: wallet.description || "",
    }))
  } catch (error) {
    console.error("Error fetching wallets:", error)
    throw new Error("Gagal mengambil data wallet")
  }
}

// Fungsi untuk mendapatkan kategori
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany()

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      type: category.type,
      icon: category.icon || "📦",
      description: category.description || "",
    }))
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw new Error("Gagal mengambil data kategori")
  }
}

// Fungsi untuk memperbarui pengaturan
export async function updateSettings(type: "wallets" | "categories", data: any[]) {
  try {
    if (type === "wallets") {
      // Hapus wallet yang tidak ada di data baru
      const existingWallets = await prisma.wallet.findMany()
      const newWalletIds = data.map((w) => w.id).filter(Boolean)

      for (const wallet of existingWallets) {
        if (!newWalletIds.includes(wallet.id)) {
          // Periksa apakah wallet digunakan dalam transaksi
          const transactionCount = await prisma.transaction.count({
            where: { walletId: wallet.id },
          })

          if (transactionCount === 0) {
            await prisma.wallet.delete({
              where: { id: wallet.id },
            })
          }
        }
      }

      // Update atau buat wallet baru
      for (const wallet of data) {
        if (wallet.id) {
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
              name: wallet.name,
              icon: wallet.icon,
              color: wallet.color,
              balance: Number(wallet.balance),
              type: wallet.type,
              description: wallet.description,
            },
          })
        } else {
          await prisma.wallet.create({
            data: {
              name: wallet.name,
              icon: wallet.icon,
              color: wallet.color,
              balance: Number(wallet.balance),
              type: wallet.type,
              description: wallet.description,
            },
          })
        }
      }
    } else if (type === "categories") {
      // Hapus kategori yang tidak ada di data baru
      const existingCategories = await prisma.category.findMany()
      const newCategoryIds = data.map((c) => c.id).filter(Boolean)

      for (const category of existingCategories) {
        if (!newCategoryIds.includes(category.id)) {
          // Periksa apakah kategori digunakan dalam transaksi
          const transactionCount = await prisma.transaction.count({
            where: { categoryId: category.id },
          })

          if (transactionCount === 0) {
            await prisma.category.delete({
              where: { id: category.id },
            })
          }
        }
      }

      // Update atau buat kategori baru
      for (const category of data) {
        if (category.id) {
          await prisma.category.update({
            where: { id: category.id },
            data: {
              name: category.name,
              color: category.color,
              type: category.type,
              icon: category.icon,
              description: category.description,
            },
          })
        } else {
          await prisma.category.create({
            data: {
              name: category.name,
              color: category.color,
              type: category.type,
              icon: category.icon,
              description: category.description,
            },
          })
        }
      }
    }

    // Revalidasi halaman
    revalidatePath("/")
    revalidatePath("/insights")

    return { success: true }
  } catch (error) {
    console.error(`Error updating ${type}:`, error)
    throw new Error(`Gagal memperbarui ${type}`)
  }
}

// Fungsi untuk inisialisasi data default jika database kosong
export async function initializeDefaultData() {
  try {
    // Periksa apakah ada kategori
    const categoryCount = await prisma.category.count()

    if (categoryCount === 0) {
      // Buat kategori default
      for (const category of DEFAULT_CATEGORIES) {
        await prisma.category.create({
          data: {
            name: category.name,
            color: category.color,
            type: category.type,
            icon: category.icon || "📦",
            description: category.description || "",
          },
        })
      }
    }

    // Periksa apakah ada wallet
    const walletCount = await prisma.wallet.count()

    if (walletCount === 0) {
      // Buat wallet default
      for (const wallet of DEFAULT_WALLETS) {
        await prisma.wallet.create({
          data: {
            name: wallet.name,
            color: wallet.color,
            balance: wallet.balance,
            icon: wallet.icon,
            type: wallet.type || "other",
            description: wallet.description || "",
          },
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error initializing default data:", error)
    throw new Error("Gagal menginisialisasi data default")
  }
}

