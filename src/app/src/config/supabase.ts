import { createClient } from "@supabase/supabase-js";

export const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  "https://xqanbblitsqasnkbbana.supabase.co";

export const supabaseAnonKey =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYW5iYmxpdHNxYXNua2JiYW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDI0MDgsImV4cCI6MjA4NTc3ODQwOH0.ZjyQHDfT5vf31s9izt7qNKKL0ZJk30o7FcHEjcSANEk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
