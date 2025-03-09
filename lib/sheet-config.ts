export const SHEET_STRUCTURE = {
  TRANSACTIONS: {
    name: "Transaksi",
    columns: [
      "ID",
      "Tanggal",
      "Kategori",
      "Jenis Transaksi",
      "Pemasukan",
      "Pengeluaran",
      "Deskripsi",
      "Status",
      "Timestamp",
    ],
  },
  WALLETS: {
    name: "Dompet",
    columns: ["ID", "Nama", "Icon", "Warna", "Saldo", "Tipe", "Keterangan"],
  },
  CATEGORIES: {
    name: "Kategori",
    columns: ["ID", "Nama", "Warna", "Tipe", "Icon", "Keterangan"],
  },
}

export const WALLET_ICONS = {
  DANA: "/logos/dana.png",
  OVO: "/logos/ovo.png",
  GOPAY: "/logos/gopay.png",
  SHOPEEPAY: "/logos/shopeepay.png",
  LINKAJA: "/logos/linkaja.png",
}

export const WALLET_COLORS = {
  DANA: "#0080ff",
  OVO: "#4c2785",
  GOPAY: "#00aa13",
  SHOPEEPAY: "#ee4d2d",
  LINKAJA: "#fe0000",
  CASH: "#2e7d32",
  BSI: "#8bc34a",
  "JAGO AYANG": "#ff9800",
  JAGO: "#ff5722",
  SEABANK: "#e91e63",
  default: "#757575",
}

export const CATEGORY_COLORS = {
  "MAKAN/JAJAN": "#ff9800",
  TRANSPORT: "#03a9f4",
  FIX: "#757575",
  KEBUTUHAN: "#9c27b0",
  NGEHUTANG: "#f44336",
  DIHUTANGI: "#ffc107",
  CONVERT: "#2196f3",
  BISNIS: "#4caf50",
  GAJI: "#8bc34a",
  HIBURAN: "#673ab7",
  LAINNYA: "#607d8b",
  default: "#757575",
}

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

// Import default data from separate file
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS } from "./default-data"
export { DEFAULT_CATEGORIES, DEFAULT_WALLETS }

