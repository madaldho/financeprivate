"use server"

import { google } from "googleapis"
import { v4 as uuidv4 } from "uuid"
import { SHEET_STRUCTURE } from "./sheet-config"
import type { WalletBalance, Category } from "./sheet-config"

// Konfigurasi Google Sheets API
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID

interface Transaction {
  id: string
  date: string
  category: string
  sourceWallet: string
  targetWallet: string
  amount: number
  description: string
  type: string
  timestamp: string
}

async function getAuthClient() {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY

    if (!clientEmail || !privateKey) {
      throw new Error("Credentials tidak lengkap")
    }

    const formattedKey = privateKey.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n")

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: formattedKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    return auth
  } catch (error) {
    console.error("Error setting up auth:", error)
    throw new Error(`Gagal setup auth: ${error.message}`)
  }
}

export async function getWallets(): Promise<WalletBalance[]> {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.WALLETS.name}!A2:E`,
    })

    const rows = response.data.values || []
    return rows.map((row) => ({
      id: row[0] || uuidv4(),
      name: row[1] || "",
      icon: row[2] || "",
      color: row[3] || "#000000",
      balance: Number(row[4]) || 0,
    }))
  } catch (error) {
    console.error("Error fetching wallets:", error)
    throw new Error("Gagal mengambil data dompet")
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.CATEGORIES.name}!A2:D`,
    })

    const rows = response.data.values || []
    return rows.map((row) => ({
      id: row[0] || uuidv4(),
      name: row[1] || "",
      color: row[2] || "#000000",
      type: row[3] as "pemasukan" | "pengeluaran" | "transfer",
    }))
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw new Error("Gagal mengambil data kategori")
  }
}

export async function saveTransaction(data: any) {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    // Format data untuk spreadsheet
    const row = [
      uuidv4(),
      data.tanggal,
      data.kategori,
      data.jenisTransaksi,
      data.pemasukan,
      data.pengeluaran,
      data.deskripsi || "",
      data.status,
      new Date().toISOString(),
    ]

    // Tambahkan transaksi
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.TRANSACTIONS.name}!A:I`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error saving transaction:", error)
    throw new Error("Gagal menyimpan transaksi")
  }
}

export async function deleteTransaction(id: string) {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    // Get all transactions
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.TRANSACTIONS.name}!A:I`,
    })

    const rows = response.data.values || []
    let rowIndex = -1

    // Find transaction row index
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === id) {
        rowIndex = i
        break
      }
    }

    if (rowIndex === -1) {
      throw new Error("Transaksi tidak ditemukan")
    }

    // Get sheet ID
    const sheetsResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    const sheet = sheetsResponse.data.sheets?.find((s) => s.properties?.title === SHEET_STRUCTURE.TRANSACTIONS.name)

    if (!sheet?.properties?.sheetId) {
      throw new Error("Sheet tidak ditemukan")
    }

    // Delete row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting transaction:", error)
    throw new Error("Gagal menghapus transaksi")
  }
}

