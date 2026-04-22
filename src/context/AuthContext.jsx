
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient'; // Keep standard client for other ops
import { supabaseAdmin } from '../utils/supabaseAdmin'; // Use Admin client for Login to bypass RLS

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for persisted session (simple mechanism)
        const storedUser = localStorage.getItem('hr_dashboard_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Failed to parse stored user data:", error);
                localStorage.removeItem('hr_dashboard_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const cleanUsername = username.trim();
        const cleanPassword = password.trim();

        // 1. Fallback for Demo User (Agrocel requirements)
        // This is necessary because Supabase project might be paused or deleted
        if (
            (cleanUsername === 'demo@pucho.ai' || cleanUsername === 'SolarisHR') &&
            (cleanPassword === 'demo' || cleanPassword === 'Solaris@Pucho_678')
        ) {
            const demoData = {
                id: 'demo-uuid',
                name: 'Demo User',
                username: cleanUsername,
                email: 'demo@pucho.ai',
                role: 'admin'
            };
            setUser(demoData);
            localStorage.setItem('hr_dashboard_user', JSON.stringify(demoData));
            console.log('Login success: Fallback/Demo user authenticated.');
            return { success: true };
        }

        try {
            // 2. Standard Supabase Auth
            // Use supabaseAdmin to bypass Row Level Security (RLS) policies
            const { data, error } = await supabaseAdmin
                .from('users')
                .select('*')
                .or(`username.eq.${cleanUsername},email.eq.${cleanUsername}`)
                .eq('password', cleanPassword)
                .maybeSingle();

            console.log('Supabase Login access:', {
                attemptUsername: cleanUsername,
                success: !!data,
                error: error ? error.message : null
            });

            if (error) throw error;

            if (data) {
                setUser(data);
                localStorage.setItem('hr_dashboard_user', JSON.stringify(data));

                // Log the login (Optional: might fail if Supabase is down)
                try {
                    await supabase.from('login_logs').insert([
                        { user_name: data.name }
                    ]);
                } catch (logError) {
                    console.warn('Failed to log login to Supabase:', logError.message);
                }

                return { success: true };
            } else {
                return { success: false, message: 'Invalid credentials' };
            }
        } catch (error) {
            console.error('Login error:', error);
            // Handle specific network errors
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                return {
                    success: false,
                    message: 'Network Error: Supabase connection failed. Please check if the project is active or use demo credentials.'
                };
            }
            return { success: false, message: error.message || 'Login failed' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('hr_dashboard_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
