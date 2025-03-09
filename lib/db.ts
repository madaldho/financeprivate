import { PrismaClient } from "@prisma/client"

// Create PrismaClient singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL,
      },
    },
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

// Add connection error handling
prisma
  .$connect()
  .then(() => {
    console.log("Successfully connected to the database")
  })
  .catch((e) => {
    console.error("Failed to connect to the database:", e)
  })

