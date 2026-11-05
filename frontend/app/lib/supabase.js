import { createClient } from "@supabase/supabase-js";

// Read Supabase configuration from environment variables
// Vite exposes env vars that start with VITE_ to the browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
  );
}

// Create and export the Supabase client
// This will be used to interact with Supabase Auth throughout the application
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
