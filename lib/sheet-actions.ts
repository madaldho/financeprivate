"use server"

import { google } from "googleapis"
import { v4 as uuidv4 } from "uuid"
import { SHEET_STRUCTURE } from "./sheet-config"
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS } from "./default-data"
import type { WalletBalance, Category, Transaction } from "./types"

// Add these imports at the top
import { getCache, setCache } from "./cache-utils"

// Konfigurasi Google Sheets API
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID

// Add retry mechanism for API calls
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries === 0) throw error
    await new Promise((resolve) => setTimeout(resolve, delay))
    return withRetry(fn, retries - 1, delay * 2)
  }
}

// Add data validation
function validateTransaction(data: any): boolean {
  return !!(
    data &&
    typeof data.tanggal === "string" &&
    typeof data.kategori === "string" &&
    typeof data.jenisTransaksi === "string" &&
    (typeof data.pemasukan === "string" || typeof data.pemasukan === "number") &&
    (typeof data.pengeluaran === "string" || typeof data.pengeluaran === "number")
  )
}

// Add data recovery mechanism
async function recoverDeletedData() {
  const auth = await getAuthClient()
  const sheets = google.sheets({ version: "v4", auth })

  // Get all transactions
  const transactions = await getTransactions()

  // Calculate expected balances
  const expectedBalances = new Map<string, number>()

  transactions.forEach((transaction) => {
    const wallet = transaction.jenisTransaksi
    if (!wallet) return

    const currentBalance = expectedBalances.get(wallet) || 0
    const newBalance = currentBalance + Number(transaction.pemasukan || 0) - Number(transaction.pengeluaran || 0)

    expectedBalances.set(wallet, newBalance)
  })

  // Get current balances
  const wallets = await getWallets()

  // Check and fix discrepancies
  for (const wallet of wallets) {
    const expectedBalance = expectedBalances.get(wallet.name) || 0
    if (Math.abs(expectedBalance - wallet.balance) > 0.01) {
      // Fix balance
      await updateWalletBalance(wallet.id, expectedBalance)

      // Log correction
      await logError(
        "Balance correction",
        `Corrected ${wallet.name} balance from ${wallet.balance} to ${expectedBalance}`,
      )
    }
  }
}

// Add transaction queue for better consistency
const transactionQueue: Array<() => Promise<void>> = []
let isProcessing = false

async function processTransactionQueue() {
  if (isProcessing) return
  isProcessing = true

  try {
    while (transactionQueue.length > 0) {
      const transaction = transactionQueue.shift()
      if (transaction) {
        await transaction()
      }
    }
  } finally {
    isProcessing = false
  }
}

// Konfigurasi Google Sheets API
export async function getAuthClient() {
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

// Tambahkan fungsi logging untuk debug
async function logError(message: string, error: any) {
  console.error(`${message}:`, error)

  // Tambahkan logging ke spreadsheet jika memungkinkan
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Logs!A:C",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[new Date().toISOString(), message, JSON.stringify(error)]],
      },
    })
  } catch (e) {
    console.error("Failed to log error to spreadsheet:", e)
  }
}

// Add this function to initialize sheets if they don't exist
async function initializeSheets() {
  const auth = await getAuthClient()
  const sheets = google.sheets({ version: "v4", auth })

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    const existingSheets = response.data.sheets?.map((sheet) => sheet.properties?.title) || []

    // Check and create each required sheet
    for (const [key, value] of Object.entries(SHEET_STRUCTURE)) {
      if (!existingSheets.includes(value.name)) {
        // Create sheet
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: value.name,
                  },
                },
              },
            ],
          },
        })

        // Add headers
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${value.name}!A1:Z1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [value.columns],
          },
        })

        // If it's categories or wallets, add default data
        if (key === "CATEGORIES") {
          await updateSettings("categories", DEFAULT_CATEGORIES)
        } else if (key === "WALLETS") {
          await updateSettings("wallets", DEFAULT_WALLETS)
        }
      }
    }

    return true
  } catch (error) {
    console.error("Error initializing sheets:", error)
    throw new Error("Gagal menginisialisasi spreadsheet")
  }
}

