import { NextResponse } from "next/server"
import { initializeDefaultData } from "@/lib/actions"

export async function GET() {
  try {
    await initializeDefaultData()
    return NextResponse.json({ success: true, message: "Database initialized successfully" })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json({ success: false, error: "Failed to initialize database" }, { status: 500 })
  }
}

