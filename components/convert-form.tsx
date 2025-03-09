"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { saveConvertTransaction, getWallets } from "@/lib/sheet-actions"
import { DialogClose } from "@/components/ui/dialog"
import type { WalletBalance } from "@/lib/types"
import { motion } from "framer-motion"
import { TransactionSuccess } from "./transaction-success"

const formSchema = z
  .object({
    tanggal: z.string().min(1, { message: "Tanggal wajib diisi" }),
    sourceWallet: z.string().min(1, { message: "Wallet sumber wajib diisi" }),
    targetWallet: z.string().min(1, { message: "Wallet tujuan wajib diisi" }),
    amount: z.string().min(1, { message: "Nominal wajib diisi" }),
    sourceAdminFee: z.string().default("0"),
    targetAdminFee: z.string().default("0"),
    deskripsi: z.string().optional(),
  })
  .refine((data) => data.sourceWallet !== data.targetWallet, {
    message: "Wallet sumber dan tujuan tidak boleh sama",
    path: ["targetWallet"],
  })

type ConvertFormProps = {
  onSuccess: () => void
}

export function ConvertForm({ onSuccess }: ConvertFormProps) {
  const [wallets, setWallets] = useState<WalletBalance[]>([])
  const [sourceWallet, setSourceWallet] = useState<WalletBalance | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [convertData, setConvertData] = useState<{
    amount: number
    sourceWallet: string
    targetWallet: string
  } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tanggal: new Date().toISOString().split("T")[0],
      sourceWallet: "",
      targetWallet: "",
      amount: "",
      sourceAdminFee: "0",
      targetAdminFee: "0",
      deskripsi: "",
    },
  })

  useEffect(() => {
    loadWallets()
  }, [])

  async function loadWallets() {
    try {
      const data = await getWallets()
      setWallets(data)
    } catch (error) {
      console.error("Error loading wallets:", error)
      setError("Gagal memuat data wallet")
    }
  }

  // Update source wallet when selection changes
  useEffect(() => {
    const sourceWalletName = form.watch("sourceWallet")
    if (sourceWalletName) {
      const wallet = wallets.find((w) => w.name === sourceWalletName)
      setSourceWallet(wallet || null)
    } else {
      setSourceWallet(null)
    }
  }, [form.watch("sourceWallet"), wallets])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setError(null)
      setIsSubmitting(true)

      // Validasi saldo cukup
      if (sourceWallet) {
        const totalDeduction = Number(values.amount) + Number(values.sourceAdminFee)
        if (totalDeduction > sourceWallet.balance) {
          setError(`Saldo ${sourceWallet.name} tidak cukup. Saldo saat ini: ${sourceWallet.balance}`)
          return
        }
      }

      await saveConvertTransaction({
        ...values,
        amount: values.amount,
        sourceAdminFee: values.sourceAdminFee,
        targetAdminFee: values.targetAdminFee,
      })

      // Set convert data for success animation
      setConvertData({
        amount: Number(values.amount),
        sourceWallet: values.sourceWallet,
        targetWallet: values.targetWallet,
      })

      // Show success animation
      setShowSuccess(true)

      // Reset form
      form.reset()

      // Call onSuccess after a delay to allow animation to play
      setTimeout(() => {
        onSuccess()
      }, 500)
    } catch (error) {
      console.error("Error saving convert transaction:", error)
      setError("Terjadi kesalahan saat menyimpan transaksi konversi")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-100 border border-red-400 text-red-700 rounded"
            >
              {error}
            </motion.div>
          )}

          <FormField
            control={form.control}
            name="tanggal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sourceWallet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Sumber</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih wallet sumber" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.name}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: wallet.color }} />
                            <span>
                              {wallet.name} ({formatCurrency(wallet.balance)})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetWallet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Tujuan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih wallet tujuan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.name}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: wallet.color }} />
                            <span>{wallet.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nominal (Rp)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sourceAdminFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biaya Admin Sumber (Rp)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetAdminFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biaya Admin Tujuan (Rp)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="deskripsi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsi</FormLabel>
                <FormControl>
                  <Textarea placeholder="Deskripsi transaksi (opsional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Konversi"}
            </Button>
          </div>
        </form>
      </Form>

      {showSuccess && convertData && (
        <TransactionSuccess
          type="convert"
          amount={convertData.amount}
          sourceWallet={convertData.sourceWallet}
          targetWallet={convertData.targetWallet}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </>
  )
}

