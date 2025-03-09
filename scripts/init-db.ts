import { initializeDatabase, disconnect } from "../lib/db-utils"

async function main() {
  try {
    console.log("Starting database initialization...")
    await initializeDatabase()
    console.log("Database initialization completed successfully!")
  } catch (error) {
    console.error("Database initialization failed:", error)
    process.exit(1)
  } finally {
    await disconnect()
  }
}

main()

