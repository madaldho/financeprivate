import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS } from "@/lib/default-data"

export async function GET() {
  try {
    console.log("Starting database initialization...")

    // Test Supabase connection
    const { error: connectionError } = await supabase.from("Wallet").select("count", { count: "exact", head: true })

    if (connectionError) {
      throw new Error(`Supabase connection error: ${connectionError.message}`)
    }

    console.log("Database connection successful")

    // Check if data exists
    const { count: categoryCount, error: categoryError } = await supabase
      .from("Category")
      .select("*", { count: "exact", head: true })

    const { count: walletCount, error: walletError } = await supabase
      .from("Wallet")
      .select("*", { count: "exact", head: true })

    if (categoryError || walletError) {
      throw new Error(`Error checking data: ${categoryError?.message || walletError?.message}`)
    }

    console.log(`Existing data: ${categoryCount} categories, ${walletCount} wallets`)

    // Initialize data if needed
    if (!categoryCount || categoryCount === 0) {
      console.log("Creating default categories...")
      const { error } = await supabase.from("Category").insert(
        DEFAULT_CATEGORIES.map((category) => ({
          id: category.id,
          name: category.name,
          color: category.color,
          type: category.type,
          icon: category.icon || "📦",
          description: category.description || "",
        })),
      )

      if (error) {
        throw new Error(`Error creating categories: ${error.message}`)
      }
    }

    if (!walletCount || walletCount === 0) {
      console.log("Creating default wallets...")
      const { error } = await supabase.from("Wallet").insert(
        DEFAULT_WALLETS.map((wallet) => ({
          id: wallet.id,
          name: wallet.name,
          color: wallet.color,
          balance: wallet.balance,
          icon: wallet.icon,
          type: wallet.type || "other",
          description: wallet.description || "",
        })),
      )

      if (error) {
        throw new Error(`Error creating wallets: ${error.message}`)
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

