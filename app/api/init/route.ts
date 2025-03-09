import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS } from "@/lib/default-data"

export async function GET() {
  try {
    // Hapus semua data yang ada
    await prisma.$transaction([
      prisma.transaction.deleteMany(),
      prisma.category.deleteMany(),
      prisma.wallet.deleteMany(),
    ])

    // Buat kategori default
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    })

    // Buat wallet default
    await prisma.wallet.createMany({
      data: DEFAULT_WALLETS.map((wallet) => ({
        ...wallet,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    })

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize database",
      },
      { status: 500 },
    )
  }
}

