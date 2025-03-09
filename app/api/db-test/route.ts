import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Test Supabase connection
    const { data: walletData, error: walletError } = await supabase
      .from("Wallet")
      .select("count", { count: "exact", head: true })

    const { data: categoryData, error: categoryError } = await supabase
      .from("Category")
      .select("count", { count: "exact", head: true })

    const { data: transactionData, error: transactionError } = await supabase
      .from("Transaction")
      .select("count", { count: "exact", head: true })

    if (walletError || categoryError || transactionError) {
      throw new Error(`Database error: ${walletError?.message || categoryError?.message || transactionError?.message}`)
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        walletCount: walletData?.count || 0,
        categoryCount: categoryData?.count || 0,
        transactionCount: transactionData?.count || 0,
      },
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}

