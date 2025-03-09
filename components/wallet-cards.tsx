"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getWallets } from "@/lib/actions"
import type { WalletBalance } from "@/lib/types"
import { motion } from "framer-motion"

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {wallets.map((wallet, index) => (
        <motion.div
          key={wallet.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card
            className="relative overflow-hidden h-24 rounded-xl border-0 shadow-md hover:shadow-lg transition-shadow"
            style={{
              background: `linear-gradient(135deg, ${wallet.color}15, ${wallet.color}30)`,
            }}
          >
            <div className="absolute inset-0 p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {wallet.icon && (
                    <span className="text-lg" role="img" aria-label={wallet.name}>
                      {wallet.icon}
                    </span>
                  )}
                  <span className="font-medium text-sm truncate" style={{ color: wallet.color }}>
                    {wallet.name}
                  </span>
                </div>
              </div>
              <div className="text-lg font-bold truncate" style={{ color: wallet.color }}>
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(wallet.balance)}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

