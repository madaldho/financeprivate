export type WalletType = {
  id: string
  name: string
  icon?: string
  color: string
  balance: number
}

export type CategoryType = {
  id: string
  name: string
  color: string
  type: "pemasukan" | "pengeluaran"
}

export type TransactionType = {
  id: string
  date: string
  category: string
  sourceWallet?: string
  targetWallet?: string
  amount: number
  description?: string
  type: "pemasukan" | "pengeluaran" | "transfer"
}

export type Settings = {
  wallets: WalletType[]
  categories: CategoryType[]
}

