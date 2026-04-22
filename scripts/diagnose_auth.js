
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../src/config.js';

const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.SERVICE_KEY);

async function checkDuplicates() {
    console.log('Checking for duplicates...');
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', 'SolarisHR');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data.length} user(s) with username 'SolarisHR'`);
        console.log(data);
    }
}

async function checkAnonPermissions() {
    const supabaseAnon = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

    console.log('\nChecking Anon SELECT * permissions...');
    const { data: selectData, error: selectError } = await supabaseAnon
        .from('users')
        .select('*')
        .limit(5);

    if (selectError) {
        console.log('Anon SELECT * FAILED:', selectError.message);
    } else {
        console.log('Anon SELECT * SUCCESS. Retrieved:', selectData.length, 'rows');
    }

    console.log('\nChecking Anon INSERT permissions...');
    const dummyUser = {
        name: 'Test Anon',
        username: 'test_anon_' + Date.now(),
        password: 'password',
        role: 'user',
        email: 'test@example.com',
        mobile: '1234567890'
    };

    const { data: insertData, error: insertError } = await supabaseAnon
        .from('users')
        .insert([dummyUser])
        .select();

    if (insertError) {
        console.log('Anon INSERT FAILED:', insertError.message);
    } else {
        console.log('Anon INSERT SUCCESS:', insertData);
        // Clean up
        await supabase.from('users').delete().eq('id', insertData[0].id);
    }
}

checkDuplicates().then(() => checkAnonPermissions());
