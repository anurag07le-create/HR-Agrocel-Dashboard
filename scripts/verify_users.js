
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../src/config.js';

const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.SERVICE_KEY);

async function testConnection() {
    console.log('Testing Supabase Connection...');
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) {
            console.error('Error fetching users:', error);
        } else {
            console.log('Successfully connected to users table.');
            console.log('User count:', data.length);
            if (data.length > 0) {
                console.log('Users found:', data);
            } else {
                console.log('No users found in the table. You may need to create one.');
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
