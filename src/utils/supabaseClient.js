import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config';

// Create a single supabase client for interacting with your database
export const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
