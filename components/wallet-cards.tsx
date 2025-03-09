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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {wallets.map((wallet, index) => (
        <motion.div
          key={wallet.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden h-32 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute inset-0 opacity-10" style={{ backgroundColor: wallet.color }} />
            <div className="relative h-full p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl" role="img" aria-label={wallet.name}>
                    {wallet.icon}
                  </span>
                  <span className="font-medium text-sm">{wallet.name}</span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{wallet.type}</span>
              </div>
              <div className="text-xl font-bold">
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

