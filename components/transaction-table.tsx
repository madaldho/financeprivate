"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { TransactionSort } from "./transaction-sort"
import { getTransactions, deleteTransaction } from "@/lib/sheet-actions"
import { type Transaction, CATEGORY_COLORS } from "@/lib/sheet-config"
import { useToast } from "@/hooks/use-toast"

interface TransactionTableProps {
  filter: "semua" | "bulan-ini" | "bulan-lalu"
  onError?: (error: string) => void
}

export function TransactionTable({ filter, onError }: TransactionTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [sortBy, setSortBy] = useState("tanggal")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const { toast } = useToast()

  useEffect(() => {
    fetchTransactions()
  }, [filter, sortBy, sortOrder])

  async function fetchTransactions() {
    try {
      setLoading(true)
      const data = await getTransactions(filter, sortBy, sortOrder)
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      if (onError) onError("Gagal memuat data transaksi")
      toast({
        title: "Error",
        description: "Gagal memuat data transaksi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id)
      setTransactions(transactions.filter((t) => t.id !== id))
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil dihapus",
      })
    } catch (error) {
      console.error("Error deleting transaction:", error)
      if (onError) onError("Gagal menghapus transaksi")
      toast({
        title: "Error",
        description: "Gagal menghapus transaksi",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsEditDialogOpen(true)
  }

  const handleSort = (newSortBy: string, newOrder: "asc" | "desc") => {
    setSortBy(newSortBy)
    setSortOrder(newOrder)
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount))
  }

  const getCategoryBadgeColor = (category: string) => {
    const categoryKey = category.toUpperCase()
    return CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-md">
          <div className="h-10 border-b bg-muted/50 px-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center h-16 px-4 border-b">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">Tidak ada transaksi</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <TransactionSort onSort={handleSort} />
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Tanggal</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead className="text-right">Pemasukan</TableHead>
              <TableHead className="text-right">Pengeluaran</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {new Date(transaction.tanggal).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell>
                  <Badge
                    style={{
                      backgroundColor: getCategoryBadgeColor(transaction.kategori),
                      color: "white",
                    }}
                  >
                    {transaction.kategori}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.jenisTransaksi}</TableCell>
                <TableCell className="text-right font-medium text-green-600">
                  {Number(transaction.pemasukan) > 0 ? formatCurrency(transaction.pemasukan) : "-"}
                </TableCell>
                <TableCell className="text-right font-medium text-red-600">
                  {Number(transaction.pengeluaran) > 0 ? formatCurrency(transaction.pengeluaran) : "-"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{transaction.deskripsi}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(transaction)}>
                      <Edit className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => handleDelete(transaction.id)}
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditTransactionDialog
        transaction={editingTransaction}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  )
}

