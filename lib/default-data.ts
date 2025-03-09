import type { Category, WalletBalance } from "./types"

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: crypto.randomUUID(),
    name: "DIHUTANGI",
    color: "#ffc107",
    type: "pemasukan",
    icon: "💰",
  },
  {
    id: crypto.randomUUID(),
    name: "CONVERT",
    color: "#2196f3",
    type: "convert",
    icon: "🔄",
  },
  {
    id: crypto.randomUUID(),
    name: "BISNIS",
    color: "#4caf50",
    type: "pemasukan",
    icon: "💼",
  },
  {
    id: crypto.randomUUID(),
    name: "GAJI",
    color: "#8bc34a",
    type: "pemasukan",
    icon: "💵",
  },
  {
    id: crypto.randomUUID(),
    name: "HIBURAN",
    color: "#673ab7",
    type: "pengeluaran",
    icon: "🎮",
  },
  {
    id: crypto.randomUUID(),
    name: "LAINNYA",
    color: "#607d8b",
    type: "pengeluaran",
    icon: "📦",
  },
]

export const DEFAULT_WALLETS: WalletBalance[] = [
  {
    id: crypto.randomUUID(),
    name: "CASH",
    color: "#2e7d32",
    balance: 0,
    icon: "💵",
    type: "cash",
  },
  {
    id: crypto.randomUUID(),
    name: "DANA",
    color: "#0080ff",
    balance: 0,
    icon: "💳",
    type: "ewallet",
  },
  {
    id: crypto.randomUUID(),
    name: "OVO",
    color: "#4c2785",
    balance: 0,
    icon: "💳",
    type: "ewallet",
  },
]

