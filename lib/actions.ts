"use server"

import { supabase } from "./supabase"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS } from "./default-data"

// Fungsi untuk mendapatkan transaksi dengan filter
export async function getTransactions(filter = "semua", sortBy = "tanggal", order: "asc" | "desc" = "desc") {
  try {
    let query = supabase.from("Transaction").select(`
        *,
        category:Category(*),
        wallet:Wallet(*)
      `)

    if (filter === "bulan-ini") {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

      query = query.gte("date", startOfMonth).lte("date", endOfMonth)
    } else if (filter === "bulan-lalu") {
      const now = new Date()
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

      query = query.gte("date", startOfLastMonth).lte("date", endOfMonth)
    }

    // Tentukan pengurutan
    if (sortBy === "tanggal") {
      query = query.order("date", { ascending: order === "asc" })
    } else if (sortBy === "nominal") {
      query = query.order("amount", { ascending: order === "asc" })
    }

    const { data: transactions, error } = await query

    if (error) {
      throw error
    }

    // Format untuk frontend
    return transactions.map((tx) => ({
      id: tx.id,
      tanggal: format(new Date(tx.date), "yyyy-MM-dd"),
      kategori: tx.category.name,
      jenisTransaksi: tx.wallet.name,
      pemasukan: tx.type === "pemasukan" ? tx.amount.toString() : "0",
      pengeluaran: tx.type === "pengeluaran" ? tx.amount.toString() : "0",
      deskripsi: tx.description || "",
      status: tx.status,
      timestamp: tx.createdAt,
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
    const { data: categories, error: categoryError } = await supabase
      .from("Category")
      .select("*")
      .eq("name", kategori)
      .limit(1)

    if (categoryError || !categories || categories.length === 0) {
      throw new Error("Kategori tidak ditemukan")
    }

    const { data: wallets, error: walletError } = await supabase
      .from("Wallet")
      .select("*")
      .eq("name", jenisTransaksi)
      .limit(1)

    if (walletError || !wallets || wallets.length === 0) {
      throw new Error("Wallet tidak ditemukan")
    }

    const category = categories[0]
    const wallet = wallets[0]

    // Buat transaksi
    const amount = Number(pemasukan) || Number(pengeluaran)
    const type = Number(pemasukan) > 0 ? "pemasukan" : "pengeluaran"

    // Insert transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("Transaction")
      .insert({
        date: new Date(tanggal),
        categoryId: category.id,
        walletId: wallet.id,
        amount,
        type,
        description: deskripsi,
        status,
      })
      .select()
      .single()

    if (transactionError) {
      throw transactionError
    }

    // Update wallet balance
    const { error: updateError } = await supabase
      .from("Wallet")
      .update({
        balance: wallet.balance + (type === "pemasukan" ? amount : -amount),
      })
      .eq("id", wallet.id)

    if (updateError) {
      throw updateError
    }

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
    const { data: sourceWallets, error: sourceError } = await supabase
      .from("Wallet")
      .select("*")
      .eq("name", data.sourceWallet)
      .limit(1)

    if (sourceError || !sourceWallets || sourceWallets.length === 0) {
      throw new Error("Wallet sumber tidak ditemukan")
    }

    const { data: targetWallets, error: targetError } = await supabase
      .from("Wallet")
      .select("*")
      .eq("name", data.targetWallet)
      .limit(1)

    if (targetError || !targetWallets || targetWallets.length === 0) {
      throw new Error("Wallet tujuan tidak ditemukan")
    }

    // Dapatkan kategori convert
    const { data: categories, error: categoryError } = await supabase
      .from("Category")
      .select("*")
      .eq("name", "CONVERT")
      .limit(1)

    if (categoryError || !categories || categories.length === 0) {
      throw new Error("Kategori CONVERT tidak ditemukan")
    }

    const sourceWallet = sourceWallets[0]
    const targetWallet = targetWallets[0]
    const convertCategory = categories[0]

    // Pastikan nilai adalah angka
    const sourceAdminFee = Number(data.sourceAdminFee) || 0
    const targetAdminFee = Number(data.targetAdminFee) || 0
    const amount = Number(data.amount) || 0

    // Begin transaction
    // 1. Create transaction for source wallet (pengeluaran)
    const { error: sourceTransactionError } = await supabase.from("Transaction").insert({
      date: new Date(data.tanggal),
      categoryId: convertCategory.id,
      walletId: sourceWallet.id,
      amount: amount + sourceAdminFee,
      type: "pengeluaran",
      description: `Convert ke ${data.targetWallet}${sourceAdminFee > 0 ? ` (Biaya admin sumber: ${sourceAdminFee})` : ""}`,
      status: "lunas",
      sourceWalletId: sourceWallet.id,
      targetWalletId: targetWallet.id,
    })

    if (sourceTransactionError) {
      throw sourceTransactionError
    }

    // 2. Create transaction for target wallet (pemasukan)
    const { error: targetTransactionError } = await supabase.from("Transaction").insert({
      date: new Date(data.tanggal),
      categoryId: convertCategory.id,
      walletId: targetWallet.id,
      amount: amount - targetAdminFee,
      type: "pemasukan",
      description: `Convert dari ${data.sourceWallet}${targetAdminFee > 0 ? ` (Biaya admin tujuan: ${targetAdminFee})` : ""}`,
      status: "lunas",
      sourceWalletId: sourceWallet.id,
      targetWalletId: targetWallet.id,
    })

    if (targetTransactionError) {
      throw targetTransactionError
    }

    // 3. Update source wallet balance
    const { error: sourceUpdateError } = await supabase
      .from("Wallet")
      .update({
        balance: sourceWallet.balance - (amount + sourceAdminFee),
      })
      .eq("id", sourceWallet.id)

    if (sourceUpdateError) {
      throw sourceUpdateError
    }

    // 4. Update target wallet balance
    const { error: targetUpdateError } = await supabase
      .from("Wallet")
      .update({
        balance: targetWallet.balance + (amount - targetAdminFee),
      })
      .eq("id", targetWallet.id)

    if (targetUpdateError) {
      throw targetUpdateError
    }

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
    const { data: transaction, error: getError } = await supabase
      .from("Transaction")
      .select("*, wallet:Wallet(*)")
      .eq("id", id)
      .single()

    if (getError || !transaction) {
      throw new Error("Transaksi tidak ditemukan")
    }

    // Hapus transaksi
    const { error: deleteError } = await supabase.from("Transaction").delete().eq("id", id)

    if (deleteError) {
      throw deleteError
    }

    // Update saldo wallet
    const { error: updateError } = await supabase
      .from("Wallet")
      .update({
        balance:
          transaction.wallet.balance + (transaction.type === "pemasukan" ? -transaction.amount : transaction.amount),
      })
      .eq("id", transaction.walletId)

    if (updateError) {
      throw updateError
    }

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
    const { data: originalTransaction, error: getError } = await supabase
      .from("Transaction")
      .select("*, wallet:Wallet(*)")
      .eq("id", data.id)
      .single()

    if (getError || !originalTransaction) {
      throw new Error("Transaksi tidak ditemukan")
    }

    // Dapatkan kategori dan wallet
    const { data: categories, error: categoryError } = await supabase
      .from("Category")
      .select("*")
      .eq("name", data.kategori)
      .limit(1)

    if (categoryError || !categories || categories.length === 0) {
      throw new Error("Kategori tidak ditemukan")
    }

    const { data: wallets, error: walletError } = await supabase
      .from("Wallet")
      .select("*")
      .eq("name", data.jenisTransaksi)
      .limit(1)

    if (walletError || !wallets || wallets.length === 0) {
      throw new Error("Wallet tidak ditemukan")
    }

    const category = categories[0]
    const wallet = wallets[0]

    const newAmount = Number(data.pemasukan) || Number(data.pengeluaran)
    const newType = Number(data.pemasukan) > 0 ? "pemasukan" : "pengeluaran"

    // Update transaksi
    const { error: updateError } = await supabase
      .from("Transaction")
      .update({
        date: new Date(data.tanggal),
        categoryId: category.id,
        walletId: wallet.id,
        amount: newAmount,
        type: newType,
        description: data.deskripsi,
        status: data.status,
      })
      .eq("id", data.id)

    if (updateError) {
      throw updateError
    }

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

      const { error: walletUpdateError } = await supabase
        .from("Wallet")
        .update({
          balance: wallet.balance + balanceAdjustment,
        })
        .eq("id", wallet.id)

      if (walletUpdateError) {
        throw walletUpdateError
      }
    } else {
      // Wallet berbeda, update keduanya
      // Kembalikan saldo wallet lama
      if (originalTransaction.type === "pemasukan") {
        const { error: oldWalletError } = await supabase
          .from("Wallet")
          .update({
            balance: originalTransaction.wallet.balance - originalTransaction.amount,
          })
          .eq("id", originalTransaction.walletId)

        if (oldWalletError) {
          throw oldWalletError
        }
      } else {
        const { error: oldWalletError } = await supabase
          .from("Wallet")
          .update({
            balance: originalTransaction.wallet.balance + originalTransaction.amount,
          })
          .eq("id", originalTransaction.walletId)

        if (oldWalletError) {
          throw oldWalletError
        }
      }

      // Update saldo wallet baru
      if (newType === "pemasukan") {
        const { error: newWalletError } = await supabase
          .from("Wallet")
          .update({
            balance: wallet.balance + newAmount,
          })
          .eq("id", wallet.id)

        if (newWalletError) {
          throw newWalletError
        }
      } else {
        const { error: newWalletError } = await supabase
          .from("Wallet")
          .update({
            balance: wallet.balance - newAmount,
          })
          .eq("id", wallet.id)

        if (newWalletError) {
          throw newWalletError
        }
      }
    }

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
    const { data: transactions, error: transactionError } = await supabase.from("Transaction").select("*")

    if (transactionError) {
      throw transactionError
    }

    // Dapatkan semua wallet
    const { data: wallets, error: walletError } = await supabase.from("Wallet").select("*")

    if (walletError) {
      throw walletError
    }

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
    const { data: wallets, error } = await supabase.from("Wallet").select("*")

    if (error) {
      throw error
    }

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
    const { data: categories, error } = await supabase.from("Category").select("*")

    if (error) {
      throw error
    }

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
      // Get existing wallets with transactions
      const { data: existingWallets, error: existingError } = await supabase
        .from("Wallet")
        .select("id, transactions:Transaction(count)")

      if (existingError) {
        throw existingError
      }

      // Identify wallets that can be safely deleted (no transactions)
      const walletsWithoutTransactions = existingWallets
        .filter((w) => !w.transactions || w.transactions.length === 0)
        .map((w) => w.id)

      // Delete wallets without transactions
      if (walletsWithoutTransactions.length > 0) {
        const { error: deleteError } = await supabase.from("Wallet").delete().in("id", walletsWithoutTransactions)

        if (deleteError) {
          throw deleteError
        }
      }

      // Upsert wallets
      for (const wallet of data) {
        const { error: upsertError } = await supabase.from("Wallet").upsert({
          id: wallet.id,
          name: wallet.name,
          icon: wallet.icon,
          color: wallet.color,
          balance: Number(wallet.balance),
          type: wallet.type,
          description: wallet.description,
        })

        if (upsertError) {
          throw upsertError
        }
      }
    } else if (type === "categories") {
      // Get existing categories with transactions
      const { data: existingCategories, error: existingError } = await supabase
        .from("Category")
        .select("id, transactions:Transaction(count)")

      if (existingError) {
        throw existingError
      }

      // Identify categories that can be safely deleted (no transactions)
      const categoriesWithoutTransactions = existingCategories
        .filter((c) => !c.transactions || c.transactions.length === 0)
        .map((c) => c.id)

      // Delete categories without transactions
      if (categoriesWithoutTransactions.length > 0) {
        const { error: deleteError } = await supabase.from("Category").delete().in("id", categoriesWithoutTransactions)

        if (deleteError) {
          throw deleteError
        }
      }

      // Upsert categories
      for (const category of data) {
        const { error: upsertError } = await supabase.from("Category").upsert({
          id: category.id,
          name: category.name,
          color: category.color,
          type: category.type,
          icon: category.icon,
          description: category.description,
        })

        if (upsertError) {
          throw upsertError
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

// Fungsi initializeDefaultData
export async function initializeDefaultData() {
  try {
    // Periksa apakah sudah ada data
    const { count: categoryCount, error: categoryError } = await supabase
      .from("Category")
      .select("*", { count: "exact", head: true })

    if (categoryError) {
      throw categoryError
    }

    const { count: walletCount, error: walletError } = await supabase
      .from("Wallet")
      .select("*", { count: "exact", head: true })

    if (walletError) {
      throw walletError
    }

    if (categoryCount === 0) {
      // Buat kategori default
      const { error } = await supabase.from("Category").insert(
        DEFAULT_CATEGORIES.map((cat) => ({
          ...cat,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )

      if (error) {
        throw error
      }
    }

    if (walletCount === 0) {
      // Buat wallet default
      const { error } = await supabase.from("Wallet").insert(
        DEFAULT_WALLETS.map((wallet) => ({
          ...wallet,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )

      if (error) {
        throw error
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error initializing default data:", error)
    throw new Error("Gagal menginisialisasi data default")
  }
}

