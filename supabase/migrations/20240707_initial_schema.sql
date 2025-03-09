-- Create the tables for our finance app

-- Wallet table
CREATE TABLE IF NOT EXISTS "Wallet" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "icon" TEXT,
  "color" TEXT NOT NULL,
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "type" TEXT NOT NULL DEFAULT 'other',
  "description" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- Category table
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "icon" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- Transaction table
CREATE TABLE IF NOT EXISTS "Transaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "categoryId" TEXT NOT NULL REFERENCES "Category"("id"),
  "walletId" TEXT NOT NULL REFERENCES "Wallet"("id"),
  "amount" DOUBLE PRECISION NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'lunas',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sourceWalletId" TEXT REFERENCES "Wallet"("id"),
  "targetWalletId" TEXT REFERENCES "Wallet"("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Wallet_name_idx" ON "Wallet"("name");
CREATE INDEX IF NOT EXISTS "Wallet_isActive_idx" ON "Wallet"("isActive");
CREATE INDEX IF NOT EXISTS "Category_name_idx" ON "Category"("name");
CREATE INDEX IF NOT EXISTS "Category_type_idx" ON "Category"("type");
CREATE INDEX IF NOT EXISTS "Category_isActive_idx" ON "Category"("isActive");
CREATE INDEX IF NOT EXISTS "Transaction_date_idx" ON "Transaction"("date");
CREATE INDEX IF NOT EXISTS "Transaction_type_idx" ON "Transaction"("type");
CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX IF NOT EXISTS "Transaction_categoryId_idx" ON "Transaction"("categoryId");
CREATE INDEX IF NOT EXISTS "Transaction_walletId_idx" ON "Transaction"("walletId");

-- Enable Row Level Security (RLS)
ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you may want to restrict this in production)
CREATE POLICY "Allow public access to Wallet" ON "Wallet" FOR ALL USING (true);
CREATE POLICY "Allow public access to Category" ON "Category" FOR ALL USING (true);
CREATE POLICY "Allow public access to Transaction" ON "Transaction" FOR ALL USING (true);

