"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { WalletType } from "@/types/finance"
import { getWallets } from "@/lib/actions"

export function WalletSummary() {
  const [wallets, setWallets] = useState<WalletType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWallets() {
      try {
        const data = await getWallets()
        setWallets(data)
      } catch (error) {
        console.error("Error fetching wallets:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWallets()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {wallets.map((wallet) => (
        <Card key={wallet.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: wallet.color }} />
                <span className="font-medium">{wallet.name}</span>
              </div>
              <span className="text-lg font-bold">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(wallet.balance)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

