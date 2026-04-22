
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config';

// WARNING: using SERVICE_KEY in the client is insecure but requested by user for this internal/prototype dashboard.
// This allows bypassing RLS for Admin operations like creating users.
export const supabaseAdmin = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.SERVICE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'supabase-admin-auth-token'
    }
});