// Update the getWallets function
export async function getWallets(): Promise<WalletBalance[]> {
  try {
    await initializeSheets() // Ensure sheets exist

    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.WALLETS.name}!A2:G`,
    })

    const rows = response.data.values || []
    return rows.map((row) => ({
      id: row[0] || crypto.randomUUID(),
      name: row[1] || "",
      icon: row[2] || "",
      color: row[3] || "#000000",
      balance: Number(row[4]) || 0,
      type: row[5] || "other",
      description: row[6] || "",
    }))
  } catch (error) {
    console.error("Error fetching wallets:", error)
    throw new Error("Gagal mengambil data dompet")
  }
}

// Update the getCategories function
export async function getCategories(): Promise<Category[]> {
  try {
    await initializeSheets() // Ensure sheets exist

    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.CATEGORIES.name}!A2:F`,
    })

    const rows = response.data.values || []
    return rows.map((row) => ({
      id: row[0] || crypto.randomUUID(),
      name: row[1] || "",
      color: row[2] || "#000000",
      type: row[3] as Category["type"],
      icon: row[4] || "📦",
      description: row[5] || "",
    }))
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw new Error("Gagal mengambil data kategori")
  }
}

// Enhanced save transaction
export async function saveTransaction(data: any) {
  return new Promise((resolve, reject) => {
    transactionQueue.push(async () => {
      try {
        if (!validateTransaction(data)) {
          throw new Error("Invalid transaction data")
        }

        const result = await withRetry(async () => {
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

          // Update saldo wallet
          if (data.jenisTransaksi) {
            const wallets = await getWallets()
            const wallet = wallets.find((w) => w.name === data.jenisTransaksi)

            if (wallet) {
              const newBalance =
                Number(wallet.balance) + (Number(data.pemasukan) || 0) - (Number(data.pengeluaran) || 0)

              await updateWalletBalance(wallet.id, newBalance)
            }
          }

          return { success: true }
        })

        resolve(result)
      } catch (error) {
        console.error("Error saving transaction:", error)
        reject(new Error("Gagal menyimpan transaksi"))
      }
    })

    processTransactionQueue()
  })
}

// Update the saveConvertTransaction function
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
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    // Ambil data wallet
    const wallets = await getWallets()
    const sourceWallet = wallets.find((w) => w.name === data.sourceWallet)
    const targetWallet = wallets.find((w) => w.name === data.targetWallet)

    if (!sourceWallet || !targetWallet) {
      throw new Error("Wallet tidak ditemukan")
    }

    // Pastikan nilai adminFee adalah angka
    const sourceAdminFee = Number(data.sourceAdminFee) || 0
    const targetAdminFee = Number(data.targetAdminFee) || 0
    const amount = Number(data.amount) || 0

    // Buat transaksi pengeluaran dari source wallet (termasuk admin fee sumber)
    const sourceRow = [
      uuidv4(),
      data.tanggal,
      "CONVERT",
      data.sourceWallet,
      "0",
      (amount + sourceAdminFee).toString(),
      `Convert ke ${data.targetWallet}${sourceAdminFee > 0 ? ` (Biaya admin sumber: ${sourceAdminFee})` : ""}`,
      "lunas",
      new Date().toISOString(),
    ]

    // Buat transaksi pemasukan ke target wallet (dikurangi admin fee tujuan)
    const targetRow = [
      uuidv4(),
      data.tanggal,
      "CONVERT",
      data.targetWallet,
      (amount - targetAdminFee).toString(),
      "0",
      `Convert dari ${data.sourceWallet}${targetAdminFee > 0 ? ` (Biaya admin tujuan: ${targetAdminFee})` : ""}`,
      "lunas",
      new Date().toISOString(),
    ]

    // Tambahkan kedua transaksi
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.TRANSACTIONS.name}!A:I`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [sourceRow, targetRow],
      },
    })

    // Update saldo wallet
    const newSourceBalance = Number(sourceWallet.balance) - amount - sourceAdminFee
    const newTargetBalance = Number(targetWallet.balance) + amount - targetAdminFee

    await Promise.all([
      updateWalletBalance(sourceWallet.id, newSourceBalance),
      updateWalletBalance(targetWallet.id, newTargetBalance),
    ])

    return { success: true }
  } catch (error) {
    console.error("Error saving convert transaction:", error)
    throw new Error("Gagal menyimpan transaksi konversi")
  }
}

async function updateWalletBalance(walletId: string, newBalance: number) {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    // Cari indeks wallet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.WALLETS.name}!A:A`,
    })

    const rows = response.data.values || []
    let rowIndex = -1

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === walletId) {
        rowIndex = i + 1 // +1 karena spreadsheet dimulai dari 1
        break
      }
    }

    if (rowIndex === -1) {
      throw new Error("Wallet tidak ditemukan")
    }

    // Update saldo wallet
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.WALLETS.name}!E${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[newBalance]],
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating wallet balance:", error)
    throw new Error("Gagal mengupdate saldo wallet")
  }
}

