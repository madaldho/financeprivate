import { PrismaClient } from "@prisma/client"
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS } from "../lib/default-data"

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Initializing database...")

    // Buat kategori default
    console.log("Creating default categories...")
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

    // Buat wallet default
    console.log("Creating default wallets...")
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

    console.log("Database initialization completed successfully!")
  } catch (error) {
    console.error("Error initializing database:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

