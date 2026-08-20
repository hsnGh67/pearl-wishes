import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xqanbblitsqasnkbbana.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYW5iYmxpdHNxYXNua2JiYW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDI0MDgsImV4cCI6MjA4NTc3ODQwOH0.ZjyQHDfT5vf31s9izt7qNKKL0ZJk30o7FcHEjcSANEk";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);