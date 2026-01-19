
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dxeruzrkdrjaxkqixejn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZXJ1enJrZHJqYXhrcWl4ZWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzIyMzksImV4cCI6MjA4MDUwODIzOX0.1DzjUerqM9q0M0Uh8c_vdmX7Kct6tzZltM5xsTedK50';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
