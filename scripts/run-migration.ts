import { execSync } from "child_process"
import fs from "fs"
import path from "path"

async function runMigration() {
  try {
    console.log("Running database migration...")

    // Get the migration SQL
    const migrationSql = fs.readFileSync(path.join(process.cwd(), "prisma/migrations/migration.sql"), "utf8")

    // Create a temporary file with the DATABASE_URL
    const tempEnvFile = path.join(process.cwd(), ".env.migration")
    fs.writeFileSync(tempEnvFile, `DATABASE_URL=${process.env.POSTGRES_URL_NON_POOLING}\n`)

    // Run the migration using prisma db execute
    execSync(`npx prisma db execute --file ./prisma/migrations/migration.sql --schema ./prisma/schema.prisma`, {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: process.env.POSTGRES_URL_NON_POOLING,
      },
    })

    console.log("Migration completed successfully!")

    // Clean up
    fs.unlinkSync(tempEnvFile)
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

runMigration()

