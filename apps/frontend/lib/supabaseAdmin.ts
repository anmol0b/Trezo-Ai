import { createClient } from "@supabase/supabase-js";

type Database = {
  public: {
    Tables: {
      auth_nonces: {
        Row: {
          nonce: string;
          created_at: string | null;
          expires_at: string;
          used_at: string | null;
        };
        Insert: {
          nonce: string;
          created_at?: string | null;
          expires_at: string;
          used_at?: string | null;
        };
        Update: {
          nonce?: string;
          created_at?: string | null;
          expires_at?: string;
          used_at?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          wallet_public_key: string;
          last_login_at: string | null;
        };
        Insert: {
          wallet_public_key: string;
          last_login_at?: string | null;
        };
        Update: {
          wallet_public_key?: string;
          last_login_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let _client: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // In dev, we don't want missing env vars to crash unrelated pages/routes.
  // If these aren't set, callers should treat Supabase as "disabled".
  if (!supabaseUrl || !supabaseServiceKey) return null;

  _client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return _client;
}

