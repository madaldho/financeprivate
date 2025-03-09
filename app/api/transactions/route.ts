import { NextResponse } from "next/server"
import { TransactionService } from "@/lib/services/transaction-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "semua"
    const sortBy = searchParams.get("sortBy") || "tanggal"
    const order = (searchParams.get("order") || "desc") as "asc" | "desc"

    const transactions = await TransactionService.getTransactions(filter, sortBy, order)
    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Transaction API error:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const transaction = await TransactionService.createTransaction(data)
    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Transaction creation error:", error)
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}