// Enhanced delete transaction
export async function deleteTransaction(id: string) {
  return new Promise((resolve, reject) => {
    transactionQueue.push(async () => {
      try {
        const result = await withRetry(async () => {
          const auth = await getAuthClient()
          const sheets = google.sheets({ version: "v4", auth })

          // Get transaction before deletion
          const transaction = await getTransactionById(id)
          if (!transaction) {
            throw new Error("Transaksi tidak ditemukan")
          }

          // Delete the transaction
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_STRUCTURE.TRANSACTIONS.name}!A:A`,
          })

          const rows = response.data.values || []
          let rowIndex = -1

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

          const sheet = sheetsResponse.data.sheets?.find(
            (s) => s.properties?.title === SHEET_STRUCTURE.TRANSACTIONS.name,
          )

          if (!sheet?.properties?.sheetId) {
            throw new Error("Sheet tidak ditemukan")
          }

          // Delete row - Fixed the syntax error by removing the trailing backslash
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

          // Update wallet balance
          if (transaction.jenisTransaksi) {
            const wallets = await getWallets()
            const wallet = wallets.find((w) => w.name === transaction.jenisTransaksi)

            if (wallet) {
              const newBalance =
                Number(wallet.balance) - (Number(transaction.pemasukan) || 0) + (Number(transaction.pengeluaran) || 0)

              await updateWalletBalance(wallet.id, newBalance)
            }
          }

          return { success: true }
        })

        // Run data recovery after deletion
        await recoverDeletedData()

        resolve(result)
      } catch (error) {
        console.error("Error deleting transaction:", error)
        reject(new Error("Gagal menghapus transaksi"))
      }
    })

    processTransactionQueue()
  })
}

// Add periodic data validation
let lastValidationTime = 0
const VALIDATION_INTERVAL = 1000 * 60 * 60 // 1 hour

async function validateData() {
  const now = Date.now()
  if (now - lastValidationTime < VALIDATION_INTERVAL) return

  try {
    await recoverDeletedData()
    lastValidationTime = now
  } catch (error) {
    console.error("Error validating data:", error)
  }
}

// Add this to all data fetching functions
async function fetchWithValidation<T>(fn: () => Promise<T>): Promise<T> {
  await validateData()
  return fn()
}

// Update the get functions to use validation
export async function getTransactions(
  filter = "semua",
  sortBy = "tanggal",
  order: "asc" | "desc" = "desc",
): Promise<Transaction[]> {
  const cacheKey = `transactions-${filter}-${sortBy}-${order}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  return fetchWithValidation(async () => {
    try {
      const auth = await getAuthClient()
      const sheets = google.sheets({ version: "v4", auth })

      // Batch get all data at once
      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: SPREADSHEET_ID,
        ranges: [`${SHEET_STRUCTURE.TRANSACTIONS.name}!A:I`, `${SHEET_STRUCTURE.WALLETS.name}!A:G`],
      })

      const [transactionsResponse, walletsResponse] = response.data.valueRanges || []
      const rows = transactionsResponse.values || []
      if (rows.length <= 1) return []

      let transactions = rows.slice(1).map((row) => ({
        id: row[0] || "",
        tanggal: row[1] || "",
        kategori: row[2] || "",
        jenisTransaksi: row[3] || "",
        pemasukan: row[4] || "0",
        pengeluaran: row[5] || "0",
        deskripsi: row[6] || "",
        status: row[7] || "lunas",
        timestamp: row[8] || new Date().toISOString(),
      }))

      // Validate and fix any invalid data
      transactions = transactions.filter((t) => validateTransaction(t))

      // Apply filters
      if (filter === "bulan-ini") {
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        transactions = transactions.filter((t) => {
          const transactionDate = new Date(t.tanggal)
          return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
        })
      } else if (filter === "bulan-lalu") {
        const now = new Date()
        let lastMonth = now.getMonth() - 1
        let lastMonthYear = now.getFullYear()

        if (lastMonth < 0) {
          lastMonth = 11
          lastMonthYear--
        }

        transactions = transactions.filter((t) => {
          const transactionDate = new Date(t.tanggal)
          return transactionDate.getMonth() === lastMonth && transactionDate.getFullYear() === lastMonthYear
        })
      }

      // Add sorting
      const sortedTransactions = transactions.sort((a, b) => {
        if (sortBy === "tanggal") {
          return order === "desc"
            ? new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
            : new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
        }
        if (sortBy === "nominal") {
          const aValue = Number(a.pemasukan) - Number(a.pengeluaran)
          const bValue = Number(b.pemasukan) - Number(b.pengeluaran)
          return order === "desc" ? bValue - aValue : aValue - bValue
        }
        if (sortBy === "kategori") {
          const aValue = a.kategori.toLowerCase()
          const bValue = b.kategori.toLowerCase()
          return order === "desc" ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue)
        }
        if (sortBy === "jenisTransaksi") {
          const aValue = a.jenisTransaksi.toLowerCase()
          const bValue = b.jenisTransaksi.toLowerCase()
          return order === "desc" ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue)
        }
        return 0
      })

      // Cache the results
      setCache(cacheKey, transactions)
      return sortedTransactions
    } catch (error) {
      console.error("Error fetching transactions:", error)
      // Try to get stale cache on error
      const staleCache = getCache(cacheKey)
      if (staleCache) return staleCache
      throw new Error("Gagal mengambil data transaksi")
    }
  })
}

export async function updateTransaction(data: Transaction) {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    // Get original transaction to calculate balance difference
    const originalTransaction = await getTransactionById(data.id)
    if (!originalTransaction) {
      throw new Error("Transaksi tidak ditemukan")
    }

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
            data.tanggal,
            data.kategori,
            data.jenisTransaksi,
            data.pemasukan,
            data.pengeluaran,
            data.deskripsi || "",
            data.status,
            data.timestamp || new Date().toISOString(),
          ],
        ],
      },
    })

    // Update wallet balances if necessary
    if (originalTransaction.jenisTransaksi === data.jenisTransaksi) {
      // Same wallet, just update the balance difference
      const wallets = await getWallets()
      const wallet = wallets.find((w) => w.name === data.jenisTransaksi)

      if (wallet) {
        const incomeDiff = Number(data.pemasukan) - Number(originalTransaction.pemasukan)
        const expenseDiff = Number(data.pengeluaran) - Number(originalTransaction.pengeluaran)
        const newBalance = Number(wallet.balance) + incomeDiff - expenseDiff

        await updateWalletBalance(wallet.id, newBalance)
      }
    } else {
      // Different wallets, update both
      const wallets = await getWallets()
      const oldWallet = wallets.find((w) => w.name === originalTransaction.jenisTransaksi)
      const newWallet = wallets.find((w) => w.name === data.jenisTransaksi)

      if (oldWallet) {
        const oldBalance =
          Number(oldWallet.balance) - Number(originalTransaction.pemasukan) + Number(originalTransaction.pengeluaran)

        await updateWalletBalance(oldWallet.id, oldBalance)
      }

      if (newWallet) {
        const newBalance = Number(newWallet.balance) + Number(data.pemasukan) - Number(data.pengeluaran)

        await updateWalletBalance(newWallet.id, newBalance)
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating transaction:", error)
    throw new Error("Gagal memperbarui transaksi")
  }
}

