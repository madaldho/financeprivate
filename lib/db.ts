import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["error", "warn"],
  }).$extends({
    result: {
      transaction: {
        amount: {
          needs: {},
          compute(transaction) {
            // Ensure amount is always a number
            return Number(transaction.amount)
          },
        },
      },
      wallet: {
        balance: {
          needs: {},
          compute(wallet) {
            // Ensure balance is always a number
            return Number(wallet.balance)
          },
        },
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

// Add error handler
prisma.$on("error", (e) => {
  console.error("Prisma Error:", e)
})

// Tambahkan query logger
prisma.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
  return result
})

