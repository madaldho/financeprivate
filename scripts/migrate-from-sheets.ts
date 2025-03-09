import { google } from "googleapis"
import { prisma } from "../lib/db"
import { getAuthClient } from "../lib/sheet-actions"
import { SHEET_STRUCTURE } from "../lib/sheet-config"

async function migrateFromSheets() {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: "v4", auth })

    // Migrate categories
    const categoriesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_STRUCTURE.CATEGORIES.name}!A2:F`,
    })

    const categoryRows = categoriesResponse.data.values || []
    for (const row of categoryRows) {
      await prisma.category.create({
        data: {
          id: row[0],
          name: row[1],
          color: row[2],
          type: row[3],
          icon: row[4],
          description: row[5],
        },
      })
    }

    // Migrate wallets
    const walletsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_STRUCTURE.WALLETS.name}!A2:G`,
    })

    const walletRows = walletsResponse.data.values || []
    for (const row of walletRows) {
      await prisma.wallet.create({
        data: {
          id: row[0],
          name: row[1],
          icon: row[2],
          color: row[3],
          balance: Number(row[4]),
          type: row[5],
          description: row[6],
        },
      })
    }

    // Migrate transactions
    const transactionsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_STRUCTURE.TRANSACTIONS.name}!A2:I`,
    })

    const transactionRows = transactionsResponse.data.values || []
    for (const row of transactionRows) {
      const category = await prisma.category.findFirst({
        where: { name: row[2] },
      })

      const wallet = await prisma.wallet.findFirst({
        where: { name: row[3] },
      })

      if (!category || !wallet) continue

      await prisma.transaction.create({
        data: {
          id: row[0],
          date: new Date(row[1]),
          categoryId: category.id,
          walletId: wallet.id,
          amount: Number(row[4]) || Number(row[5]),
          type: Number(row[4]) > 0 ? "pemasukan" : "pengeluaran",
          description: row[6],
          status: row[7],
          createdAt: new Date(row[8]),
        },
      })
    }

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
  }
}

migrateFromSheets()