async function getTransactionById(id: string): Promise<Transaction | null> {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_STRUCTURE.TRANSACTIONS.name}!A:I`,
    })

    const rows = response.data.values || []

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === id) {
        return {
          id: rows[i][0],
          tanggal: rows[i][1],
          kategori: rows[i][2],
          jenisTransaksi: rows[i][3],
          pemasukan: rows[i][4],
          pengeluaran: rows[i][5],
          deskripsi: rows[i][6],
          status: rows[i][7],
          timestamp: rows[i][8],
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error getting transaction:", error)
    throw new Error("Gagal mendapatkan data transaksi")
  }
}

// Update getSummary to use cached data
export async function getSummary() {
  const cacheKey = "summary"
  const cached = getCache(cacheKey)
  if (cached) return cached

  try {
    const [transactions, wallets] = await Promise.all([getTransactions(), getWallets()])

    let totalPemasukan = 0
    let totalPengeluaran = 0

    transactions.forEach((transaction) => {
      totalPemasukan += Number(transaction.pemasukan)
      totalPengeluaran += Number(transaction.pengeluaran)
    })

    const saldoTotal = totalPemasukan - totalPengeluaran
    const summary = {
      totalPemasukan,
      totalPengeluaran,
      saldoTotal,
      wallets,
    }

    setCache(cacheKey, summary)
    return summary
  } catch (error) {
    console.error("Error fetching summary:", error)
    // Try to get stale cache on error
    const staleCache = getCache(cacheKey)
    if (staleCache) return staleCache
    throw new Error("Gagal mengambil data summary")
  }
}

export async function updateSettings(type: "wallets" | "categories", data: WalletBalance[] | Category[]) {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    // Clear existing data
    const sheetName = type === "wallets" ? SHEET_STRUCTURE.WALLETS.name : SHEET_STRUCTURE.CATEGORIES.name

    // Get sheet ID
    const sheetsResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    const sheet = sheetsResponse.data.sheets?.find((s) => s.properties?.title === sheetName)

    if (!sheet?.properties?.sheetId) {
      throw new Error("Sheet tidak ditemukan")
    }

    // Get row count
    const countResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:A`,
    })

    const rowCount = countResponse.data.values?.length || 0

    if (rowCount > 1) {
      // Clear existing data (except header)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: sheet.properties.sheetId,
                  dimension: "ROWS",
                  startIndex: 1, // Start after header
                  endIndex: rowCount,
                },
              },
            },
          ],
        },
      })
    }

    // Prepare data for insert
    let values = []

    if (type === "wallets") {
      values = (data as WalletBalance[]).map((wallet) => [
        wallet.id || crypto.randomUUID(),
        wallet.name,
        wallet.icon || "",
        wallet.color || "#000000",
        wallet.balance || 0,
        wallet.type || "other",
        wallet.description || "",
      ])
    } else {
      values = (data as Category[]).map((category) => [
        category.id || crypto.randomUUID(),
        category.name,
        category.color || "#000000",
        category.type || "pengeluaran",
        category.icon || "📦",
        category.description || "",
      ])
    }

    // Insert new data
    if (values.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A2`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values,
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating settings:", error)
    throw new Error(`Gagal menyimpan pengaturan: ${error.message}`)
  }
}

export async function getWalletBalances(): Promise<WalletBalance[]> {
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
    console.error("Error fetching wallet balances:", error)
    throw new Error("Gagal mengambil data saldo dompet")
  }
}

// Function to recover data - this can be called from a client component
export async function recoverData() {
  try {
    await recoverDeletedData()
    return { success: true, message: "Data berhasil dipulihkan" }
  } catch (error) {
    console.error("Error recovering data:", error)
    return { success: false, message: "Gagal memulihkan data" }
  }
}

