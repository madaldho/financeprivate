export type WalletBalance = {
  id: string
  name: string
  icon?: string
  color: string
  balance: number
  type?: string
  description?: string
}

export type Category = {
  id: string
  name: string
  color: string
  type: "pemasukan" | "pengeluaran" | "transfer" | "convert"
  icon?: string
  description?: string
}

export type Transaction = {
  id: string
  tanggal: string
  kategori: string
  jenisTransaksi: string
  pemasukan: string
  pengeluaran: string
  deskripsi: string
  status: string
  timestamp: string
}

export type ConvertTransaction = {
  tanggal: string
  sourceWallet: string
  targetWallet: string
  amount: string
  sourceAdminFee: string
  targetAdminFee: string
  deskripsi?: string
}

