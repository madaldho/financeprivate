import { google } from "googleapis"
import { prisma } from "./db"
import { SHEET_STRUCTURE } from "./sheet-config"
import { getAuthClient } from "./google-auth"

export async function syncToSheets() {
  const auth = await getAuthClient() // Reuse your existing auth function
  const sheets = google.sheets({ version: "v4", auth })

  try {
    // Sync wallets
    const wallets = await prisma.wallet.findMany()
    const walletRows = wallets.map((wallet) => [
      wallet.id,
      wallet.name,
      wallet.icon || "",
      wallet.color,
      wallet.balance.toString(),
      wallet.type,
      wallet.description || "",
    ])

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_STRUCTURE.WALLETS.name}!A2:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: walletRows,
      },
    })

    // Sync categories
    const categories = await prisma.category.findMany()
    const categoryRows = categories.map((category) => [
      category.id,
      category.name,
      category.color,
      category.type,
      category.icon || "",
      category.description || "",
    ])

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_STRUCTURE.CATEGORIES.name}!A2:F`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: categoryRows,
      },
    })

    // Sync transactions
    const transactions = await prisma.transaction.findMany({
      include: {
        category: true,
        wallet: true,
      },
    })

    const transactionRows = transactions.map((tx) => [
      tx.id,
      tx.date.toISOString().split("T")[0],
      tx.category.name,
      tx.wallet.name,
      tx.type === "pemasukan" ? tx.amount.toString() : "0",
      tx.type === "pengeluaran" ? tx.amount.toString() : "0",
      tx.description || "",
      tx.status,
      tx.createdAt.toISOString(),
    ])

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_STRUCTURE.TRANSACTIONS.name}!A2:I`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: transactionRows,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error syncing to sheets:", error)
    throw new Error("Failed to sync data to Google Sheets")
  }
}

