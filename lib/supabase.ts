import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://kwbdisbjsfochkifoiql.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3YmRpc2Jqc2ZvY2hraWZvaXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1MTE0MjksImV4cCI6MjA1NzA4NzQyOX0.Bd9A5kTprvkDq63gLio1bL10iezNNUiFzOMl0aFwd74"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations that need more privileges
export const supabaseAdmin = createClient(
  supabaseUrl,
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3YmRpc2Jqc2ZvY2hraWZvaXFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTUxMTQyOSwiZXhwIjoyMDU3MDg3NDI5fQ.tgBYCjJY8TIYlO9mHSMfsBR4mDXfF5xJU6b0HIU5Wmo",
)