export async function getTransactions(
  filter = "semua",
  sortBy = "date",
  order: "asc" | "desc" = "desc",
): Promise<Transaction[]> {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.TRANSACTIONS.name}!A:I`,
    })

    const rows = response.data.values || []
    if (rows.length <= 1) return []

    let transactions = rows.slice(1).map((row) => ({
      id: row[0],
      tanggal: row[1],
      kategori: row[2],
      jenisTransaksi: row[3],
      pemasukan: row[4],
      pengeluaran: row[5],
      deskripsi: row[6],
      status: row[7],
      timestamp: row[8],
    }))

    // Apply filters
    if (filter === "bulan-ini") {
      transactions = transactions.filter((t) => {
        const now = new Date()
        const transactionDate = new Date(t.timestamp)
        return now.getMonth() === transactionDate.getMonth() && now.getFullYear() === transactionDate.getFullYear()
      })
    } else if (filter === "bulan-lalu") {
      transactions = transactions.filter((t) => {
        const now = new Date()
        const lastMonth = now.getMonth() - 1
        const transactionDate = new Date(t.timestamp)
        return lastMonth === transactionDate.getMonth() && now.getFullYear() === transactionDate.getFullYear()
      })
    }

    // Add sorting
    const sortedTransactions = transactions.sort((a, b) => {
      if (sortBy === "date") {
        return order === "desc"
          ? new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
          : new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      }
      if (sortBy === "amount") {
        return order === "desc"
          ? Number(b.pemasukan) - Number(a.pemasukan) - Number(b.pengeluaran) + Number(a.pengeluaran)
          : Number(a.pemasukan) - Number(b.pemasukan) - Number(a.pengeluaran) + Number(b.pengeluaran)
      }
      if (sortBy === "category") {
        const aValue = a.kategori.toLowerCase()
        const bValue = b.kategori.toLowerCase()
        return order === "desc" ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue)
      }
      return 0
    })

    return sortedTransactions
  } catch (error) {
    console.error("Error fetching transactions:", error)
    throw new Error("Gagal mengambil data transaksi")
  }
}

export async function getSummary() {
  try {
    const transactions = await getTransactions()

    let totalPemasukan = 0
    let totalPengeluaran = 0

    transactions.forEach((transaction) => {
      totalPemasukan += Number(transaction.pemasukan)
      totalPengeluaran += Number(transaction.pengeluaran)
    })

    const saldoTotal = totalPemasukan - totalPengeluaran

    return {
      totalPemasukan,
      totalPengeluaran,
      saldoTotal,
    }
  } catch (error) {
    console.error("Error fetching summary:", error)
    throw new Error("Gagal mengambil data summary")
  }
}

export async function getWalletBalances(): Promise<any[]> {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.WALLETS.name}!A2:E`,
    })

    const rows = response.data.values || []
    return rows.map((row) => ({
      id: row[0],
      name: row[1],
      balance: Number(row[4]) || 0,
      color: row[3] || "#000000",
    }))
  } catch (error) {
    console.error("Error fetching wallet balances:", error)
    throw new Error("Gagal mengambil data saldo dompet")
  }
}

export async function updateSettings(type: string, data: any[]) {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    // Save to database/spreadsheet
    return { success: true }
  } catch (error) {
    console.error("Error updating settings:", error)
    throw new Error("Gagal menyimpan pengaturan")
  }
}

export async function updateTransaction(data: Transaction) {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    // Find the row index of the transaction
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.TRANSACTIONS.name}!A:A`,
    })

    const rows = response.data.values || []
    let rowIndex = -1

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        rowIndex = i + 1 // Add 1 because sheets are 1-based
        break
      }
    }

    if (rowIndex === -1) {
      throw new Error("Transaksi tidak ditemukan")
    }

    // Update the transaction
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.TRANSACTIONS.name}!A${rowIndex}:I${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            data.id,
            data.date,
            data.category,
            data.sourceWallet,
            data.targetWallet,
            data.amount,
            data.description || "",
            data.type,
            data.timestamp,
          ],
        ],
      },
    })

    // Update wallet balances if necessary
    if (data.type === "transfer") {
      await updateWalletBalances(data)
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating transaction:", error)
    throw new Error("Gagal memperbarui transaksi")
  }
}

async function updateWalletBalances(transaction: Transaction) {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    // Get current wallet balances
    const wallets = await getWallets()

    // Update balances based on transaction type
    const updatedWallets = wallets.map((wallet) => {
      if (wallet.name === transaction.sourceWallet) {
        return {
          ...wallet,
          balance: wallet.balance - transaction.amount,
        }
      }
      if (wallet.name === transaction.targetWallet) {
        return {
          ...wallet,
          balance: wallet.balance + transaction.amount,
        }
      }
      return wallet
    })

    // Save updated balances
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.WALLETS.name}!A2:E`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: updatedWallets.map((w) => [w.id, w.name, w.icon, w.color, w.balance]),
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating wallet balances:", error)
    throw new Error("Gagal memperbarui saldo dompet")
  }
}

