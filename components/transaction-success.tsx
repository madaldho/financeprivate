"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

interface CheckmarkProps {
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
}

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        delay: i * 0.2,
        type: "spring",
        duration: 1.5,
        bounce: 0.2,
        ease: "easeInOut",
      },
      opacity: { delay: i * 0.2, duration: 0.2 },
    },
  }),
}

export function Checkmark({ size = 100, strokeWidth = 2, color = "currentColor", className = "" }: CheckmarkProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      initial="hidden"
      animate="visible"
      className={className}
    >
      <title>Animated Checkmark</title>
      <motion.circle
        cx="50"
        cy="50"
        r="40"
        stroke={color}
        variants={draw}
        custom={0}
        style={{
          strokeWidth,
          strokeLinecap: "round",
          fill: "transparent",
        }}
      />
      <motion.path
        d="M30 50L45 65L70 35"
        stroke={color}
        variants={draw}
        custom={1}
        style={{
          strokeWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          fill: "transparent",
        }}
      />
    </motion.svg>
  )
}

interface TransactionSuccessProps {
  type: "pemasukan" | "pengeluaran" | "convert"
  amount: number
  category?: string
  wallet?: string
  sourceWallet?: string
  targetWallet?: string
  onClose: () => void
}

export function TransactionSuccess({
  type,
  amount,
  category,
  wallet,
  sourceWallet,
  targetWallet,
  onClose,
}: TransactionSuccessProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Set title and color based on transaction type
  let title = "Transaksi Berhasil"
  let color = "rgb(16 185 129)" // Green for default

  if (type === "pemasukan") {
    title = "Pemasukan Berhasil"
    color = "rgb(16 185 129)" // Green
  } else if (type === "pengeluaran") {
    title = "Pengeluaran Berhasil"
    color = "rgb(239 68 68)" // Red
  } else if (type === "convert") {
    title = "Konversi Berhasil"
    color = "rgb(59 130 246)" // Blue
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onClick={onClose}>
      <Card
        className="w-full max-w-sm mx-auto p-6 min-h-[300px] flex flex-col justify-center bg-white border-zinc-200 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="space-y-4 flex flex-col items-center justify-center">
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1],
              scale: {
                type: "spring",
                damping: 15,
                stiffness: 200,
              },
            }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 blur-xl rounded-full"
                style={{ backgroundColor: `${color}20` }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.2,
                  duration: 0.8,
                  ease: "easeOut",
                }}
              />
              <Checkmark
                size={80}
                strokeWidth={4}
                color={color}
                className="relative z-10 drop-shadow-[0_0_10px_rgba(0,0,0,0.1)]"
              />
            </div>
          </motion.div>
          <motion.div
            className="space-y-2 text-center w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2,
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <motion.h2
              className="text-lg text-zinc-900 tracking-tighter font-semibold uppercase"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
            >
              {title}
            </motion.h2>
            <div className="flex items-center gap-4">
              <motion.div
                className="flex-1 bg-zinc-50/50 rounded-xl p-3 border border-zinc-200/50 backdrop-blur-md"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 1.2,
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                {type === "convert" ? (
                  <div className="flex flex-col items-start gap-2">
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                        <svg
                          className="w-3 h-3"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <title>From</title>
                          <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                        Dari
                      </span>
                      <div className="flex items-center gap-2.5 group transition-all">
                        <span className="font-medium text-zinc-900 tracking-tight">{sourceWallet}</span>
                      </div>
                    </div>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent" />
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                        <svg
                          className="w-3 h-3"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <title>To</title>
                          <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                        Ke
                      </span>
                      <div className="flex items-center gap-2.5 group transition-all">
                        <span className="font-medium text-zinc-900 tracking-tight">{targetWallet}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-2">
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">Nominal</span>
                      <div className="flex items-center gap-2.5 group transition-all">
                        <span className="font-medium text-zinc-900 tracking-tight">{formatCurrency(amount)}</span>
                      </div>
                    </div>
                    {category && (
                      <>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent" />
                        <div className="space-y-1.5">
                          <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">Kategori</span>
                          <div className="flex items-center gap-2.5 group transition-all">
                            <span className="font-medium text-zinc-900 tracking-tight">{category}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {wallet && (
                      <>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent" />
                        <div className="space-y-1.5">
                          <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">Dompet</span>
                          <div className="flex items-center gap-2.5 group transition-all">
                            <span className="font-medium text-zinc-900 tracking-tight">{wallet}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
            <motion.div
              className="w-full text-xs text-zinc-500 mt-2 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.4 }}
            >
              {new Date().toLocaleString("id-ID")}
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}

