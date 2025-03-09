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
import { saveTransaction, getCategories, getWallets } from "@/lib/sheet-actions"
import { DialogClose } from "@/components/ui/dialog"
import type { Category, WalletBalance } from "@/lib/sheet-config"
import { TransactionSuccess } from "./transaction-success"

const formSchema = z.object({
  tanggal: z.string().min(1, { message: "Tanggal wajib diisi" }),
  kategori: z.string().min(1, { message: "Kategori wajib diisi" }),
  jenisTransaksi: z.string().min(1, { message: "Jenis transaksi wajib diisi" }),
  nominal: z.string().min(1, { message: "Nominal wajib diisi" }),
  deskripsi: z.string().optional(),
  status: z.string().default("lunas"),
})

type TransactionFormProps = {
  type: "pemasukan" | "pengeluaran"
  onSuccess: () => void
}

export function TransactionForm({ type, onSuccess }: TransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [wallets, setWallets] = useState<WalletBalance[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [transactionData, setTransactionData] = useState<{
    amount: number
    category: string
    wallet: string
  } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tanggal: new Date().toISOString().split("T")[0],
      kategori: "",
      jenisTransaksi: "",
      nominal: "",
      deskripsi: "",
      status: "lunas",
    },
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesData, walletsData] = await Promise.all([getCategories(), getWallets()])

        // Filter categories by type
        const filteredCategories = categoriesData.filter((cat) => cat.type === type || cat.type === "transfer")

        setCategories(filteredCategories)
        setWallets(walletsData)
      } catch (error) {
        console.error("Error loading form data:", error)
        setError("Gagal memuat data kategori dan dompet")
      }
    }

    loadData()
  }, [type])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setError(null)
      setIsSubmitting(true)

      // Format data untuk disimpan
      const transactionData = {
        ...values,
        type,
        pemasukan: type === "pemasukan" ? values.nominal : "0",
        pengeluaran: type === "pengeluaran" ? values.nominal : "0",
        timestamp: new Date().toISOString(),
      }

      // Simpan ke spreadsheet
      await saveTransaction(transactionData)

      // Set transaction data for success animation
      setTransactionData({
        amount: Number(values.nominal),
        category: values.kategori,
        wallet: values.jenisTransaksi,
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
      console.error("Error saving transaction:", error)
      setError("Terjadi kesalahan saat menyimpan transaksi")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

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

          <FormField
            control={form.control}
            name="kategori"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                          <span>{category.name}</span>
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
            name="jenisTransaksi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Transaksi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis transaksi" />
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

          <FormField
            control={form.control}
            name="nominal"
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

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="lunas">Lunas</SelectItem>
                    <SelectItem value="belum-lunas">Belum Lunas</SelectItem>
                  </SelectContent>
                </Select>
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
            <Button
              type="submit"
              className={type === "pemasukan" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Form>

      {showSuccess && transactionData && (
        <TransactionSuccess
          type={type}
          amount={transactionData.amount}
          category={transactionData.category}
          wallet={transactionData.wallet}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </>
  )
}

