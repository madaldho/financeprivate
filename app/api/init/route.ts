import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS } from "@/lib/default-data"

export async function GET() {
  try {
    console.log("Starting database initialization...")

    // Periksa apakah sudah ada data
    const categoryCount = await prisma.category.count()
    const walletCount = await prisma.wallet.count()

    console.log(`Existing data: ${categoryCount} categories, ${walletCount} wallets`)

    // Hapus semua data jika ada yang perlu diinisialisasi ulang
    if (categoryCount === 0 || walletCount === 0) {
      console.log("Deleting existing data...")

      // Hapus transaksi terlebih dahulu untuk menghindari foreign key constraints
      await prisma.transaction.deleteMany({})

      if (categoryCount === 0) {
        await prisma.category.deleteMany({})
      }

      if (walletCount === 0) {
        await prisma.wallet.deleteMany({})
      }

      // Buat kategori default jika diperlukan
      if (categoryCount === 0) {
        console.log("Creating default categories...")
        for (const category of DEFAULT_CATEGORIES) {
          await prisma.category.create({
            data: {
              id: category.id,
              name: category.name,
              color: category.color,
              type: category.type,
              icon: category.icon || "📦",
              description: category.description || "",
            },
          })
        }
      }

      // Buat wallet default jika diperlukan
      if (walletCount === 0) {
        console.log("Creating default wallets...")
        for (const wallet of DEFAULT_WALLETS) {
          await prisma.wallet.create({
            data: {
              id: wallet.id,
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
    }

    console.log("Database initialization completed")
    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}

