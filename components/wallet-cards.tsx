"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getWallets } from "@/lib/sheet-actions"
import { type WalletBalance, WALLET_COLORS, WALLET_ICONS } from "@/lib/sheet-config"

export function WalletCards() {
  const [wallets, setWallets] = useState<WalletBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWallets()
  }, [])

  async function loadWallets() {
    try {
      setLoading(true)
      const data = await getWallets()
      setWallets(data)
    } catch (error) {
      console.error("Error loading wallets:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {wallets.map((wallet) => {
        const walletName = wallet.name.toUpperCase()
        const bgColor = WALLET_COLORS[walletName] || WALLET_COLORS.default
        const logoUrl = WALLET_ICONS[walletName]

        return (
          <Card
            key={wallet.id}
            className="overflow-hidden rounded-xl border-0 shadow-md"
            style={{
              background: `linear-gradient(135deg, ${bgColor}20, ${bgColor}40)`,
              borderColor: bgColor,
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                {logoUrl ? (
                  <img src={logoUrl || "/placeholder.svg"} alt={wallet.name} className="h-8 w-auto object-contain" />
                ) : (
                  <span className="font-medium text-lg" style={{ color: bgColor }}>
                    {wallet.name}
                  </span>
                )}
              </div>
              <div className="text-xl font-bold" style={{ color: bgColor }}>
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(wallet.balance)}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

