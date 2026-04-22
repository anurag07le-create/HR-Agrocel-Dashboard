
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../src/config.js';

// Re-create the admin client here since we are in a script context (can't import from src easily without package.json "type": "module" acting up with relative imports sometimes, but here we are using the same config)
const supabaseAdmin = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.SERVICE_KEY);

async function testUserCreation() {
    console.log('Testing Admin User Creation...');
    const testUser = {
        name: '__Test Admin Creation__',
        username: 'test_admin_creation',
        password: 'password123',
        role: 'user',
        email: 'test_admin@example.com',
        mobile: '0000000000'
    };

    try {
        // 1. Insert
        console.log('Attempting INSERT...');
        const { data: insertData, error: insertError } = await supabaseAdmin
            .from('users')
            .insert([testUser])
            .select();

        if (insertError) {
            throw new Error(`Insert failed: ${insertError.message}`);
        }
        console.log('Insert Successful:', insertData[0]);

        // 2. Verify Login with this new user (Simulate AuthContext login)
        console.log('Verifying Login with new user...');
        const { data: loginData, error: loginError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('username', testUser.username)
            .eq('password', testUser.password)
            .maybeSingle();

        if (loginError || !loginData) {
            throw new Error(`Login verification failed: ${loginError?.message || 'No user found'}`);
        }
        console.log('Login Verification Successful!');

        // 3. Cleanup
        console.log('Cleaning up...');
        const { error: deleteError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', insertData[0].id);

        if (deleteError) console.error('Cleanup failed:', deleteError);
        else console.log('Cleanup Successful.');

    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}

testUserCreation();
