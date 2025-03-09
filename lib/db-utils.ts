import { PrismaClient } from "@prisma/client"
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS } from "./default-data"

// Maximum retry attempts for database operations
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Enhanced PrismaClient with retry logic
class EnhancedPrismaClient extends PrismaClient {
  async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        console.error(`Attempt ${i + 1} failed:`, error)
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (i + 1)))
      }
    }

    throw lastError
  }

  async healthCheck() {
    try {
      await this.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error("Database health check failed:", error)
      return false
    }
  }
}

// Create singleton instance
const globalForPrisma = globalThis as unknown as {
  prisma: EnhancedPrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new EnhancedPrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    errorFormat: "minimal",
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

// Database initialization function
export async function initializeDatabase() {
  try {
    // Check database connection
    const isHealthy = await prisma.healthCheck()
    if (!isHealthy) {
      throw new Error("Database health check failed")
    }

    // Check if data exists
    const [categoryCount, walletCount] = await Promise.all([prisma.category.count(), prisma.wallet.count()])

    if (categoryCount === 0 || walletCount === 0) {
      // Begin transaction
      await prisma.$transaction(async (tx) => {
        // Clear existing data if needed
        await tx.transaction.deleteMany({})

        if (categoryCount === 0) {
          await tx.category.deleteMany({})
          await tx.category.createMany({
            data: DEFAULT_CATEGORIES.map((cat) => ({
              ...cat,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          })
        }

        if (walletCount === 0) {
          await tx.wallet.deleteMany({})
          await tx.wallet.createMany({
            data: DEFAULT_WALLETS.map((wallet) => ({
              ...wallet,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          })
        }
      })
    }

    return true
  } catch (error) {
    console.error("Database initialization failed:", error)
    throw error
  }
}

// Cache management
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }

  return cached.data as T
}

export function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

export function clearCache(): void {
  cache.clear()
}

// Cleanup function for graceful shutdown
export async function disconnect() {
  await prisma.$disconnect()
}

// Error handling middleware
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage = "Database operation failed",
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error(`${errorMessage}:`, error)
    throw new Error(errorMessage)
  }
}

