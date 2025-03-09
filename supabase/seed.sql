-- Insert sample categories
INSERT INTO "Category" (id, name, color, type, icon, description) VALUES
('cat_1', 'Gaji', '#4CAF50', 'pemasukan', '💰', 'Pendapatan dari pekerjaan'),
('cat_2', 'Bisnis', '#2196F3', 'pemasukan', '💼', 'Pendapatan dari bisnis'),
('cat_3', 'Makanan', '#FF9800', 'pengeluaran', '🍔', 'Pengeluaran untuk makanan'),
('cat_4', 'Transport', '#795548', 'pengeluaran', '🚗', 'Pengeluaran untuk transportasi'),
('cat_5', 'Belanja', '#9C27B0', 'pengeluaran', '🛍️', 'Pengeluaran untuk belanja'),
('cat_6', 'Convert', '#607D8B', 'convert', '🔄', 'Konversi antar wallet');

-- Insert sample wallets
INSERT INTO "Wallet" (id, name, color, type, icon, balance, description) VALUES
('wal_1', 'Cash', '#4CAF50', 'cash', '💵', 1000000, 'Uang tunai'),
('wal_2', 'Bank BCA', '#2196F3', 'bank', '🏦', 5000000, 'Rekening BCA'),
('wal_3', 'GoPay', '#9C27B0', 'ewallet', '📱', 250000, 'Dompet digital GoPay');

-- Insert sample transactions
INSERT INTO "Transaction" (id, date, categoryId, walletId, amount, type, description, status) VALUES
('trx_1', NOW() - INTERVAL '5 days', 'cat_1', 'wal_2', 5000000, 'pemasukan', 'Gaji bulan ini', 'lunas'),
('trx_2', NOW() - INTERVAL '3 days', 'cat_3', 'wal_1', 150000, 'pengeluaran', 'Makan siang', 'lunas'),
('trx_3', NOW() - INTERVAL '2 days', 'cat_4', 'wal_3', 50000, 'pengeluaran', 'Transportasi online', 'lunas'),
('trx_4', NOW() - INTERVAL '1 day', 'cat_5', 'wal_2', 500000, 'pengeluaran', 'Belanja bulanan', 'lunas');

